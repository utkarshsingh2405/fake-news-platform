from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.auth_service import AuthService
from ..schemas.auth import UserCreate, UserLogin, Token, TokenRefresh, UserResponse, GoogleToken
from ..dependencies import get_current_active_user, loose_rate_limiter
from ..models.user import User
import httpx

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(loose_rate_limiter)
):
    """Register a new user."""
    auth_service = AuthService(db)
    
    # Check if user exists
    existing_user = auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_username = auth_service.get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    try:
        user = auth_service.create_user(user_data, ip_address=request.client.host if request.client else None)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return user

@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(loose_rate_limiter)
):
    """Login and get access token."""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = auth_service.create_tokens(user.id)
    
    # Log login
    auth_service.audit_log(
        user_id=user.id,
        action="login",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return tokens

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: TokenRefresh,
    db: Session = Depends(get_db),
    _: bool = Depends(loose_rate_limiter)
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    result = auth_service.refresh_access_token(refresh_data.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    return result

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Logout user (invalidate tokens - client-side removal)."""
    auth_service = AuthService(db)
    auth_service.audit_log(
        user_id=current_user.id,
        action="logout",
        ip_address=request.client.host if request else None
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user info."""
    return current_user


@router.post("/google", response_model=Token)
async def google_login(
    token_data: GoogleToken,
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(loose_rate_limiter)
):
    """Login or register using a Google ID token."""
    # Verify the Google ID token with Google's tokeninfo endpoint
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token_data.id_token}
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

    google_info = resp.json()

    # Ensure the token was issued for our app (skip if no CLIENT_ID configured)
    # google_info["aud"] should match GOOGLE_CLIENT_ID
    if "email" not in google_info or not google_info.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email not verified"
        )

    auth_service = AuthService(db)
    user = auth_service.get_or_create_google_user(
        google_id=google_info["sub"],
        email=google_info["email"],
        full_name=google_info.get("name"),
        avatar_url=google_info.get("picture"),
        ip_address=request.client.host if request.client else None
    )

    tokens = auth_service.create_tokens(user.id)
    auth_service.audit_log(
        user_id=user.id,
        action="google_login",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    return tokens