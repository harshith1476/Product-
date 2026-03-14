from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("hospital_tieup_doctors.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    diagnosis = Column(String, nullable=True)
    prescription = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    attachments = Column(JSON, default=[]) # List of file URLs/data
    record_type = Column(String, default="general") # prescription, report, immunisation, etc.
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)
    record_date = Column(Date, default=func.current_date())
    
    tags = Column(JSON, default=[]) # List of strings
    is_important = Column(Boolean, default=False)
    uploaded_before_appointment = Column(Boolean, default=False)
    
    viewed_by_doctor = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="health_records")
    doctor = relationship("HospitalTieUpDoctor", back_populates="health_records")
    appointment = relationship("Appointment", back_populates="health_records")
