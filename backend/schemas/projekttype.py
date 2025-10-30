"""
Pydantic schemas for AMOProjekttype (Project Type).
"""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProjekttypeBase(BaseModel):
    """Base schema for project type with common fields."""

    Navn: Optional[str] = Field(None, max_length=255, description="Project type name")
    Beskrivelse: Optional[str] = Field(None, description="Project type description")
    Aktiv: Optional[bool] = Field(True, description="Whether project type is active")


class ProjekttypeCreate(ProjekttypeBase):
    """Schema for creating a new project type."""

    Navn: str = Field(..., min_length=1, max_length=255, description="Project type name (required)")


class ProjekttypeUpdate(BaseModel):
    """Schema for updating an existing project type (all fields optional)."""

    Navn: Optional[str] = Field(None, min_length=1, max_length=255)
    Beskrivelse: Optional[str] = None
    Aktiv: Optional[bool] = None


class ProjekttypeOut(ProjekttypeBase):
    """Schema for project type output (response)."""

    ID: int = Field(..., description="Project type ID")

    model_config = ConfigDict(from_attributes=True)


class ProjekttypeListResponse(BaseModel):
    """Response schema for list of project types."""

    success: bool = True
    data: list[ProjekttypeOut]
    meta: Optional[dict] = None


class ProjekttypeDetailResponse(BaseModel):
    """Response schema for single project type."""

    success: bool = True
    data: ProjekttypeOut
    meta: Optional[dict] = None
