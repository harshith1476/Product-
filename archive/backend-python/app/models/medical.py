from sqlalchemy import Column, Integer, String, Text, JSON
from app.db.base_class import Base

class MedicalKnowledge(Base):
    __tablename__ = "medical_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, index=True)
    category = Column(String, default="symptom")
    severity = Column(String, default="Low")
    conditions = Column(JSON, default=list) # List of related conditions
    otc_medicines = Column(JSON, default=list) # List of medicines
    precautions = Column(JSON, default=list) # List of precautions
    when_to_see_doctor = Column(Text, nullable=True)
    immediate_action = Column(Text, nullable=True)
    do_not = Column(JSON, default=list)
    source = Column(String, default="Medical Knowledge Base")
