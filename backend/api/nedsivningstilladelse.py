"""
Nedsivningstilladelse Dashboard API endpoints.
Dedicated dashboard for Nedsivningstilladelse project cases.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc, or_, and_
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models import (
    AMOSagsbehandling,
    AMOProjekt,
    AMOProjekttype
)
from backend.schemas.dashboard import (
    DashboardStatsResponse,
    DashboardStats,
    RecentActivityAPIResponse,
    RecentActivityItem
)

router = APIRouter(prefix="/api/dashboard/nedsivningstilladelse", tags=["nedsivningstilladelse"])


@router.get("/debug/status-distribution")
async def debug_status_distribution(db: Session = Depends(get_db)):
    """
    Debug endpoint to check status field distribution for Nedsivningstilladelse cases.
    """
    from sqlalchemy import func

    # Total count
    total_count = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Nedsivningstilladelse")
        .scalar() or 0
    )

    # Status distribution
    status_distribution = (
        db.query(
            AMOSagsbehandling.FærdigmeldtInt,
            AMOSagsbehandling.AfsluttetInt,
            func.count(AMOSagsbehandling.Id).label('count')
        )
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Nedsivningstilladelse")
        .group_by(AMOSagsbehandling.FærdigmeldtInt, AMOSagsbehandling.AfsluttetInt)
        .all()
    )

    distribution_list = []
    for færdigmeldt, afsluttet, count in status_distribution:
        distribution_list.append({
            "FærdigmeldtInt": færdigmeldt,
            "AfsluttetInt": afsluttet,
            "count": count
        })

    # Påbud distribution
    paabud_distribution = (
        db.query(
            AMOSagsbehandling.Påbud,
            func.count(AMOSagsbehandling.Id).label('count')
        )
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Nedsivningstilladelse")
        .group_by(AMOSagsbehandling.Påbud)
        .all()
    )

    paabud_list = []
    for paabud, count in paabud_distribution:
        paabud_list.append({
            "Påbud": paabud,
            "count": count
        })

    return {
        "total_nedsivningstilladelse_cases": total_count,
        "status_distribution": distribution_list,
        "paabud_distribution": paabud_list
    }


@router.get("/projects")
async def get_nedsivningstilladelse_projects(db: Session = Depends(get_db)):
    """
    Get list of unique project names for Nedsivningstilladelse project type.
    Used for project filter dropdown in dashboard.
    """
    try:
        # Get distinct project names for Nedsivningstilladelse
        project_names = (
            db.query(AMOProjekt.Projektnavn)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Nedsivningstilladelse",
                AMOProjekt.Projektnavn.isnot(None),
                AMOProjekt.Projektnavn != ""
            ))
            .distinct()
            .order_by(AMOProjekt.Projektnavn)
            .all()
        )

        # Extract project names from tuples
        projects = [name[0] for name in project_names]

        return {
            "success": True,
            "data": projects,
            "meta": {
                "total": len(projects),
                "timestamp": datetime.utcnow().isoformat()
            }
        }

    except Exception as e:
        print(f"[NEDSIVNINGSTILLADELSE] Error fetching projects: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Error fetching projects: {str(e)}"
        }


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_nedsivningstilladelse_stats(db: Session = Depends(get_db)):
    """
    Get Nedsivningstilladelse dashboard statistics.

    Returns Nedsivningstilladelse-specifikke KPI'er:
    - Afsluttede Nedsivningstilladelse sager
    - Aktive Nedsivningstilladelse sager
    - Nedsivningstilladelse sager oprettet seneste år
    - Nedsivningstilladelse sager med påbud
    """

    # 1. Afsluttede Nedsivningstilladelse sager
    # For Nedsivningstilladelse: AfsluttetInt = -1 betyder afsluttet
    afsluttede_nedsivningstilladelse_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Nedsivningstilladelse",
            # Afsluttet = AfsluttetInt = -1
            AMOSagsbehandling.AfsluttetInt == -1
        ))
        .scalar() or 0
    )

    # 2. Aktive Nedsivningstilladelse sager
    # For Nedsivningstilladelse: AfsluttetInt = 0 betyder aktiv
    aktive_nedsivningstilladelse_sager = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Nedsivningstilladelse",
            # Aktiv = AfsluttetInt = 0
            AMOSagsbehandling.AfsluttetInt == 0
        ))
        .scalar() or 0
    )

    # 3. Nedsivningstilladelse sager oprettet seneste år
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    nedsivningstilladelse_sager_seneste_aar = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Nedsivningstilladelse",
            AMOSagsbehandling.OprettetDato >= one_year_ago
        ))
        .scalar() or 0
    )

    # 4. Nedsivningstilladelse sager med påbud (alle sager med påbud)
    # NOTE: Alle Nedsivningstilladelse sager har Påbud=null baseret på debug data
    nedsivningstilladelse_paabud_total = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Nedsivningstilladelse",
            # Has påbud
            AMOSagsbehandling.Påbud == "Ja"
        ))
        .scalar() or 0
    )

    # 5. Aktive Nedsivningstilladelse sager med påbud
    nedsivningstilladelse_paabud_aktive = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(and_(
            AMOProjekttype.ProjektType == "Nedsivningstilladelse",
            # Aktiv = AfsluttetInt = 0
            AMOSagsbehandling.AfsluttetInt == 0,
            # Has påbud
            AMOSagsbehandling.Påbud == "Ja"
        ))
        .scalar() or 0
    )

    stats = DashboardStats(
        total_projekttyper=afsluttede_nedsivningstilladelse_sager,  # Afsluttede Nedsivningstilladelse sager
        active_projekter=aktive_nedsivningstilladelse_sager,  # Aktive Nedsivningstilladelse sager
        total_projekter=nedsivningstilladelse_sager_seneste_aar,  # Nedsivningstilladelse sager oprettet seneste år
        total_haendelser=nedsivningstilladelse_paabud_total,  # Nedsivningstilladelse påbud (total)
        active_haendelser=nedsivningstilladelse_paabud_aktive,  # Nedsivningstilladelse påbud (aktive)
        pending_sagsbehandling=0,  # Not used for Nedsivningstilladelse
        recent_imports=0  # Not used for Nedsivningstilladelse
    )

    return DashboardStatsResponse(
        success=True,
        data=stats,
        meta={
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0",
            "project": "Nedsivningstilladelse"
        }
    )


@router.get("/recent-activity", response_model=RecentActivityAPIResponse)
async def get_nedsivningstilladelse_recent_activity(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    projekt_navn: Optional[str] = Query(None, description="Filter by project name"),
    db: Session = Depends(get_db)
):
    """
    Get recent activity for Nedsivningstilladelse cases.
    Optionally filter by project name.
    """

    offset = (page - 1) * per_page

    # Build base query
    recent_query = (
        db.query(AMOSagsbehandling)
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Nedsivningstilladelse")
    )

    # Add project name filter if provided
    if projekt_navn:
        recent_query = recent_query.filter(AMOProjekt.Projektnavn == projekt_navn)

    # Apply pagination and ordering
    recent_cases = (
        recent_query
        .order_by(desc(AMOSagsbehandling.OprettetDato))
        .offset(offset)
        .limit(per_page)
        .all()
    )

    # Count total Nedsivningstilladelse cases for pagination (with same filter)
    count_query = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Nedsivningstilladelse")
    )

    # Add project name filter to count query if provided
    if projekt_navn:
        count_query = count_query.filter(AMOProjekt.Projektnavn == projekt_navn)

    total_count = count_query.scalar() or 0

    total_pages = (total_count + per_page - 1) // per_page

    # Convert to activity items
    activities = []
    for case in recent_cases:
        # Build address string
        address_parts = []
        if case.Adresse:
            address_parts.append(case.Adresse)
        if case.Postnummer:
            address_parts.append(str(case.Postnummer))
        address_str = ", ".join(address_parts) if address_parts else "Ingen adresse"

        # Build description with more details
        description_parts = [f"Projekt ID: {case.ProjektID}"]
        if address_str != "Ingen adresse":
            description_parts.append(f"Adresse: {address_str}")
        if case.Matrnr:
            description_parts.append(f"Matr.nr: {case.Matrnr}")
        if case.Ejendomsnummer:
            description_parts.append(f"Ejendom: {case.Ejendomsnummer}")

        activities.append(RecentActivityItem(
            id=case.Id,
            type="sagsbehandling",
            title=f"Nedsivningstilladelse Sag #{case.Id}",
            description=" | ".join(description_parts),
            timestamp=case.OprettetDato or datetime.utcnow(),
            status=case.Færdigmeldt or "Aktiv"
        ))

    return RecentActivityAPIResponse(
        success=True,
        data=activities,
        pagination={
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "project": "Nedsivningstilladelse"
        }
    )
