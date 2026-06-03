from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class Citation(BaseModel):
    text: str
    source: str

class SessionResponse(BaseModel):
    id: str
    status: str
    created_at: datetime
    patientName: Optional[str] = None
    ageMonths: Optional[int] = None
    scores: Optional[List[Dict[str, Any]]] = []
    citations: Optional[List[Citation]] = []
    recommendations: Optional[List[str]] = []
    ml_prediction: Optional[Dict[str, Any]] = {}
    
    model_config = ConfigDict(from_attributes=True)
