from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.crud.base import CRUDBase
from app.models.consultation import Consultation
from app.schemas.base import BaseSchema

class CRUDConsultation(CRUDBase[Consultation, BaseSchema, BaseSchema]):
    async def get_by_user(self, db: AsyncSession, *, user_id: int) -> List[Consultation]:
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_doctor(self, db: AsyncSession, *, doctor_id: int) -> List[Consultation]:
        result = await db.execute(
            select(self.model)
            .where(self.model.doctor_id == doctor_id)
            .order_by(self.model.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_appointment(self, db: AsyncSession, *, appointment_id: int) -> Optional[Consultation]:
        result = await db.execute(
            select(self.model).where(self.model.appointment_id == appointment_id)
        )
        return result.scalar_one_or_none()

consultation = CRUDConsultation(Consultation)
