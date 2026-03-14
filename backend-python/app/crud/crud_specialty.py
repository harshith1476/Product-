
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.models.specialty import Specialty
from app.schemas.specialty import SpecialtyCreate, SpecialtyUpdate

class CRUDSpecialty(CRUDBase[Specialty, SpecialtyCreate, SpecialtyUpdate]):
    async def get_by_name(self, db: AsyncSession, *, name: str) -> Optional[Specialty]:
        query = select(Specialty).where(Specialty.specialty_name == name)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_active(self, db: AsyncSession) -> List[Specialty]:
        # Ordering by name asc is common requirement
        query = select(Specialty).where(Specialty.status == "Active").order_by(Specialty.specialty_name.asc())
        result = await db.execute(query)
        return result.scalars().all()

specialty = CRUDSpecialty(Specialty)
