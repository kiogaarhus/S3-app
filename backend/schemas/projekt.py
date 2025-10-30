"""
Pydantic schemas for AMOProjekt (Project).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProjektBase(BaseModel):
    """Base schema for project with common fields."""

    ProjekttypeID: Optional[int] = Field(None, description="Project type foreign key")
    Navn: Optional[str] = Field(None, max_length=255, description="Project name")
    Status: Optional[str] = Field(None, max_length=50, description="Project status")
    OprettetDato: Optional[datetime] = Field(None, description="Creation date")
    SidstOpdateret: Optional[datetime] = Field(None, description="Last updated date")


class ProjektCreate(ProjektBase):
    """Schema for creating a new project."""

    Navn: str = Field(..., min_length=1, max_length=255, description="Project name (required)")
    ProjekttypeID: int = Field(..., description="Project type ID (required)")


class ProjektUpdate(BaseModel):
    """Schema for updating an existing project (all fields optional)."""

    ProjekttypeID: Optional[int] = None
    Navn: Optional[str] = Field(None, min_length=1, max_length=255)
    Status: Optional[str] = Field(None, max_length=50)
    OprettetDato: Optional[datetime] = None
    SidstOpdateret: Optional[datetime] = None


class ProjektOut(ProjektBase):
    """Schema for project output (response)."""

    ID: int = Field(..., description="Project ID")

    model_config = ConfigDict(from_attributes=True)


class ProjektListResponse(BaseModel):
    """Response schema for list of projects."""

    success: bool = True
    data: list[ProjektOut]
    pagination: Optional[dict] = None
    meta: Optional[dict] = None


class ProjektDetailResponse(BaseModel):
    """Response schema for single project."""

    success: bool = True
    data: ProjektOut
    meta: Optional[dict] = None
