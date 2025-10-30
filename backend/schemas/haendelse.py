"""
Pydantic schemas for AMOHaendelser (Events) and AMOHaendelsestyper (Event Types).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# Event Types schemas
class HaendelsestypeBase(BaseModel):
    """Base schema for event type."""

    Navn: Optional[str] = Field(None, max_length=255, description="Event type name")
    Beskrivelse: Optional[str] = Field(None, description="Event type description")


class HaendelsestypeCreate(HaendelsestypeBase):
    """Schema for creating a new event type."""

    Navn: str = Field(..., min_length=1, max_length=255, description="Event type name (required)")


class HaendelsestypeUpdate(BaseModel):
    """Schema for updating an existing event type."""

    Navn: Optional[str] = Field(None, min_length=1, max_length=255)
    Beskrivelse: Optional[str] = None


class HaendelsestypeOut(HaendelsestypeBase):
    """Schema for event type output."""

    Id: int = Field(..., description="Event type ID")

    model_config = ConfigDict(from_attributes=True)


# Events schemas
class HaendelseBase(BaseModel):
    """Base schema for event."""

    TypeID: Optional[int] = Field(None, description="Event type foreign key")
    Beskrivelse: Optional[str] = Field(None, description="Event description")
    Dato: Optional[datetime] = Field(None, description="Event date")
    ProjektID: Optional[int] = Field(None, description="Project foreign key")
    OprettetAf: Optional[str] = Field(None, max_length=100, description="Created by user")


class HaendelseCreate(HaendelseBase):
    """Schema for creating a new event."""

    TypeID: int = Field(..., description="Event type ID (required)")
    Beskrivelse: str = Field(..., min_length=1, description="Event description (required)")
    ProjektID: int = Field(..., description="Project ID (required)")


class HaendelseUpdate(BaseModel):
    """Schema for updating an existing event."""

    TypeID: Optional[int] = None
    Beskrivelse: Optional[str] = Field(None, min_length=1)
    Dato: Optional[datetime] = None
    ProjektID: Optional[int] = None
    OprettetAf: Optional[str] = Field(None, max_length=100)


class HaendelseOut(HaendelseBase):
    """Schema for event output."""

    Id: int = Field(..., description="Event ID")

    model_config = ConfigDict(from_attributes=True)


class HaendelseListResponse(BaseModel):
    """Response schema for list of events."""

    success: bool = True
    data: list[HaendelseOut]
    pagination: Optional[dict] = None
    meta: Optional[dict] = None


class HaendelseDetailResponse(BaseModel):
    """Response schema for single event."""

    success: bool = True
    data: HaendelseOut
    meta: Optional[dict] = None


# Task 13.2: Schemas for case events (matching actual database structure)
class SagHaendelseOut(BaseModel):
    """
    Schema for case event output with type name.
    Matches the actual AMOHændelser database table structure.
    """

    id: int = Field(..., description="Event ID")
    dato: Optional[datetime] = Field(None, description="Event date")
    haendelsestype: str = Field(..., description="Event type name (from AMOHændelsestyper)")
    bemaerkning: Optional[str] = Field(None, description="Event note/description")
    init: Optional[str] = Field(None, description="User initials")
    link: Optional[str] = Field(None, description="Related link")

    model_config = ConfigDict(from_attributes=True)


class SagHaendelseListResponse(BaseModel):
    """Response schema for list of case events."""

    success: bool = True
    data: list[SagHaendelseOut]
    count: int = Field(..., description="Total number of events")
