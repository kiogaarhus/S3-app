"""
Separering Dashboard API endpoints.
Dedicated dashboard for Separering project cases.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc, or_, and_
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.amo import (
    AMOSagsbehandling,
    AMOHændelser,
    AMOProjekt, 
    AMOProjekttype
)
from backend.schemas.dashboard import (
    DashboardStatsResponse,
    DashboardStats,
    RecentActivityAPIResponse,
    RecentActivityItem
)

router = APIRouter(prefix="/api/dashboard/separering", tags=["separering"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_separering_stats(db: Session = Depends(get_db)):
    """
    Get Separering dashboard statistics.

    Returns Separering-specifikke KPI'er:
    - Afsluttede Separering sager
    - Aktive Separering sager 
    - Separering sager oprettet seneste år
    - Separering sager med påbud
    """
    
    try:
        print(f"[SEPARERING STATS] Starting separering stats calculation...")
        
        # 1. Afsluttede Separering sager
        afsluttede_separering_sager = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Separering",
                or_(
                    AMOSagsbehandling.Færdigmeldt == "Ja",
                    AMOSagsbehandling.AfsluttetDato.isnot(None),
                    AMOSagsbehandling.AfslutUdenFærdigmelding == 1,
                    AMOSagsbehandling.FærdigmeldingDato.isnot(None)
                )
            ))
            .scalar() or 0
        )

    # 2. Aktive Separering sager
    aktive_separering_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Separering",
            # Not finished
            AMOSagsbehandling.Færdigmeldt != "Ja",
            AMOSagsbehandling.AfsluttetDato.is_(None),
            or_(
                AMOSagsbehandling.AfslutUdenFærdigmelding != 1,
                AMOSagsbehandling.AfslutUdenFærdigmelding.is_(None)
            ),
            AMOSagsbehandling.FærdigmeldingDato.is_(None)
        ))
        .scalar() or 0
    )

    # 3. Separering sager oprettet seneste år
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    nye_separering_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Separering",
            AMOSagsbehandling.OprettetDato >= one_year_ago
        ))
        .scalar() or 0
    )

    # 4. Separering sager med påbud
    separering_paabud = (
        db.query(func.count(AMOHændelser.Id.distinct()))
        .join(AMOSagsbehandling, AMOHændelser.SagsbehandlingID == AMOSagsbehandling.Id)
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Separering",
            AMOHændelser.HændelseType == "Påbud"
        ))
        .scalar() or 0
    )

        print(f"[SEPARERING STATS] Afsluttede: {afsluttede_separering_sager}, Aktive: {aktive_separering_sager}, Nye: {nye_separering_sager}, Påbud: {separering_paabud}")

        return DashboardStatsResponse(
            success=True,
            data=DashboardStats(
                total_projekttyper=afsluttede_separering_sager,  # Afsluttede Separering sager
                active_projekter=aktive_separering_sager,        # Aktive Separering sager
                total_projekter=nye_separering_sager,            # Nye Separering sager (seneste år)
                total_haendelser=separering_paabud,              # Separering påbud
                pending_sagsbehandling=0,                        # Not used for Separering
                recent_imports=0                                 # Not used for Separering
            ),
            message="Separering dashboard statistics retrieved successfully"
        )
    
    except Exception as e:
        print(f"[SEPARERING STATS] Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Return error response
        return DashboardStatsResponse(
            success=False,
            data=DashboardStats(
                total_projekttyper=0,
                active_projekter=0,
                total_projekter=0,
                total_haendelser=0,
                pending_sagsbehandling=0,
                recent_imports=0
            ),
            message=f"Error retrieving separering statistics: {str(e)}"
        )


@router.get("/recent-activity", response_model=RecentActivityAPIResponse)
async def get_separering_recent_activity(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get recent activity for Separering cases with pagination.
    """
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get recent Separering sagsbehandling
    recent_query = (
        db.query(AMOSagsbehandling)
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Separering")
        .order_by(desc(AMOSagsbehandling.OprettetDato))
        .offset(offset)
        .limit(per_page)
    )
    
    recent_items = recent_query.all()
    
    # Get total count for pagination
    total_count = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Separering")
        .scalar() or 0
    )
    
    # Convert to response format
    activity_items = []
    for item in recent_items:
        activity_items.append(RecentActivityItem(
            id=item.Id,
            type="sagsbehandling",
            title=f"Separering Sag #{item.Id}",
            description=f"Projekt: {item.projekt.ProjektNavn if item.projekt else 'N/A'}",
            timestamp=item.OprettetDato or datetime.utcnow(),
            status=item.Færdigmeldt or "Aktiv"
        ))
    
    return RecentActivityAPIResponse(
        success=True,
        data=activity_items,
        pagination={
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "total_pages": (total_count + per_page - 1) // per_page
        },
        message=f"Retrieved {len(activity_items)} recent Separering activities"
    )
