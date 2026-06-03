import os
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, UploadFile, File, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import PatientSession
from app.schemas.session import SessionResponse
from app.tasks.analysis import run_analysis
from app.services.autism_predictor import predict_autism, get_model_info
from app.config import get_settings
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])
settings = get_settings()

@router.post("", response_model=SessionResponse, status_code=202)
def create_session(
    background_tasks: BackgroundTasks,
    patientName: str = Form(...),
    ageMonths: int = Form(...),
    sex: Optional[str] = Form(None),
    jaundice: Optional[str] = Form(None),
    familyAsd: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    questionnaire: Optional[str] = Form(None),
    encodedFeatures: Optional[str] = Form(None),
    videos: List[UploadFile] = File([]),
    audios: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    video_paths = []
    for v in videos:
        if v.filename:
            file_path = os.path.join(settings.UPLOAD_DIR, v.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(v.file, buffer)
            video_paths.append(file_path)
        
    audio_paths = []
    for a in audios:
        if a.filename:
            file_path = os.path.join(settings.UPLOAD_DIR, a.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(a.file, buffer)
            audio_paths.append(file_path)
        
    # Make ML prediction if questionnaire data is available
    ml_prediction = None
    if questionnaire:
        try:
            form_data = {
                'patientName': patientName,
                'ageMonths': ageMonths,
                'sex': sex or 'm',
                'jaundice': jaundice or 'no',
                'familyAsd': familyAsd or 'no',
                'notes': notes,
                'questionnaire': questionnaire  # Keep as JSON string
            }
            ml_prediction = predict_autism(form_data)
            print(f"✅ ML Prediction Generated: {ml_prediction}")
            print(f"✅ ML Prediction Keys: {list(ml_prediction.keys()) if ml_prediction else 'None'}")
            print(f"✅ Prediction Label: {ml_prediction.get('prediction_label', 'Missing')}")
            print(f"✅ ASD Probability: {ml_prediction.get('asd_probability', 'Missing')}")
        except Exception as e:
            print(f"❌ ML Prediction Error: {e}")
            ml_prediction = None

    new_session = PatientSession(
        user_id=current_user.id,
        patient_name=patientName,
        age_months=ageMonths,
        notes=notes,
        status="processing"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    background_tasks.add_task(
        run_analysis,
        session_id=new_session.id,
        patient_name=patientName,
        age_months=ageMonths,
        notes=notes,
        questionnaire=json.loads(questionnaire) if questionnaire else None,
        video_paths=video_paths,
        audio_paths=audio_paths,
        ml_prediction=ml_prediction,
        db=db
    )
    
    return new_session

@router.get("/{session_id}/report", response_model=SessionResponse)
def get_report(
    session_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = db.query(PatientSession)\
        .filter(PatientSession.id == session_id, PatientSession.user_id == current_user.id)\
        .first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    report = db_session.report_data or {}
    
    return {
        "id": db_session.id,
        "status": db_session.status,
        "created_at": db_session.created_at,
        "patientName": db_session.patient_name,
        "ageMonths": db_session.age_months,
        "scores": report.get("scores", []),
        "citations": report.get("citations", []),
        "recommendations": report.get("recommendations", []),
        "ml_prediction": report.get("ml_prediction", {})
    }

@router.get("/model/info")
def get_model_status():
    """Get ML model information and status"""
    try:
        return get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@router.get("", response_model=List[SessionResponse])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Always filter by current user's ID - no more demo mode
    sessions = db.query(PatientSession)\
        .filter(PatientSession.user_id == current_user.id)\
        .order_by(PatientSession.created_at.desc())\
        .all()
    res = []
    for s in sessions:
        report = s.report_data or {}
        res.append({
            "id": s.id,
            "status": s.status,
            "created_at": s.created_at,
            "patientName": s.patient_name,
            "ageMonths": s.age_months,
            "scores": report.get("scores", []),
            "citations": report.get("citations", []),
            "recommendations": report.get("recommendations", [])
        })
    return res
