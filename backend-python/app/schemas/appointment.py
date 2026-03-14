from typing import Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class AppointmentBase(BaseModel):
    user_id: Optional[int] = None
    doctor_id: Optional[int] = None
    slot_date: Optional[str] = None
    slot_time: Optional[str] = None
    session: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = "payOnVisit"

class AppointmentCreate(AppointmentBase):
    user_id: int
    doctor_id: int
    slot_date: str
    slot_time: str
    session: str
    amount: Decimal
    token_number: Optional[int] = None

class AppointmentUpdate(AppointmentBase):
    payment: Optional[bool] = None
    payment_status: Optional[str] = None
    status: Optional[str] = None
    token_number: Optional[int] = None

class Appointment(AppointmentBase):
    id: int
    token_number: int
    payment: bool
    payment_status: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
