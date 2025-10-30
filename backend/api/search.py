"""
Global search API endpoint.
Full-text search across projekter, sager (cases), and hændelser (events).

Task 5.1: Backend Search API Implementation
Subtask 5.1: Backend Search API with full-text search capabilities
"""
import time
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi_cache.decorator import cache
from sqlalchemy import or_, func, cast, String
from sqlalchemy.orm import Session, joinedload

from backend.database.session import get_db
from backend.models.amo import (
    AMOProjekt,
    AMOProjekttype,
    AMOSagsbehandling,
    AMOHændelser,
    AMOHændelsestyper
)
from backend.schemas.search import (
    SearchResponse,
    SearchResultGroup,
    ProjectSearchResult,
    CaseSearchResult,
    EventSearchResult,
    SearchEntityType,
    SearchSuggestionsResponse,
    SearchSuggestion
)

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "Search API is working", "status": "ok"}


def highlight_match(text: Optional[str], query: str, context_chars: int = 50) -> str:
    """
    Create highlighted context around search match.

    Args:
        text: Text to search in
        query: Search query
        context_chars: Number of characters to show on each side of match

    Returns:
        Highlighted text snippet with context
    """
    if not text:
        return ""

    text_lower = text.lower()
    query_lower = query.lower()

    # Find first occurrence
    pos = text_lower.find(query_lower)
    if pos == -1:
        # Return first N characters if no match found
        return text[:context_chars * 2] + ("..." if len(text) > context_chars * 2 else "")

    # Calculate context window
    start = max(0, pos - context_chars)
    end = min(len(text), pos + len(query) + context_chars)

    # Extract snippet
    snippet = text[start:end]

    # Add ellipsis if truncated
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."

    return snippet


@router.get("/", response_model=SearchResponse)
# @cache(expire=60)  # Cache for 1 minute - DISABLED FOR DEBUGGING
async def global_search(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    type: SearchEntityType = Query(
        default="all",
        description="Entity type to search (project, case, event, all)"
    ),
    limit: int = Query(default=10, ge=1, le=100, description="Max results per type"),
    db: Session = Depends(get_db)
) -> SearchResponse:
    """
    Global search across projekter, sager, and hændelser.

    Searches in:
    - Projekter: Projektnavn, Projektmappe
    - Sager: Bemærkning, Adresse, Ejendomsnummer, Journalnummer
    - Hændelser: Bemærkning

    Returns ranked results with match highlighting.
    Performance target: <500ms
    """
    start_time = time.time()

    results = SearchResultGroup()

    # Search projects
    if type in ["project", "all"]:
        projects = search_projects(db, q, limit)
        results.projects = projects

    # Search cases
    if type in ["case", "all"]:
        cases = search_cases(db, q, limit)
        results.cases = cases

    # Search events
    if type in ["event", "all"]:
        events = search_events(db, q, limit)
        results.events = events

    # Calculate total count
    results.total_count = len(results.projects) + len(results.cases) + len(results.events)

    # Calculate execution time
    execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds

    return SearchResponse(
        query=q,
        results=results,
        execution_time_ms=round(execution_time, 2)
    )


def search_projects(db: Session, query: str, limit: int) -> List[ProjectSearchResult]:
    """
    Search in AMOProjekt table.

    Searches fields: Projektnavn, Projektmappe
    """
    # Build search filters
    search_term = f"%{query}%"

    # Query with eager loading
    projects_query = (
        db.query(AMOProjekt)
        .options(joinedload(AMOProjekt.projekttype))
        .filter(
            or_(
                AMOProjekt.Projektnavn.ilike(search_term),
                AMOProjekt.Projektmappe.ilike(search_term)
            )
        )
        .limit(limit)
    )

    projects = projects_query.all()

    # Build results
    results = []
    for projekt in projects:
        # Determine match field
        match_field = "navn"
        match_text = projekt.Projektnavn or ""

        if projekt.Projektmappe and query.lower() in (projekt.Projektmappe or "").lower():
            match_field = "mappe"
            match_text = projekt.Projektmappe

        result = ProjectSearchResult(
            id=projekt.Id,
            projektnavn=projekt.Projektnavn or "",
            projektmappe=projekt.Projektmappe,
            projekttype_navn=projekt.projekttype.ProjektType if projekt.projekttype else None,
            afsluttet=projekt.afsluttet,
            match_field=match_field,
            match_highlight=highlight_match(match_text, query)
        )
        results.append(result)

    return results


def search_cases(db: Session, query: str, limit: int) -> List[CaseSearchResult]:
    """
    Search in AMOSagsbehandling table.

    Searches fields: Bemærkning, Adresse, Ejendomsnummer, Journalnummer
    """
    search_term = f"%{query}%"

    # Build query with multiple search fields
    # CAST Bemærkning (ntext) to nvarchar for LIKE operation
    filters = [
        cast(AMOSagsbehandling.Bemærkning, String).ilike(search_term),
        AMOSagsbehandling.Adresse.ilike(search_term),
        AMOSagsbehandling.Journalnummer.ilike(search_term)
    ]

    # Add numeric search for Ejendomsnummer if query is numeric
    if query.isdigit():
        filters.append(cast(AMOSagsbehandling.Ejendomsnummer, String).ilike(search_term))

    # Query with projekt relationship
    cases_query = (
        db.query(AMOSagsbehandling)
        .outerjoin(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .filter(or_(*filters))
        .limit(limit)
    )

    cases = cases_query.all()

    # Build results
    results = []
    for case in cases:
        # Determine match field and text
        match_field = "bemærkning"
        match_text = case.Bemærkning or ""

        if case.Adresse and query.lower() in (case.Adresse or "").lower():
            match_field = "adresse"
            match_text = case.Adresse
        elif case.Journalnummer and query.lower() in (case.Journalnummer or "").lower():
            match_field = "journalnummer"
            match_text = case.Journalnummer
        elif case.Ejendomsnummer and query in str(case.Ejendomsnummer):
            match_field = "ejendomsnummer"
            match_text = str(case.Ejendomsnummer)

        # Get projekt navn
        projekt = db.query(AMOProjekt).filter(AMOProjekt.Id == case.ProjektID).first()

        result = CaseSearchResult(
            id=case.Id,
            projekt_id=case.ProjektID,
            projekt_navn=projekt.Projektnavn if projekt else None,
            bemærkning=case.Bemærkning,
            oprettet_dato=case.OprettetDato,
            afsluttet=case.Afsluttet,
            færdigmeldt=case.Færdigmeldt,
            påbud=case.Påbud,
            adresse=case.Adresse,
            ejendomsnummer=case.Ejendomsnummer,
            match_field=match_field,
            match_highlight=highlight_match(match_text, query)
        )
        results.append(result)

    return results


def search_events(db: Session, query: str, limit: int) -> List[EventSearchResult]:
    """
    Search in AMOHændelser table.

    Searches fields: Bemærkning, type navn (via relationship)
    """
    search_term = f"%{query}%"

    # Query with relationships
    # CAST Bemærkning (Text) to nvarchar for LIKE operation
    events_query = (
        db.query(AMOHændelser)
        .options(joinedload(AMOHændelser.type))
        .filter(cast(AMOHændelser.Bemærkning, String).ilike(search_term))
        .order_by(AMOHændelser.Dato.desc())
        .limit(limit)
    )

    events = events_query.all()

    # Build results
    results = []
    for event in events:
        # Get sag and projekt info
        sag = None
        projekt_navn = None
        if event.SagsID:
            sag = db.query(AMOSagsbehandling).filter(AMOSagsbehandling.Id == event.SagsID).first()
            if sag and sag.ProjektID:
                projekt = db.query(AMOProjekt).filter(AMOProjekt.Id == sag.ProjektID).first()
                if projekt:
                    projekt_navn = projekt.Projektnavn

        result = EventSearchResult(
            id=event.Id,
            sags_id=event.SagsID,
            sag_projekt_navn=projekt_navn,
            type_navn=event.type.HændelsesType if event.type else None,
            dato=event.Dato,
            bemærkning=event.Bemærkning,
            match_field="bemærkning",
            match_highlight=highlight_match(event.Bemærkning, query)
        )
        results.append(result)

    return results


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
# @cache(expire=300)  # Cache for 5 minutes - DISABLED FOR DEBUGGING
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Partial query"),
    limit: int = Query(default=5, ge=1, le=20, description="Max suggestions"),
    db: Session = Depends(get_db)
) -> SearchSuggestionsResponse:
    """
    Get autocomplete suggestions for search query.

    Returns top matching entity names for quick selection.
    """
    suggestions: List[SearchSuggestion] = []
    search_term = f"%{q}%"

    # Get projekt suggestions
    projects = (
        db.query(AMOProjekt)
        .filter(AMOProjekt.Projektnavn.ilike(search_term))
        .limit(limit)
        .all()
    )

    for p in projects:
        suggestions.append(
            SearchSuggestion(
                text=p.Projektnavn or "",
                type="project",
                entity_id=p.Id,
                description=p.Projektmappe
            )
        )

    # Get case suggestions (from addresses)
    if len(suggestions) < limit:
        remaining = limit - len(suggestions)
        cases = (
            db.query(AMOSagsbehandling)
            .filter(AMOSagsbehandling.Adresse.ilike(search_term))
            .limit(remaining)
            .all()
        )

        for c in cases:
            if c.Adresse:
                suggestions.append(
                    SearchSuggestion(
                        text=c.Adresse,
                        type="case",
                        entity_id=c.Id,
                        description=f"Ejendom: {c.Ejendomsnummer}" if c.Ejendomsnummer else None
                    )
                )

    return SearchSuggestionsResponse(
        query=q,
        suggestions=suggestions[:limit]
    )
