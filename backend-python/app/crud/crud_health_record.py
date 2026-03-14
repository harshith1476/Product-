from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.crud.base import CRUDBase
from app.models.health_record import HealthRecord
from app.schemas.base import BaseSchema # Assuming a generic schema or define one

class CRUDHealthRecord(CRUDBase[HealthRecord, BaseSchema, BaseSchema]):
    async def get_by_user(self, db: AsyncSession, *, user_id: int) -> List[HealthRecord]:
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
        )
        return result.scalars().all()

    async def get_multi_by_doctor(self, db: AsyncSession, *, doctor_id: int) -> List[HealthRecord]:
        result = await db.execute(
            select(self.model)
            .where(self.model.doctor_id == doctor_id)
            .order_by(self.model.created_at.desc())
        )
        return result.scalars().all()

health_record = CRUDHealthRecord(HealthRecord)
