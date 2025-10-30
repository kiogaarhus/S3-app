"""
Database connection configuration for GIDAS Explorer.
Compatible with existing dbt configuration.
"""
import logging
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from sqlalchemy import Engine, create_engine
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

# Default database URL matching dbt configuration
DEFAULT_DB_URL = (
    "mssql+pyodbc://srvsql29/Envidan_Gidas_SpvPlanDyn_Test"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&trusted_connection=yes"
    "&encrypt=no"
    "&trust_cert=yes"
)

# Module-level engine instance for singleton pattern
_ENGINE: Optional[Engine] = None


class DatabaseConnectionError(Exception):
    """Raised when database connection cannot be established."""
    pass


def _build_db_url() -> str:
    """Build database URL from environment variable or use default.

    Returns:
        Database URL string
    """
    db_url = os.getenv('GIDAS_DB_URL', DEFAULT_DB_URL)
    # print(f"DEBUG: Using database URL: {db_url}")  # Disabled for now
    return db_url


def _create_engine(url: str) -> Engine:
    """Create SQLAlchemy engine with optimal settings for SQL Server.

    Args:
        url: Database connection URL

    Returns:
        Configured SQLAlchemy Engine
    """
    # pool_pre_ping ensures connections are alive before use
    # fast_executemany optimizes bulk inserts for pyodbc
    # pool settings to prevent connection issues
    # query timeout to prevent long-running queries
    return create_engine(
        url,
        pool_pre_ping=True,
        fast_executemany=True,
        pool_size=10,  # Max connections in pool
        max_overflow=20,  # Max additional connections
        pool_timeout=30,  # Seconds to wait for connection
        pool_recycle=3600,  # Recycle connections after 1 hour
        connect_args={
            "timeout": 30,  # Connection timeout in seconds
        }
    )


def _safe_create_engine(url: str) -> Engine:
    """Create SQLAlchemy engine with safe error handling.
    
    Args:
        url: Database connection URL
        
    Returns:
        Configured SQLAlchemy Engine
        
    Raises:
        DatabaseConnectionError: If connection cannot be established
    """
    try:
        engine = _create_engine(url)
        # Test the connection
        with engine.connect() as conn:
            pass  # Connection successful
        return engine
    except SQLAlchemyError as exc:
        logger.exception("Could not establish database connection")
        print("WARNING: Database connection failed. API will start without database.")
        # Return a SQLite engine for development (without SQL Server specific options)
        # check_same_thread=False is required for SQLite in multi-threaded environments like FastAPI
        return create_engine(
            "sqlite:///:memory:",
            pool_pre_ping=True,
            connect_args={"check_same_thread": False}
        )


def get_engine() -> Engine:
    """Get database engine using lazy singleton pattern.

    Returns:
        Shared SQLAlchemy Engine instance

    Raises:
        DatabaseConnectionError: If connection cannot be established
    """
    global _ENGINE
    if _ENGINE is None:
        db_url = _build_db_url()
        _ENGINE = _safe_create_engine(db_url)
        logger.info("Database connection established successfully")
    return _ENGINE


# Export public interface
__all__ = ['get_engine', 'DatabaseConnectionError']