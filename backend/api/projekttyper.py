"""
API endpoints for AMOProjekttype (Project Types).
Provides CRUD operations and relationship queries with pagination.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi_cache.decorator import cache
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session, joinedload

from backend.database.session import get_db
from backend.models.amo import AMOProjekttype, AMOProjekt
from backend.schemas.projekttype import (
    ProjekttypeCreate,
    ProjekttypeUpdate,
    ProjekttypeOut,
    ProjekttypeListResponse,
    ProjekttypeDetailResponse
)
from backend.utils.pagination import paginate, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/api/projekttyper", tags=["projekttyper"])


@router.get("", response_model=PaginatedResponse[ProjekttypeOut])
@cache(expire=300)
async def list_projekttyper(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort: str = Query("ID", description="Field to sort by (ID, Navn, Beskrivelse, Aktiv)"),
    order: str = Query("asc", description="Sort order (asc or desc)"),
    aktiv: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """
    List all project types with pagination and filtering.

    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - sort: Field to sort by (default: ID)
    - order: Sort order - asc or desc (default: asc)
    - aktiv: Filter by active status (optional)
    """
    # Build base query
    query = db.query(AMOProjekttype)

    # Apply filters
    if aktiv is not None:
        query = query.filter(AMOProjekttype.Aktiv == aktiv)

    # Apply sorting
    valid_sort_fields = {"ID", "Navn", "Beskrivelse", "Aktiv"}
    if sort not in valid_sort_fields:
        sort = "ID"

    sort_column = getattr(AMOProjekttype, sort)
    if order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Paginate
    items, pagination_meta = paginate(query, page=page, per_page=per_page)

    # Convert to Pydantic models
    data = [ProjekttypeOut.model_validate(item) for item in items]

    return PaginatedResponse(
        success=True,
        data=data,
        pagination=pagination_meta
    )


@router.get("/{id}", response_model=ProjekttypeDetailResponse)
@cache(expire=300)
async def get_projekttype(
    id: int,
    include_projekter: bool = Query(False, description="Include related projects"),
    include_dynamiske_lister: bool = Query(False, description="Include dynamic lists"),
    include_registreringer: bool = Query(False, description="Include registrations"),
    db: Session = Depends(get_db)
):
    """
    Get a single project type by ID with optional relations.

    Path parameters:
    - id: Project type ID

    Query parameters:
    - include_projekter: Include related projects (default: false)
    - include_dynamiske_lister: Include dynamic lists (default: false)
    - include_registreringer: Include registrations (default: false)
    """
    # Build query with optional eager loading
    query = db.query(AMOProjekttype)

    if include_projekter:
        query = query.options(joinedload(AMOProjekttype.projekter))
    if include_dynamiske_lister:
        query = query.options(joinedload(AMOProjekttype.dynamiske_lister))
    if include_registreringer:
        query = query.options(joinedload(AMOProjekttype.registreringer))

    projekttype = query.filter(AMOProjekttype.ID == id).first()

    if not projekttype:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekttype with ID {id} not found"
        )

    return ProjekttypeDetailResponse(
        success=True,
        data=ProjekttypeOut.model_validate(projekttype),
        meta={
            "relations_loaded": {
                "projekter": include_projekter,
                "dynamiske_lister": include_dynamiske_lister,
                "registreringer": include_registreringer
            }
        }
    )


@router.post("", response_model=ProjekttypeDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_projekttype(
    projekttype: ProjekttypeCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new project type.

    Request body:
    - Navn: Project type name (required)
    - Beskrivelse: Description (optional)
    - Aktiv: Active status (optional, default: true)
    """
    # Create new projekttype instance
    db_projekttype = AMOProjekttype(
        Navn=projekttype.Navn,
        Beskrivelse=projekttype.Beskrivelse,
        Aktiv=projekttype.Aktiv if projekttype.Aktiv is not None else True
    )

    db.add(db_projekttype)
    db.commit()
    db.refresh(db_projekttype)

    return ProjekttypeDetailResponse(
        success=True,
        data=ProjekttypeOut.model_validate(db_projekttype),
        meta={"message": "Project type created successfully"}
    )


@router.put("/{id}", response_model=ProjekttypeDetailResponse)
async def update_projekttype(
    id: int,
    projekttype: ProjekttypeUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing project type.

    Path parameters:
    - id: Project type ID

    Request body (all fields optional):
    - Navn: Project type name
    - Beskrivelse: Description
    - Aktiv: Active status
    """
    # Fetch existing projekttype
    db_projekttype = db.query(AMOProjekttype).filter(AMOProjekttype.ID == id).first()

    if not db_projekttype:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekttype with ID {id} not found"
        )

    # Update only provided fields
    update_data = projekttype.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_projekttype, field, value)

    db.commit()
    db.refresh(db_projekttype)

    return ProjekttypeDetailResponse(
        success=True,
        data=ProjekttypeOut.model_validate(db_projekttype),
        meta={"message": "Project type updated successfully"}
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_projekttype(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a project type.

    Path parameters:
    - id: Project type ID

    Note: This will fail if the project type has related projects.
    Consider soft-delete (setting Aktiv=false) instead.
    """
    # Fetch existing projekttype
    db_projekttype = db.query(AMOProjekttype).filter(AMOProjekttype.ID == id).first()

    if not db_projekttype:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekttype with ID {id} not found"
        )

    # Check for related projects
    related_projekter = db.query(AMOProjekt).filter(AMOProjekt.ProjekttypeID == id).count()
    if related_projekter > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete project type with {related_projekter} related projects. Consider deactivating instead."
        )

    db.delete(db_projekttype)
    db.commit()

    return None


@router.get("/{id}/projekter", response_model=PaginatedResponse[dict])
@cache(expire=300)
async def get_projekttype_projekter(
    id: int,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get all projects related to a specific project type.

    Path parameters:
    - id: Project type ID

    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    """
    # Verify projekttype exists
    projekttype = db.query(AMOProjekttype).filter(AMOProjekttype.ID == id).first()
    if not projekttype:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekttype with ID {id} not found"
        )

    # Query related projects
    query = db.query(AMOProjekt).filter(AMOProjekt.ProjekttypeID == id).order_by(desc(AMOProjekt.OprettetDato))

    # Paginate
    items, pagination_meta = paginate(query, page=page, per_page=per_page)

    # Convert to dict representation
    data = [
        {
            "ID": item.ID,
            "Navn": item.Navn,
            "Status": item.Status,
            "OprettetDato": item.OprettetDato,
            "SidstOpdateret": item.SidstOpdateret
        }
        for item in items
    ]

    return PaginatedResponse(
        success=True,
        data=data,
        pagination=pagination_meta
    )
