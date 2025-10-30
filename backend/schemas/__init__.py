"""
Pydantic schemas for GIDAS Explorer API.

All schemas for request/response validation are exported here.
"""
# Dashboard schemas
from .dashboard import (
    DashboardStats,
    DashboardStatsResponse,
    RecentActivityItem,
    RecentActivityAPIResponse,
)


# Projekttype schemas
from .projekttype import (
    ProjekttypeBase,
    ProjekttypeCreate,
    ProjekttypeUpdate,
    ProjekttypeOut,
    ProjekttypeListResponse,
    ProjekttypeDetailResponse,
)

# Projekt schemas
from .projekt import (
    ProjektBase,
    ProjektCreate,
    ProjektUpdate,
    ProjektOut,
    ProjektListResponse,
    ProjektDetailResponse,
)

# Haendelse schemas (Events and Event Types)
from .haendelse import (
    HaendelsestypeBase,
    HaendelsestypeCreate,
    HaendelsestypeUpdate,
    HaendelsestypeOut,
    HaendelseBase,
    HaendelseCreate,
    HaendelseUpdate,
    HaendelseOut,
    HaendelseListResponse,
    HaendelseDetailResponse,
    SagHaendelseOut,
    SagHaendelseListResponse,
)

# Sagsbehandling schemas
from .sagsbehandling import (
    SagsbehandlingBase,
    SagsbehandlingCreate,
    SagsbehandlingUpdate,
    SagsbehandlingOut,
    SagsbehandlingListResponse,
    SagsbehandlingDetailResponse,
)

# Search schemas
from .search import (
    SearchQuery,
    SearchResponse,
    SearchResultGroup,
    ProjectSearchResult,
    CaseSearchResult,
    EventSearchResult,
    SearchSuggestionsResponse,
    SearchSuggestion,
    RecentSearch,
    RecentSearchesResponse,
)

__all__ = [
    # Dashboard
    "DashboardStats",
    "DashboardStatsResponse",
    "RecentActivityItem",
    "RecentActivityAPIResponse",
    # Projekttype
    "ProjekttypeBase",
    "ProjekttypeCreate",
    "ProjekttypeUpdate",
    "ProjekttypeOut",
    "ProjekttypeListResponse",
    "ProjekttypeDetailResponse",
    # Projekt
    "ProjektBase",
    "ProjektCreate",
    "ProjektUpdate",
    "ProjektOut",
    "ProjektListResponse",
    "ProjektDetailResponse",
    # Haendelse
    "HaendelsestypeBase",
    "HaendelsestypeCreate",
    "HaendelsestypeUpdate",
    "HaendelsestypeOut",
    "HaendelseBase",
    "HaendelseCreate",
    "HaendelseUpdate",
    "HaendelseOut",
    "HaendelseListResponse",
    "HaendelseDetailResponse",
    "SagHaendelseOut",
    "SagHaendelseListResponse",
    # Sagsbehandling
    "SagsbehandlingBase",
    "SagsbehandlingCreate",
    "SagsbehandlingUpdate",
    "SagsbehandlingOut",
    "SagsbehandlingListResponse",
    "SagsbehandlingDetailResponse",
    # Search
    "SearchQuery",
    "SearchResponse",
    "SearchResultGroup",
    "ProjectSearchResult",
    "CaseSearchResult",
    "EventSearchResult",
    "SearchSuggestionsResponse",
    "SearchSuggestion",
    "RecentSearch",
    "RecentSearchesResponse",
]
