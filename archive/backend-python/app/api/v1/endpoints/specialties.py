
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_specialty import specialty as crud_specialty
from app.db.session import get_db
from app.schemas.specialty import Specialty, SpecialtyCreate, SpecialtyUpdate
from app.models.user import User

router = APIRouter()

@router.get("/list", response_model=List[Specialty])
async def read_specialties(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve active specialties.
    """
    specialties = await crud_specialty.get_all_active(db)
    return specialties

@router.post("/add", response_model=Specialty)
async def create_specialty(
    *,
    db: AsyncSession = Depends(get_db),
    specialty_in: SpecialtyCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new specialty (Admin only).
    """
    specialty = await crud_specialty.get_by_name(db, name=specialty_in.specialty_name)
    if specialty:
        raise HTTPException(
            status_code=400,
            detail="The specialty with this name already exists in the system.",
        )
    specialty = await crud_specialty.create(db, obj_in=specialty_in)
    return specialty

@router.put("/update/{id}", response_model=Specialty)
async def update_specialty(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    specialty_in: SpecialtyUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update a specialty (Admin only).
    """
    specialty = await crud_specialty.get(db, id=id)
    if not specialty:
        raise HTTPException(
            status_code=404,
            detail="Specialty not found",
        )
    specialty = await crud_specialty.update(db, db_obj=specialty, obj_in=specialty_in)
    return specialty

@router.delete("/delete/{id}")
async def delete_specialty(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete a specialty (Admin only).
    """
    specialty = await crud_specialty.get(db, id=id)
    if not specialty:
        raise HTTPException(
            status_code=404,
            detail="Specialty not found",
        )
    await crud_specialty.remove(db, id=id)
    return {"message": "Specialty deleted successfully", "id": id}
