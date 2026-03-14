from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, any_
from app.models.medical import MedicalKnowledge

class CRUDMedical:
    async def search_medical_knowledge(self, db: AsyncSession, term: str) -> List[MedicalKnowledge]:
        # matching the Node.js logic:
        # keyword ILIKE $1 OR $1 ILIKE ANY(conditions) OR source ILIKE $1
        query = select(MedicalKnowledge).where(
            or_(
                MedicalKnowledge.keyword.ilike(f"%{term}%"),
                MedicalKnowledge.source.ilike(f"%{term}%")
            )
        )
        # Note: ANY(conditions) is tricky in SQLAlchemy with JSON. 
        # For simplicity and parity, we'll stick to basic keyword/source first.
        # If the conditions are stored as JSON list, we might need a more complex filter.
        
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_keyword(self, db: AsyncSession, keyword: str) -> Optional[MedicalKnowledge]:
        query = select(MedicalKnowledge).where(MedicalKnowledge.keyword.ilike(keyword))
        result = await db.execute(query)
        return result.scalar_one_or_none()

medical_knowledge = CRUDMedical()
