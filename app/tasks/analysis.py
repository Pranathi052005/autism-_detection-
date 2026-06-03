import json
from sqlalchemy.orm import Session
from app.models.session import PatientSession
from app.services.multimodal import merge_scores
from app.services.rag import retrieve_evidence
from app.services.report import generate_report

def run_analysis(
    session_id: str, 
    patient_name: str, 
    age_months: int, 
    notes: str, 
    questionnaire: str, 
    video_paths: list[str], 
    audio_paths: list[str], 
    ml_prediction: dict = None,
    db: Session = None
):
    try:
        scores = merge_scores(questionnaire, video_paths, audio_paths)
        
        query = str(notes) + " " + str(questionnaire)
        evidence = retrieve_evidence(query)
        
        report_data = generate_report(patient_name, age_months, notes, questionnaire, scores, evidence)
        
        final_report = {
            "scores": scores,
            "citations": evidence,
            "recommendations": report_data.get("recommendations", []),
            "ml_prediction": ml_prediction or {}
        }
        
        print(f"📊 Analysis Task - ML Prediction: {ml_prediction}")
        print(f"📊 Analysis Task - Final Report Keys: {list(final_report.keys())}")
        print(f"📊 Analysis Task - ML Prediction in Report: {final_report.get('ml_prediction', 'Missing')}")
        
        db_session = db.query(PatientSession).filter(PatientSession.id == session_id).first()
        if db_session:
            db_session.status = "completed"
            db_session.report_data = final_report
            db.commit()
            print(f"✅ Report stored for session {session_id}")
            print(f"✅ Stored ML Prediction: {db_session.report_data.get('ml_prediction', 'Missing')}")
            
    except Exception as e:
        print(f"Background task failed: {e}")
        db_session = db.query(PatientSession).filter(PatientSession.id == session_id).first()
        if db_session:
            db_session.status = "failed"
            db.commit()
