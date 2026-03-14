from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("hospital_tieup_doctors.id"), nullable=False)
    
    status = Column(String, default="ongoing") # ongoing, completed, cancelled
    type = Column(String, default="video") # video, chat
    notes = Column(Text, nullable=True)
    
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    appointment = relationship("Appointment", back_populates="consultation")
    user = relationship("User", back_populates="consultations")
    doctor = relationship("HospitalTieUpDoctor", back_populates="consultations")
