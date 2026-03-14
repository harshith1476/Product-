
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class SpecialtyBase(BaseModel):
    specialty_name: Optional[str] = None
    helpline_number: Optional[str] = None
    availability: Optional[str] = "24x7"
    status: Optional[str] = "Active"

class SpecialtyCreate(SpecialtyBase):
    specialty_name: str
    
class SpecialtyUpdate(SpecialtyBase):
    updated_by: Optional[str] = None

class SpecialtyInDBBase(SpecialtyBase):
    id: int
    updated_by: Optional[str] = None
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Specialty(SpecialtyInDBBase):
    pass
