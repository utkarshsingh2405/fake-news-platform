from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from typing import Optional
from ..models.user import User
from ..models.audit import AuditLog
from ..schemas.auth import UserCreate
from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def _truncate_password(self, password: str) -> bytes:
        """Truncate password to 72 bytes for bcrypt compatibility."""
        return password.encode('utf-8')[:72]

    def hash_password(self, password: str) -> str:
        truncated = self._truncate_password(password)
        return pwd_context.hash(truncated)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        truncated = self._truncate_password(plain_password)
        return pwd_context.verify(truncated, hashed_password)

    def create_user(self, user_data: UserCreate, ip_address: str = None) -> User:
        # Check if user exists
        existing = self.db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        if existing:
            raise ValueError("Email or username already exists")

        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=self.hash_password(user_data.password),
            full_name=user_data.full_name,
            is_active=True,
            is_admin=False
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        self.audit_log(user.id, "register", ip_address=ip_address)
        return user

    def create_admin_user(self, email: str, password: str, username: str) -> User:
        user = User(
            username=username,
            email=email,
            hashed_password=self.hash_password(password),
            is_active=True,
            is_admin=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        user.last_login = datetime.utcnow()
        self.db.commit()
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def create_tokens(self, user_id: int) -> dict:
        access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
        refresh_token_expires = timedelta(days=settings.jwt_refresh_token_expire_days)
        access_token = self._create_token({"sub": str(user_id), "type": "access"}, expires_delta=access_token_expires)
        refresh_token = self._create_token({"sub": str(user_id), "type": "refresh"}, expires_delta=refresh_token_expires)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    def _create_token(self, data: dict, expires_delta: timedelta = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(refresh_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            if payload.get("type") != "refresh":
                return None
            user_id = int(payload.get("sub"))
            new_access = self._create_token({"sub": str(user_id), "type": "access"}, timedelta(minutes=settings.jwt_access_token_expire_minutes))
            new_refresh = self._create_token({"sub": str(user_id), "type": "refresh"}, timedelta(days=settings.jwt_refresh_token_expire_days))
            return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
        except jwt.JWTError:
            return None

    def audit_log(self, user_id: int, action: str, resource: str = None, resource_id: int = None,
                  details: str = None, ip_address: str = None, user_agent: str = None):
        log = AuditLog(
            user_id=user_id, action=action, resource=resource, resource_id=resource_id,
            details=details, ip_address=ip_address, user_agent=user_agent
        )
        self.db.add(log)
        self.db.commit()

    def get_or_create_google_user(
        self,
        google_id: str,
        email: str,
        full_name: str = None,
        avatar_url: str = None,
        ip_address: str = None
    ) -> User:
        """Retrieve an existing user by google_id or email, or create a new one."""
        # Try by google_id first
        user = self.db.query(User).filter(User.google_id == google_id).first()
        if user:
            # Update profile picture if changed
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
            user.last_login = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)
            return user

        # Try by email (user may have registered with password before)
        user = self.get_user_by_email(email)
        if user:
            # Link google_id to existing account
            user.google_id = google_id
            user.avatar_url = avatar_url or user.avatar_url
            user.last_login = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)
            return user

        # Create brand-new Google user (no local password needed)
        import re
        base_username = re.sub(r"[^a-z0-9_]", "", email.split("@")[0].lower())[:30] or "user"
        username = base_username
        suffix = 1
        while self.get_user_by_username(username):
            username = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            username=username,
            email=email,
            hashed_password=None,  # No local password for Google accounts
            full_name=full_name,
            avatar_url=avatar_url,
            google_id=google_id,
            is_active=True,
            is_admin=False,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        self.audit_log(user.id, "google_register", ip_address=ip_address)
        return user