import uuid
from sqlalchemy import Column, String, Integer, JSON, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PatientSession(Base):
    __tablename__ = "patient_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, nullable=True, index=True)  # For JWT auth integration
    patient_name = Column(String, index=True)
    age_months = Column(Integer)
    notes = Column(String, nullable=True)
    status = Column(String, default="processing") # "processing", "completed", "failed"
    report_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String, ForeignKey("patient_sessions.id"), nullable=True)
    user_id = Column(String, nullable=True, index=True)  # For JWT auth integration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Individual scores
    questionnaire_score = Column(Float, nullable=False)
    video_score = Column(Float, nullable=True)
    audio_score = Column(Float, nullable=True)
    
    # Combined results
    final_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # "Low", "Medium", "High"
    
    # Detailed breakdown
    breakdown = Column(JSON, nullable=True)  # Store fusion breakdown details
    
    # AI interpretation
    ai_interpretation = Column(JSON, nullable=True)  # Store Gemini AI interpretation
    
    # Relationships
    session = relationship("PatientSession", backref="screening_results")
