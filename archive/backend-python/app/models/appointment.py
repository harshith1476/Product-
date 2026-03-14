from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("hospital_tieup_doctors.id"), nullable=False)
    
    slot_date = Column(String, nullable=False) # Format: YYYY-MM-DD
    slot_time = Column(String, nullable=False) # Format: HH:MM
    session = Column(String, nullable=False) # "Morning" or "Evening"
    
    token_number = Column(Integer, nullable=False)
    
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment = Column(Boolean, default=False)
    payment_status = Column(String, default="pending") # pending, paid, failed, refunded
    payment_method = Column(String, default="payOnVisit")
    
    status = Column(String, default="pending") # pending, completed, cancelled
    cancelled = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    
    # Metadata for the ticket
    user_data = Column(JSON, nullable=True)
    doctor_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="appointments")
    doctor = relationship("HospitalTieUpDoctor", back_populates="appointments")
    health_records = relationship("HealthRecord", back_populates="appointment")
    consultation = relationship("Consultation", back_populates="appointment", uselist=False)

# Need to update User and HospitalTieUpDoctor models to include appointments relationship
