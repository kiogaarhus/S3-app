"""
Pydantic schemas for dashboard endpoints.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """Dashboard statistics response schema."""
    total_projekttyper: int = Field(..., description="Total number of project types")
    active_projekter: int = Field(..., description="Number of active projects")
    total_projekter: int = Field(..., description="Total number of projects")
    total_haendelser: int = Field(..., description="Total number of events")
    active_haendelser: Optional[int] = Field(None, description="Number of active events with påbud")
    pending_sagsbehandling: int = Field(..., description="Number of pending case treatments")
    recent_imports: int = Field(..., description="Number of recent imports (last 30 days)")

    class Config:
        from_attributes = True


class RecentActivityItem(BaseModel):
    """Individual recent activity item schema."""
    id: int = Field(..., description="Activity item ID")
    type: str = Field(..., description="Activity type: haendelse, sagsstatus, or import")
    title: str = Field(..., description="Activity title/description")
    description: Optional[str] = Field(None, description="Detailed description with address info")
    timestamp: datetime = Field(..., description="Activity timestamp")
    status: Optional[str] = Field(None, description="Activity status")
    project_id: Optional[int] = Field(None, description="Related project ID if applicable")
    project_name: Optional[str] = Field(None, description="Related project name if applicable")

    class Config:
        from_attributes = True


class RecentActivityResponse(BaseModel):
    """Recent activity response with pagination."""
    items: list[RecentActivityItem] = Field(..., description="List of recent activities")
    total: int = Field(..., description="Total number of activities")
    page: int = Field(1, ge=1, description="Current page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    """Standard API response for dashboard stats."""
    success: bool = Field(True, description="Request success status")
    data: DashboardStats = Field(..., description="Dashboard statistics")
    meta: dict = Field(default_factory=lambda: {"timestamp": datetime.utcnow().isoformat(), "version": "1.0"})

    class Config:
        from_attributes = True


class RecentActivityAPIResponse(BaseModel):
    """Standard API response for recent activity."""
    success: bool = Field(True, description="Request success status")
    data: list[RecentActivityItem] = Field(..., description="Recent activity items")
    pagination: dict = Field(..., description="Pagination metadata")

    class Config:
        from_attributes = True
