"""
In-memory user models for basis authentication.
This is a temporary solution - will be replaced with database models in Task 7.
"""
from typing import Optional, Dict
from enum import Enum
from pydantic import BaseModel
from backend.core.security import get_password_hash, verify_password


class UserRole(str, Enum):
    """User roles enum."""
    ADMIN = "admin"
    SAGSBEHANDLER = "sagsbehandler"
    LAASER = "laaser"


class User(BaseModel):
    """User model."""
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.LAASER
    disabled: bool = False
    hashed_password: str


class InMemoryUserDB:
    """
    In-memory user database.
    Temporary solution until proper database is implemented.
    """

    def __init__(self):
        """Initialize with hardcoded admin user."""
        self.users: Dict[str, User] = {
            "admin": User(
                username="admin",
                email="admin@gidas.dk",
                full_name="Administrator",
                role=UserRole.ADMIN,
                disabled=False,
                hashed_password=get_password_hash("admin123")  # Change in production!
            ),
            "sagsbehandler": User(
                username="sagsbehandler",
                email="sagsbehandler@gidas.dk",
                full_name="Sagsbehandler Test",
                role=UserRole.SAGSBEHANDLER,
                disabled=False,
                hashed_password=get_password_hash("sag123")
            ),
            "laaser": User(
                username="laaser",
                email="laaser@gidas.dk",
                full_name="Læser Test",
                role=UserRole.LAASER,
                disabled=False,
                hashed_password=get_password_hash("laeser123")
            )
        }

    def get_user(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.users.get(username)

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate user with username and password.

        Args:
            username: Username
            password: Plain text password

        Returns:
            User object if authenticated, None otherwise
        """
        user = self.get_user(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if user.disabled:
            return None
        return user


# Global in-memory user database instance
user_db = InMemoryUserDB()
