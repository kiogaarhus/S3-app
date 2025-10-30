"""
Pydantic schemas for global search functionality.
Supports searching across projekter, sager (cases), and hændelser (events).

Task 5.1: Backend Search API Implementation
"""
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


# Entity type for search
SearchEntityType = Literal["project", "case", "event", "all"]


class SearchQuery(BaseModel):
    """Search query parameters."""
    q: str = Field(..., description="Search query string", min_length=1, max_length=500)
    type: SearchEntityType = Field(
        default="all",
        description="Entity type to search (project, case, event, or all)"
    )
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results per entity type")


class ProjectSearchResult(BaseModel):
    """Search result for a project."""
    id: int
    type: Literal["project"] = "project"
    projektnavn: str
    projektmappe: Optional[str] = None
    projekttype_navn: Optional[str] = None
    afsluttet: Optional[int] = None
    match_field: str = Field(description="Field where match was found (navn, mappe)")
    match_highlight: str = Field(description="Highlighted match context")


class CaseSearchResult(BaseModel):
    """Search result for a case (sag)."""
    id: int
    type: Literal["case"] = "case"
    projekt_id: Optional[int] = None
    projekt_navn: Optional[str] = None
    bemærkning: Optional[str] = None
    oprettet_dato: Optional[datetime] = None
    afsluttet: Optional[str] = None
    færdigmeldt: Optional[str] = None
    påbud: Optional[str] = None
    adresse: Optional[str] = None
    ejendomsnummer: Optional[int] = None
    match_field: str = Field(description="Field where match was found")
    match_highlight: str = Field(description="Highlighted match context")


class EventSearchResult(BaseModel):
    """Search result for an event (hændelse)."""
    id: int
    type: Literal["event"] = "event"
    sags_id: Optional[int] = None
    sag_projekt_navn: Optional[str] = None
    type_navn: Optional[str] = None
    dato: Optional[datetime] = None
    bemærkning: Optional[str] = None
    match_field: str = Field(description="Field where match was found")
    match_highlight: str = Field(description="Highlighted match context")


class SearchResultGroup(BaseModel):
    """Grouped search results by entity type."""
    projects: List[ProjectSearchResult] = []
    cases: List[CaseSearchResult] = []
    events: List[EventSearchResult] = []
    total_count: int = Field(default=0, description="Total number of results across all types")


class SearchResponse(BaseModel):
    """Global search API response."""
    query: str
    results: SearchResultGroup
    execution_time_ms: float = Field(description="Query execution time in milliseconds")


class SearchSuggestion(BaseModel):
    """Autocomplete suggestion."""
    text: str
    type: SearchEntityType
    entity_id: Optional[int] = None
    description: Optional[str] = None


class SearchSuggestionsResponse(BaseModel):
    """Autocomplete suggestions response."""
    query: str
    suggestions: List[SearchSuggestion]


class RecentSearch(BaseModel):
    """Recent search entry."""
    query: str
    timestamp: datetime
    type: SearchEntityType
    result_count: int


class RecentSearchesResponse(BaseModel):
    """Recent searches response."""
    searches: List[RecentSearch]
