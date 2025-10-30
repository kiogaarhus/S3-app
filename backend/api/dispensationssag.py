"""
Dispensationssag Dashboard API endpoints.
Dedicated dashboard for Dispensationssag project cases.
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

router = APIRouter(prefix="/api/dashboard/dispensationssag", tags=["dispensationssag"])


@router.get("/debug/projekttype-check")
async def debug_check_projekttype(db: Session = Depends(get_db)):
    """
    Debug endpoint to check all project types and their case counts.
    """
    from sqlalchemy import func

    # Get all distinct project types with case counts
    projekt_types = (
        db.query(
            AMOProjekttype.ProjektType,
            AMOProjekttype.ID,
            func.count(AMOSagsbehandling.Id).label('total_sager')
        )
        .outerjoin(AMOProjekt, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .outerjoin(AMOSagsbehandling, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .group_by(AMOProjekttype.ID, AMOProjekttype.ProjektType)
        .order_by(func.count(AMOSagsbehandling.Id).desc())
        .all()
    )

    result = []
    for pt_name, pt_id, count in projekt_types:
        result.append({
            "id": pt_id,
            "projekttype": pt_name,
            "total_sager": count
        })

    # Check for exact "Dispensationssag" match
    dispensationssag_exact = (
        db.query(AMOProjekttype)
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
        .first()
    )

    # Check for similar matches
    similar = (
        db.query(AMOProjekttype.ProjektType, AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType.like("%Dispens%"))
        .all()
    )

    return {
        "all_project_types": result,
        "exact_match_found": dispensationssag_exact is not None,
        "exact_match_name": dispensationssag_exact.ProjektType if dispensationssag_exact else None,
        "exact_match_id": dispensationssag_exact.ID if dispensationssag_exact else None,
        "similar_matches": [{"id": pt_id, "name": pt_name} for pt_name, pt_id in similar]
    }


@router.get("/debug/status-distribution")
async def debug_status_distribution(db: Session = Depends(get_db)):
    """
    Debug endpoint to check status field distribution for Dispensationssag cases.
    """
    # Total count
    total_count = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
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
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
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
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
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
        "total_dispensationssag_cases": total_count,
        "status_distribution": distribution_list,
        "paabud_distribution": paabud_list
    }


@router.get("/projects")
async def get_dispensationssag_projects(db: Session = Depends(get_db)):
    """
    Get list of unique project names for Dispensationssag project type.
    Used for project filter dropdown in dashboard.
    """
    try:
        # Get distinct project names for Dispensationssag
        project_names = (
            db.query(AMOProjekt.Projektnavn)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
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
        print(f"[DISPENSATIONSSAG] Error fetching projects: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Error fetching projects: {str(e)}"
        }


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dispensationssag_stats(db: Session = Depends(get_db)):
    """
    Get Dispensationssag dashboard statistics.

    Returns Dispensationssag-specifikke KPI'er:
    - Afsluttede Dispensationssag sager
    - Aktive Dispensationssag sager
    - Dispensationssag sager oprettet seneste år
    - Dispensationssag sager med påbud
    """

    try:
        print(f"[DISPENSATIONSSAG] Starting dispensationssag stats calculation...")

        # DEBUG: Check total count first
        total_dispensationssag_count = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(AMOProjekttype.ProjektType == "Dispensationssag")
            .scalar() or 0
        )
        print(f"[DISPENSATIONSSAG DEBUG] Total Dispensationssag cases found: {total_dispensationssag_count}")

        # DEBUG: Check status field distribution
        status_distribution = (
            db.query(
                AMOSagsbehandling.FærdigmeldtInt,
                AMOSagsbehandling.AfsluttetInt,
                func.count(AMOSagsbehandling.Id).label('count')
            )
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(AMOProjekttype.ProjektType == "Dispensationssag")
            .group_by(AMOSagsbehandling.FærdigmeldtInt, AMOSagsbehandling.AfsluttetInt)
            .all()
        )
        print(f"[DISPENSATIONSSAG DEBUG] Status distribution:")
        for færdigmeldt, afsluttet, count in status_distribution:
            print(f"  FærdigmeldtInt={færdigmeldt}, AfsluttetInt={afsluttet}: {count} cases")

        # 1. Afsluttede Dispensationssag sager
        # For Dispensationssag: AfsluttetInt = -1 betyder afsluttet
        afsluttede_dispensationssag_sager = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
                # Afsluttet = AfsluttetInt = -1
                AMOSagsbehandling.AfsluttetInt == -1
            ))
            .scalar() or 0
        )

        # 2. Aktive Dispensationssag sager
        # For Dispensationssag: AfsluttetInt = 0 betyder aktiv
        aktive_dispensationssag_sager = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
                # Aktiv = AfsluttetInt = 0
                AMOSagsbehandling.AfsluttetInt == 0
            ))
            .scalar() or 0
        )

        # 3. Dispensationssag sager oprettet seneste år
        one_year_ago = datetime.utcnow() - timedelta(days=365)
        nye_dispensationssag_sager = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
                AMOSagsbehandling.OprettetDato >= one_year_ago
            ))
            .scalar() or 0
        )

        # 4. Dispensationssag sager med påbud (alle sager med påbud)
        # NOTE: Alle Dispensationssag sager har Påbud=null baseret på debug data
        dispensationssag_paabud_total = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
                # Has påbud
                AMOSagsbehandling.Påbud == "Ja"
            ))
            .scalar() or 0
        )

        # 5. Aktive Dispensationssag sager med påbud
        dispensationssag_paabud_aktive = (
            db.query(func.count(AMOSagsbehandling.Id))
            .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
            .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
            .filter(and_(
                AMOProjekttype.ProjektType == "Dispensationssag",
                # Aktiv = AfsluttetInt = 0
                AMOSagsbehandling.AfsluttetInt == 0,
                # Has påbud
                AMOSagsbehandling.Påbud == "Ja"
            ))
            .scalar() or 0
        )

        print(f"[DISPENSATIONSSAG] Afsluttede: {afsluttede_dispensationssag_sager}, Aktive: {aktive_dispensationssag_sager}, Nye: {nye_dispensationssag_sager}, Påbud Total: {dispensationssag_paabud_total}, Påbud Aktive: {dispensationssag_paabud_aktive}")

        return DashboardStatsResponse(
            success=True,
            data=DashboardStats(
                total_projekttyper=afsluttede_dispensationssag_sager,  # Afsluttede Dispensationssag sager
                active_projekter=aktive_dispensationssag_sager,        # Aktive Dispensationssag sager
                total_projekter=nye_dispensationssag_sager,            # Nye Dispensationssag sager (seneste år)
                total_haendelser=dispensationssag_paabud_total,        # Dispensationssag påbud (total)
                active_haendelser=dispensationssag_paabud_aktive,      # Dispensationssag påbud (aktive)
                pending_sagsbehandling=0,                              # Not used for Dispensationssag
                recent_imports=0                                       # Not used for Dispensationssag
            ),
            message="Dispensationssag dashboard statistics retrieved successfully"
        )

    except Exception as e:
        print(f"[DISPENSATIONSSAG] Error: {e}")
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
            message=f"Error retrieving dispensationssag statistics: {str(e)}"
        )


@router.get("/recent-activity", response_model=RecentActivityAPIResponse)
async def get_dispensationssag_recent_activity(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    projekt_navn: Optional[str] = Query(None, description="Filter by project name"),
    db: Session = Depends(get_db)
):
    """
    Get recent activity for Dispensationssag cases with pagination.
    Optionally filter by project name.
    """

    # Calculate offset
    offset = (page - 1) * per_page

    # Build base query
    recent_query = (
        db.query(AMOSagsbehandling)
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
    )

    # Add project name filter if provided
    if projekt_navn:
        recent_query = recent_query.filter(AMOProjekt.Projektnavn == projekt_navn)

    # Apply pagination and ordering
    recent_query = (
        recent_query
        .order_by(desc(AMOSagsbehandling.OprettetDato))
        .offset(offset)
        .limit(per_page)
    )

    recent_items = recent_query.all()

    # Get total count for pagination (with same filter)
    count_query = (
        db.query(func.count(AMOSagsbehandling.Id))
        .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
        .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
        .filter(AMOProjekttype.ProjektType == "Dispensationssag")
    )

    # Add project name filter to count query if provided
    if projekt_navn:
        count_query = count_query.filter(AMOProjekt.Projektnavn == projekt_navn)

    total_count = count_query.scalar() or 0

    # Convert to response format
    activity_items = []
    for item in recent_items:
        # Build address string
        address_parts = []
        if item.Adresse:
            address_parts.append(item.Adresse)
        if item.Postnummer:
            address_parts.append(str(item.Postnummer))
        address_str = ", ".join(address_parts) if address_parts else "Ingen adresse"

        # Build description with more details
        description_parts = [f"Projekt ID: {item.ProjektID}"]
        if address_str != "Ingen adresse":
            description_parts.append(f"Adresse: {address_str}")
        if item.Matrnr:
            description_parts.append(f"Matr.nr: {item.Matrnr}")
        if item.Ejendomsnummer:
            description_parts.append(f"Ejendom: {item.Ejendomsnummer}")

        activity_items.append(RecentActivityItem(
            id=item.Id,
            type="sagsbehandling",
            title=f"Dispensationssag Sag #{item.Id}",
            description=" | ".join(description_parts),
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
        message=f"Retrieved {len(activity_items)} recent Dispensationssag activities"
    )
