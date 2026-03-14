from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.crud.base import CRUDBase
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

class CRUDAppointment(CRUDBase[Appointment, AppointmentCreate, AppointmentUpdate]):
    async def get_by_user(self, db: AsyncSession, *, user_id: int) -> List[Appointment]:
        result = await db.execute(
            select(Appointment).where(Appointment.user_id == user_id).order_by(Appointment.created_at.desc())
        )
        return result.scalars().all()

    async def get_slot_count(
        self, db: AsyncSession, *, doctor_id: int, slot_date: str, session: str
    ) -> int:
        """Count booked slots for a specific doctor, date and session."""
        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.doctor_id == doctor_id,
                Appointment.slot_date == slot_date,
                Appointment.session == session,
                # Appointment.payment == True # Only count confirmed/paid bookings?
                # User says "morning or evening session and payment was successful"
                Appointment.payment_status == "paid"
            )
        )
        return result.scalar_one()

    async def get_next_token(
        self, db: AsyncSession, *, doctor_id: int, slot_date: str, session: str
    ) -> int:
        """Get next token number for a session."""
        result = await db.execute(
            select(func.max(Appointment.token_number)).where(
                Appointment.doctor_id == doctor_id,
                Appointment.slot_date == slot_date,
                Appointment.session == session
            )
        )
        max_token = result.scalar_one()
        return (max_token or 0) + 1

    async def get_booked_slots(self, db: AsyncSession, *, doctor_id: int) -> dict:
        """Get all booked slots for a doctor in {date: [times]} format."""
        result = await db.execute(
            select(Appointment).where(
                Appointment.doctor_id == doctor_id,
                Appointment.cancelled == False
            )
        )
        appointments = result.scalars().all()
        
        booked_slots = {}
        for appt in appointments:
            if appt.slot_date not in booked_slots:
                booked_slots[appt.slot_date] = []
            booked_slots[appt.slot_date].append(appt.slot_time)
            
        return booked_slots

appointment = CRUDAppointment(Appointment)
