
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi.encoders import jsonable_encoder

from app.crud.base import CRUDBase
from app.models.hospital import HospitalTieUp, HospitalTieUpDoctor
from app.schemas.hospital import (
    HospitalTieUpCreate,
    HospitalTieUpUpdate,
    HospitalTieUpDoctorCreate,
    HospitalTieUpDoctorUpdate
)

class CRUDHospitalTieUp(CRUDBase[HospitalTieUp, HospitalTieUpCreate, HospitalTieUpUpdate]):
    async def create(self, db: AsyncSession, *, obj_in: HospitalTieUpCreate) -> HospitalTieUp:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.flush()  # flush to get the ID without committing

        # Reload with doctors relationship eagerly loaded
        # This prevents MissingGreenlet when Pydantic serializes the response
        query = (
            select(HospitalTieUp)
            .where(HospitalTieUp.id == db_obj.id)
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        loaded_obj = result.scalar_one()

        await db.commit()
        return loaded_obj

    async def get(self, db: AsyncSession, id: int) -> Optional[HospitalTieUp]:
        """Override get to eagerly load doctors."""
        query = (
            select(HospitalTieUp)
            .where(HospitalTieUp.id == id)
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_doctors(self, db: AsyncSession, id: int) -> Optional[HospitalTieUp]:
        query = (
            select(HospitalTieUp)
            .where(HospitalTieUp.id == id)
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_public_hospitals(self, db: AsyncSession) -> List[HospitalTieUp]:
        query = (
            select(HospitalTieUp)
            .where(HospitalTieUp.show_on_home == True)
            .order_by(HospitalTieUp.name.asc())
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[HospitalTieUp]:
        """Override get_multi to eagerly load doctors."""
        query = (
            select(HospitalTieUp)
            .offset(skip).limit(limit)
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def update(
        self, db: AsyncSession, *, db_obj: HospitalTieUp, obj_in: HospitalTieUpUpdate
    ) -> HospitalTieUp:
        """Override update to eagerly reload doctors after updating."""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.model_dump(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        await db.flush()
        
        # Reload with doctors
        query = (
            select(HospitalTieUp)
            .where(HospitalTieUp.id == db_obj.id)
            .options(selectinload(HospitalTieUp.doctors))
        )
        result = await db.execute(query)
        loaded_obj = result.scalar_one()
        
        await db.commit()
        return loaded_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[HospitalTieUp]:
        """Override remove to eagerly load doctors before deleting."""
        # Load with doctors first (for the response)
        obj = await self.get(db, id=id)
        if obj is None:
            return None
        
        # Store a copy of the data as a dict before deleting
        await db.delete(obj)
        await db.commit()
        return obj

class CRUDHospitalTieUpDoctor(CRUDBase[HospitalTieUpDoctor, HospitalTieUpDoctorCreate, HospitalTieUpDoctorUpdate]):
    async def get_by_hospital(self, db: AsyncSession, hospital_id: int) -> List[HospitalTieUpDoctor]:
        query = (
            select(HospitalTieUpDoctor)
            .where(HospitalTieUpDoctor.hospital_tieup_id == hospital_id)
            .order_by(HospitalTieUpDoctor.name.asc())
        )
        result = await db.execute(query)
        return result.scalars().all()

hospital_tieup = CRUDHospitalTieUp(HospitalTieUp)
hospital_doctor = CRUDHospitalTieUpDoctor(HospitalTieUpDoctor)
