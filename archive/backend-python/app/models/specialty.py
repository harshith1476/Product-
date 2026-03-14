
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship as orm_relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Specialty(Base):
    __tablename__ = "specialties"

    id = Column(Integer, primary_key=True, index=True)
    specialty_name = Column(String, nullable=False, unique=True, index=True)
    helpline_number = Column(String, nullable=True)
    availability = Column(String, default="24x7")
    status = Column(String, default="Active")
    updated_by = Column(String, nullable=True)
    
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
