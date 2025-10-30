"""
Authentication schemas for request/response models.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema (decoded from JWT)."""
    username: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema (no password)."""
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    disabled: bool = False

    class Config:
        from_attributes = True
