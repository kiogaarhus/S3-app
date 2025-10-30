"""
Pagination utilities for API endpoints.
Provides reusable pagination helper functions.
"""
from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query

T = TypeVar('T')


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Items per page")
    total: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    success: bool = True
    data: list[T]
    pagination: PaginationMeta


def paginate(
    query: Query,
    page: int = 1,
    per_page: int = 20,
    max_per_page: int = 100
) -> tuple[list[Any], PaginationMeta]:
    """
    Apply pagination to a SQLAlchemy query.

    Args:
        query: SQLAlchemy query object
        page: Page number (1-indexed)
        per_page: Items per page
        max_per_page: Maximum allowed items per page

    Returns:
        Tuple of (items, pagination_meta)
    """
    # Validate and limit per_page
    per_page = min(max(1, per_page), max_per_page)
    page = max(1, page)

    # Get total count
    total = query.count()

    # Calculate offset
    offset = (page - 1) * per_page

    # Fetch paginated items
    items = query.limit(per_page).offset(offset).all()

    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    # Create pagination metadata
    pagination_meta = PaginationMeta(
        page=page,
        per_page=per_page,
        total=total,
        total_pages=total_pages
    )

    return items, pagination_meta
