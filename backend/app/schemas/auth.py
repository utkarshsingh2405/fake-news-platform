from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    
    @field_validator("username")
    def username_alphanumeric(cls, v):
        if not v.isalnum() and "_" not in v:
            raise ValueError("Username must contain only letters, numbers and underscores")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleToken(BaseModel):
    """Schema for Google Sign-In ID token."""
    id_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True