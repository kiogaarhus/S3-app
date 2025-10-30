"""
API endpoints for AMOProjekt (Projects).
Provides CRUD operations with filtering, pagination, and FK validation.

Task 10: API-endpoints: Projekter CRUD & filtrering
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi_cache.decorator import cache
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from backend.database.session import get_db
from backend.models.amo import AMOProjekt, AMOProjekttype
from backend.schemas.projekt import (
    ProjektCreate,
    ProjektUpdate,
    ProjektOut,
    ProjektListResponse,
    ProjektDetailResponse
)
from backend.utils.pagination import paginate, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/api/projekter", tags=["projekter"])


# Helper function for FK validation (Subtask 10.2)
def validate_projekttype_exists(projekttype_id: int, db: Session) -> AMOProjekttype:
    """
    Validate that a projekttype exists.

    Args:
        projekttype_id: ID of projekttype to validate
        db: Database session

    Returns:
        AMOProjekttype object if found

    Raises:
        HTTPException: If projekttype not found
    """
    projekttype = db.query(AMOProjekttype).filter(AMOProjekttype.ID == projekttype_id).first()
    if not projekttype:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projekttype with ID {projekttype_id} not found"
        )
    return projekttype


# Subtask 10.3: GET /projekter liste med filtrering
@router.get("", response_model=PaginatedResponse[ProjektOut])
@cache(expire=300)  # Cache for 5 minutes
async def list_projekter(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort: str = Query("ID", description="Field to sort by"),
    order: str = Query("asc", description="Sort order (asc or desc)"),
    projekttype_id: Optional[int] = Query(None, description="Filter by project type ID"),
    status: Optional[str] = Query(None, description="Filter by project status"),
    include_projekttype: bool = Query(True, description="Include projekttype relation (eager loading)"),
    db: Session = Depends(get_db)
):
    """
    List all projects with pagination and filtering.

    **Filtering:**
    - projekttype_id: Filter projects by specific project type
    - status: Filter by project status

    **Eager Loading:**
    - include_projekttype: Load projekttype relation to avoid N+1 queries (default: true)

    **Pagination:**
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)

    **Sorting:**
    - sort: Field to sort by (default: ID)
    - order: Sort order - asc or desc (default: asc)
    """
    # Build base query with eager loading (Subtask 10.1)
    query = db.query(AMOProjekt)

    # Eager loading for projekttype relation to avoid N+1 queries
    if include_projekttype:
        query = query.options(joinedload(AMOProjekt.projekttype))

    # Apply filters (Subtask 10.3)
    if projekttype_id is not None:
        query = query.filter(AMOProjekt.ProjekttypeID == projekttype_id)

    if status is not None:
        query = query.filter(AMOProjekt.Status == status)

    # Apply sorting
    valid_sort_fields = {"ID", "Navn", "Status", "OprettetDato", "SidstOpdateret", "ProjekttypeID"}
    if sort not in valid_sort_fields:
        sort = "ID"

    sort_column = getattr(AMOProjekt, sort)
    if order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Paginate
    items, pagination_meta = paginate(query, page=page, per_page=per_page)

    # Convert to Pydantic models
    data = [ProjektOut.model_validate(item) for item in items]

    return PaginatedResponse(
        success=True,
        data=data,
        pagination=pagination_meta
    )


# Subtask 10.4: GET /projekter/{id} med eager loading
@router.get("/{id}", response_model=ProjektDetailResponse)
@cache(expire=300)
async def get_projekt(
    id: int,
    include_projekttype: bool = Query(True, description="Include projekttype relation"),
    include_paabud: bool = Query(False, description="Include påbud om relations"),
    include_sag_registreringer: bool = Query(False, description="Include sag registreringer"),
    db: Session = Depends(get_db)
):
    """
    Get a single project by ID with optional eager-loaded relations.

    **Path parameters:**
    - id: Project ID

    **Query parameters:**
    - include_projekttype: Include projekttype relation (default: true)
    - include_paabud: Include påbud om relations (default: false)
    - include_sag_registreringer: Include sag registreringer (default: false)
    """
    # Build query with optional eager loading (Subtask 10.1)
    query = db.query(AMOProjekt)

    if include_projekttype:
        query = query.options(joinedload(AMOProjekt.projekttype))

    if include_paabud:
        query = query.options(joinedload(AMOProjekt.påbud))

    if include_sag_registreringer:
        query = query.options(joinedload(AMOProjekt.sag_registreringer))

    projekt = query.filter(AMOProjekt.ID == id).first()

    if not projekt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {id} not found"
        )

    return ProjektDetailResponse(
        success=True,
        data=ProjektOut.model_validate(projekt)
    )


# Subtask 10.2: POST /projekter med FK-validering
@router.post("", response_model=ProjektDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_projekt(
    projekt_data: ProjektCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new project with FK validation.

    **Request Body:**
    ```json
    {
        "Navn": "Projekt navn",
        "ProjekttypeID": 1,
        "Status": "Aktiv"
    }
    ```

    **Validation:**
    - Checks that ProjekttypeID references an existing projekttype
    - Validates required fields (Navn, ProjekttypeID)

    **Returns:**
    - 201 Created with project data
    - 404 Not Found if projekttype doesn't exist
    """
    # FK validation: Check if projekttype exists (Subtask 10.2)
    validate_projekttype_exists(projekt_data.ProjekttypeID, db)

    # Create new projekt
    db_projekt = AMOProjekt(
        Navn=projekt_data.Navn,
        ProjekttypeID=projekt_data.ProjekttypeID,
        Status=projekt_data.Status,
        OprettetDato=projekt_data.OprettetDato or datetime.now(),
        SidstOpdateret=datetime.now()
    )

    try:
        db.add(db_projekt)
        db.commit()
        db.refresh(db_projekt)

        # Eager load projekttype for response
        db_projekt = db.query(AMOProjekt).options(
            joinedload(AMOProjekt.projekttype)
        ).filter(AMOProjekt.ID == db_projekt.ID).first()

        return ProjektDetailResponse(
            success=True,
            data=ProjektOut.model_validate(db_projekt)
        )

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )


# Subtask 10.4: PUT /projekter/{id}
@router.put("/{id}", response_model=ProjektDetailResponse)
async def update_projekt(
    id: int,
    projekt_data: ProjektUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing project (full update).

    **Path parameters:**
    - id: Project ID to update

    **Request Body:**
    All fields are optional. Only provided fields will be updated.

    **Validation:**
    - If ProjekttypeID is provided, validates it exists
    - Automatically updates SidstOpdateret timestamp
    """
    # Get existing projekt
    db_projekt = db.query(AMOProjekt).filter(AMOProjekt.ID == id).first()

    if not db_projekt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {id} not found"
        )

    # FK validation if ProjekttypeID is being updated
    if projekt_data.ProjekttypeID is not None:
        validate_projekttype_exists(projekt_data.ProjekttypeID, db)

    # Update fields
    update_data = projekt_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_projekt, field, value)

    # Always update SidstOpdateret
    db_projekt.SidstOpdateret = datetime.now()

    try:
        db.commit()
        db.refresh(db_projekt)

        # Eager load projekttype for response
        db_projekt = db.query(AMOProjekt).options(
            joinedload(AMOProjekt.projekttype)
        ).filter(AMOProjekt.ID == db_projekt.ID).first()

        return ProjektDetailResponse(
            success=True,
            data=ProjektOut.model_validate(db_projekt)
        )

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )


# Subtask 10.4: PATCH /projekter/{id} (partial update)
@router.patch("/{id}", response_model=ProjektDetailResponse)
async def patch_projekt(
    id: int,
    projekt_data: ProjektUpdate,
    db: Session = Depends(get_db)
):
    """
    Partially update an existing project.

    Same as PUT but semantically indicates partial update.
    Only fields present in request body will be updated.
    """
    return await update_projekt(id, projekt_data, db)


# Subtask 10.4: DELETE /projekter/{id}
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_projekt(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a project by ID.

    **Path parameters:**
    - id: Project ID to delete

    **Returns:**
    - 204 No Content on success
    - 404 Not Found if project doesn't exist

    **Note:**
    This performs a hard delete. Consider implementing soft delete
    for production use (e.g., add a 'Slettet' boolean field).
    """
    db_projekt = db.query(AMOProjekt).filter(AMOProjekt.ID == id).first()

    if not db_projekt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {id} not found"
        )

    try:
        db.delete(db_projekt)
        db.commit()
        return None  # 204 No Content

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete project: {str(e)}. It may have related records."
        )
