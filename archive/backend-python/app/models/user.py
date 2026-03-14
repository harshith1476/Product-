
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship as orm_relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    image = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    gender = Column(String, default="Not Selected")
    dob = Column(String, default="Not Selected") # Keeping as String to match Node (or Date if preferred)
    age = Column(Integer, nullable=True)
    blood_group = Column(String, nullable=True)
    role = Column(String, default="patient")
    
    reset_password_otp = Column(String, nullable=True)
    reset_password_otp_expiry = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    emergency_contacts = orm_relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    saved_profiles = orm_relationship("SavedProfile", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    appointments = orm_relationship("Appointment", back_populates="user")
    health_records = orm_relationship("HealthRecord", back_populates="user")
    consultations = orm_relationship("Consultation", back_populates="user")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation = Column(String, nullable=True)
    contact_type = Column(String, nullable=True) # e.g., "Primary", "Secondary"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = orm_relationship("User", back_populates="emergency_contacts")


class SavedProfile(Base):
    __tablename__ = "saved_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    relationship = Column(String, nullable=True) # e.g., "Father", "Mother"
    phone = Column(String, nullable=True)
    medical_history = Column(JSON, nullable=True) # Array of strings or objects
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="saved_profiles")
