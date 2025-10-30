"""
Security utilities for authentication and authorization.
Handles JWT token generation/validation and password hashing.
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
from jose import JWTError, jwt
from backend.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    Uses SHA256 for simplicity (NOT production-ready).

    Args:
        plain_password: Plain text password
        hashed_password: SHA256 hashed password

    Returns:
        True if password matches, False otherwise
    """
    return get_password_hash(plain_password) == hashed_password


def get_password_hash(password: str) -> str:
    """
    Hash a password using SHA256.
    NOTE: This is for development only - use bcrypt in production!

    Args:
        password: Plain text password

    Returns:
        SHA256 hashed password
    """
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token (typically {"sub": username})
        expires_delta: Token expiration time (defaults to settings value)

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
