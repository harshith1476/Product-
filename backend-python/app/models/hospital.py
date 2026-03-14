
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship as orm_relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class HospitalTieUp(Base):
    __tablename__ = "hospital_tieups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    address = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    type = Column(String, default="General") # e.g. "Public", "Private", "Super-Specialty"
    show_on_home = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    doctors = orm_relationship("HospitalTieUpDoctor", back_populates="hospital_tieup", cascade="all, delete-orphan", lazy="selectin")

class HospitalTieUpDoctor(Base):
    __tablename__ = "hospital_tieup_doctors"

    id = Column(Integer, primary_key=True, index=True)
    hospital_tieup_id = Column(Integer, ForeignKey("hospital_tieups.id"), nullable=False)
    
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    qualification = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    image = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    fees = Column(Integer, default=50)
    available = Column(Boolean, default=True)
    show_on_hospital_page = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    hospital_tieup = orm_relationship("HospitalTieUp", back_populates="doctors")
    appointments = orm_relationship("Appointment", back_populates="doctor")
    health_records = orm_relationship("HealthRecord", back_populates="doctor")
    consultations = orm_relationship("Consultation", back_populates="doctor")
