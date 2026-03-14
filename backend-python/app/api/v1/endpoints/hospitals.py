
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_hospital import hospital_tieup as crud_hospital, hospital_doctor as crud_doctor
from app.db.session import get_db
from app.schemas.hospital import (
    HospitalTieUp,
    HospitalTieUpCreate,
    HospitalTieUpUpdate,
    HospitalTieUpDoctor,
    HospitalTieUpDoctorCreate
)
from app.models.user import User

router = APIRouter()

@router.get("/list", response_model=List[HospitalTieUp])
async def read_hospitals(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve public hospital tie-ups.
    """
    hospitals = await crud_hospital.get_public_hospitals(db)
    return hospitals

@router.get("/all", response_model=List[HospitalTieUp])
async def read_all_hospitals(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve all hospital tie-ups (Admin only).
    """
    hospitals = await crud_hospital.get_multi(db, skip=skip, limit=limit)
    return hospitals

@router.get("/{id}", response_model=HospitalTieUp)
async def read_hospital(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    """
    Get hospital by ID with doctors.
    """
    hospital = await crud_hospital.get_with_doctors(db, id=id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.post("/add", response_model=HospitalTieUp)
async def create_hospital(
    *,
    db: AsyncSession = Depends(get_db),
    hospital_in: HospitalTieUpCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new hospital tie-up (Admin only).
    """
    try:
        hospital = await crud_hospital.create(db, obj_in=hospital_in)
        return hospital
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create hospital: {str(e)}")

@router.post("/doctor/add", response_model=HospitalTieUpDoctor)
async def create_doctor(
    *,
    db: AsyncSession = Depends(get_db),
    doctor_in: HospitalTieUpDoctorCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Add doctor to hospital tie-up (Admin only).
    """
    hospital = await crud_hospital.get(db, id=doctor_in.hospital_tieup_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    doctor = await crud_doctor.create(db, obj_in=doctor_in)
    return doctor

@router.put("/update/{id}", response_model=HospitalTieUp)
async def update_hospital(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    hospital_in: HospitalTieUpUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update hospital tie-up (Admin only).
    """
    hospital = await crud_hospital.get(db, id=id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    hospital = await crud_hospital.update(db, db_obj=hospital, obj_in=hospital_in)
    return hospital

@router.delete("/delete/{id}")
async def delete_hospital(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete hospital tie-up (Admin only).
    """
    hospital = await crud_hospital.get(db, id=id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    await crud_hospital.remove(db, id=id)
    return {"message": "Hospital deleted successfully", "id": id}
