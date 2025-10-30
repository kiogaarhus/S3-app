"""
Database package for GIDAS Explorer.

Exports:
    - get_engine: Get SQLAlchemy engine
    - get_db: FastAPI dependency for database sessions
    - SessionLocal: Session factory
    - DBSessionMiddleware: Optional middleware for request-scope sessions
"""
from .connection import get_engine, DatabaseConnectionError
from .session import get_db, SessionLocal
from .middleware import DBSessionMiddleware

__all__ = [
    "get_engine",
    "DatabaseConnectionError",
    "get_db",
    "SessionLocal",
    "DBSessionMiddleware",
]
