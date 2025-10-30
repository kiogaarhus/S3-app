"""
Dashboard API endpoints for GIDAS Explorer.
Provides statistics and recent activity data.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi_cache.decorator import cache
from sqlalchemy import func, desc, union_all, select, String, Integer, or_, and_
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.amo import (
    AMOProjekttype,
    AMOProjekt,
    AMOHændelser,
    AMOSagsbehandling,
    AMOimport
)
from backend.schemas.dashboard import (
    DashboardStatsResponse,
    DashboardStats,
    RecentActivityAPIResponse,
    RecentActivityItem
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
# @cache(expire=300)  # Disabled for debugging
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics.

    Returns sager-baserede KPI'er:
    - Afsluttede sager (total_projekttyper)
    - Aktive sager (active_projekter)
    - Sager oprettet seneste år (total_projekter)
    - Aktive sager med påbud (total_haendelser)
    """
    import time
    start = time.time()
    print(f"[STATS] Starting dashboard stats calculation...")

    # Calculate NEW KPI statistics based on sager (cases)
    # Using same logic as UI: FærdigmeldtInt=1 (færdigmeldt) OR AfsluttetInt=1/-1 (afsluttet) = ikke aktiv

    # 1. Afsluttede sager (Finished cases) - Færdigmeldt ELLER Afsluttet
    afsluttede_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .filter(or_(
            AMOSagsbehandling.FærdigmeldtInt == 1,  # Færdigmeldt
            AMOSagsbehandling.AfsluttetInt == 1,     # Afsluttet (ny værdi)
            AMOSagsbehandling.AfsluttetInt == -1     # Afsluttet (legacy værdi)
        ))
        .scalar() or 0
    )

    # 2. Aktive sager (Active cases) - Hverken færdigmeldt ELLER afsluttet
    aktive_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .filter(and_(
            # Not færdigmeldt
            or_(
                AMOSagsbehandling.FærdigmeldtInt != 1,
                AMOSagsbehandling.FærdigmeldtInt.is_(None)
            ),
            # Not afsluttet
            or_(
                AMOSagsbehandling.AfsluttetInt == 0,
                AMOSagsbehandling.AfsluttetInt.is_(None)
            )
        ))
        .scalar() or 0
    )

    # 3. Sager oprettet seneste år (Cases created last year)
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    sager_oprettet_seneste_aar = (
        db.query(func.count(AMOSagsbehandling.Id))
        .filter(AMOSagsbehandling.OprettetDato >= one_year_ago)
        .scalar() or 0
    )

    # 4. Aktive sager med påbud (Active cases with orders) - Samme aktiv logik + påbud
    aktive_sager_med_paabud = (
        db.query(func.count(AMOSagsbehandling.Id))
        .filter(and_(
            # Not færdigmeldt
            or_(
                AMOSagsbehandling.FærdigmeldtInt != 1,
                AMOSagsbehandling.FærdigmeldtInt.is_(None)
            ),
            # Not afsluttet
            or_(
                AMOSagsbehandling.AfsluttetInt == 0,
                AMOSagsbehandling.AfsluttetInt.is_(None)
            ),
            # Has påbud
            AMOSagsbehandling.Påbud == "Ja"
        ))
        .scalar() or 0
    )

    stats = DashboardStats(
        total_projekttyper=afsluttede_sager,  # Afsluttede sager
        active_projekter=aktive_sager,  # Aktive sager
        total_projekter=sager_oprettet_seneste_aar,  # Sager oprettet seneste år
        total_haendelser=aktive_sager_med_paabud,  # Aktive sager med påbud
        pending_sagsbehandling=0,  # Deprecated
        recent_imports=0  # Deprecated
    )

    elapsed = time.time() - start
    print(f"[STATS] Dashboard stats completed in {elapsed:.2f}s")

    return DashboardStatsResponse(
        success=True,
        data=stats,
        meta={
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0",
            "query_time_seconds": round(elapsed, 2)
        }
    )


@router.get("/recent-activity", response_model=RecentActivityAPIResponse)
@router.get("/recent", response_model=RecentActivityAPIResponse)
# @cache(expire=300)  # Disabled for debugging
async def get_recent_activity(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get recent activity across events, case statuses, and imports.

    Combines activity from:
    - AMOHændelser (events)
    - AMOSagsbehandling (case treatments)
    - AMOimport (data imports)

    Results are sorted by timestamp descending (most recent first).
    """
    import time
    start = time.time()
    print(f"[RECENT] Starting recent activity query (page={page}, per_page={per_page})...")

    # Optimized: Skip total count for first page (saves query time)
    # Build union query for recent activities with LIMIT applied to each subquery first

    # Calculate offset once
    offset = (page - 1) * per_page

    # Events - limit early for performance
    events_query = (
        select(
            AMOHændelser.Id.label("id"),
            func.cast("haendelse", String).label("type"),
            AMOHændelser.Bemærkning.label("title"),
            AMOHændelser.Dato.label("timestamp"),
            AMOHændelser.SagsID.label("project_id"),
            func.cast(None, String).label("project_name")
        )
        .where(AMOHændelser.Dato.isnot(None))
        .order_by(desc(AMOHændelser.Dato))
        .limit(per_page + offset)  # Fetch enough for pagination
    )

    # Case treatments - limit early for performance
    cases_query = (
        select(
            AMOSagsbehandling.Id.label("id"),
            func.cast("sagsstatus", String).label("type"),
            AMOSagsbehandling.Bemærkning.label("title"),
            AMOSagsbehandling.OprettetDato.label("timestamp"),
            AMOSagsbehandling.ProjektID.label("project_id"),
            func.cast(None, String).label("project_name")
        )
        .where(AMOSagsbehandling.OprettetDato.isnot(None))
        .order_by(desc(AMOSagsbehandling.OprettetDato))
        .limit(per_page + offset)  # Fetch enough for pagination
    )

    # Union activities
    combined_query = union_all(events_query, cases_query).subquery()

    # Optimized: Only count when needed (page > 1 or need total_pages)
    # For first page, estimate based on per_page
    if page == 1:
        total = per_page * 10  # Reasonable estimate
    else:
        # Only count when paginating beyond first page
        total = db.query(func.count()).select_from(combined_query).scalar() or 0

    # Paginate and fetch activities
    activities = (
        db.query(combined_query)
        .order_by(desc(combined_query.c.timestamp))
        .limit(per_page)
        .offset(offset)
        .all()
    )

    # Convert to response items
    items = [
        RecentActivityItem(
            id=activity.id,
            type=activity.type,
            title=activity.title or "Ingen beskrivelse",
            timestamp=activity.timestamp,
            project_id=activity.project_id,
            project_name=activity.project_name
        )
        for activity in activities
    ]

    elapsed = time.time() - start
    print(f"[RECENT] Recent activity query completed in {elapsed:.2f}s (returned {len(items)} items)")

    return RecentActivityAPIResponse(
        success=True,
        data=items,
        pagination={
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    )
