
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# ==========================================
# Hospital Tie-Up Doctor
# ==========================================
class HospitalTieUpDoctorBase(BaseModel):
    name: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[str] = None
    image: Optional[str] = None
    available: Optional[bool] = True
    show_on_hospital_page: Optional[bool] = True

class HospitalTieUpDoctorCreate(HospitalTieUpDoctorBase):
    name: str # required
    hospital_tieup_id: int

class HospitalTieUpDoctorUpdate(HospitalTieUpDoctorBase):
    pass

class HospitalTieUpDoctorInDBBase(HospitalTieUpDoctorBase):
    id: int
    hospital_tieup_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HospitalTieUpDoctor(HospitalTieUpDoctorInDBBase):
    pass

# ==========================================
# Hospital Tie-Up
# ==========================================
class HospitalTieUpBase(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    specialization: Optional[str] = None
    type: Optional[str] = "General"
    show_on_home: Optional[bool] = False

class HospitalTieUpCreate(HospitalTieUpBase):
    name: str # required

class HospitalTieUpUpdate(HospitalTieUpBase):
    pass

class HospitalTieUpInDBBase(HospitalTieUpBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HospitalTieUp(HospitalTieUpInDBBase):
    doctors: List[HospitalTieUpDoctor] = []
