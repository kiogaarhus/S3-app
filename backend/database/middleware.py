"""
Database session middleware for GIDAS Explorer.

Optional middleware for managing database sessions at the request level.
For most endpoints, using the get_db() dependency is sufficient.
"""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.database.session import SessionLocal


class DBSessionMiddleware(BaseHTTPMiddleware):
    """
    Middleware that creates a database session for each request.

    The session is stored in request.state.db and automatically closed
    after the request completes.

    Note: This is optional. Most endpoints should use the get_db() dependency
    instead, which is more explicit and testable.

    Usage:
        app.add_middleware(DBSessionMiddleware)

        @app.get("/endpoint")
        def endpoint(request: Request):
            db = request.state.db
            # Use db session
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with database session."""
        # Create session
        db = SessionLocal()
        request.state.db = db

        try:
            # Process request
            response = await call_next(request)
            return response
        finally:
            # Always close session
            db.close()
