import os
import tempfile
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.session import ScreeningResult
from app.models.user import User
from app.services.video_processor import extract_video_features, compute_video_risk, cleanup_temp_file
from app.services.audio_processor import extract_audio_features, compute_audio_risk, cleanup_temp_file
from app.services.fusion import fuse_scores, validate_scores
from app.services.ai_interpreter import get_ai_interpretation
from app.auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/screening", tags=["Screening"])

# Pydantic models for request/response
class VideoAnalysisResponse(BaseModel):
    success: bool
    features: Optional[dict] = None
    video_risk_score: Optional[float] = None
    video_risk_percent: Optional[float] = None
    error: Optional[str] = None

class AudioAnalysisResponse(BaseModel):
    success: bool
    features: Optional[dict] = None
    audio_risk_score: Optional[float] = None
    audio_risk_percent: Optional[float] = None
    error: Optional[str] = None

class VideoFeatures(BaseModel):
    eye_contact_ratio:   float = 0.5
    head_movement_std:   float = 0.03
    face_detected_ratio: float = 0.8
    total_frames:        int   = 0

class AudioFeatures(BaseModel):
    pitch_variability:  float = 50.0
    energy_mean:        float = 0.02
    speech_rate:        float = 0.10
    duration_seconds:   float = 10.0

class QuestionnaireAnswers(BaseModel):
    A1:  int = 0
    A2:  int = 0
    A3:  int = 0
    A4:  int = 0
    A5:  int = 0
    A6:  int = 0
    A7:  int = 0
    A8:  int = 0
    A9:  int = 0
    A10: int = 0

class FullScreeningRequest(BaseModel):
    questionnaire_proba:   float
    questionnaire_answers: QuestionnaireAnswers
    child_age_months:      int   = 24
    video_risk_score:      Optional[float] = None
    video_features:        Optional[VideoFeatures] = None
    audio_risk_score:      Optional[float] = None
    audio_features:        Optional[AudioFeatures] = None

class ScreeningHistoryResponse(BaseModel):
    id: str
    created_at: str
    final_score: float
    risk_level: str
    breakdown: dict

# File size limits (in bytes)
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_AUDIO_SIZE = 20 * 1024 * 1024  # 20MB

# Allowed file extensions
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.webm'}
AUDIO_EXTENSIONS = {'.wav', '.mp3', '.m4a', '.mp4', '.mov'}

def validate_file_size(file: UploadFile, max_size: int) -> bool:
    """Validate file size."""
    if file.size and file.size > max_size:
        return False
    return True

def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """Validate file extension."""
    file_ext = os.path.splitext(filename.lower())[1]
    return file_ext in allowed_extensions

@router.post("/video", response_model=VideoAnalysisResponse)
async def analyze_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze video file for autism risk indicators.
    
    - Accepts video files up to 50MB
    - Extracts eye contact and head movement features
    - Returns video-based risk score
    """
    try:
        logger.info(f"Processing video file: {file.filename}")
        
        # Validate file
        if not validate_file_extension(file.filename or "", VIDEO_EXTENSIONS):
            return VideoAnalysisResponse(
                success=False,
                error="Invalid file type. Allowed: .mp4, .mov, .avi, .webm"
            )
        
        if not validate_file_size(file, MAX_VIDEO_SIZE):
            return VideoAnalysisResponse(
                success=False,
                error="File too large. Maximum size: 50MB"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract video features
            features = extract_video_features(temp_file_path)
            
            if features.get("error"):
                return VideoAnalysisResponse(
                    success=False,
                    error=f"Video processing failed: {features['error']}"
                )
            
            # Compute video risk score
            video_risk = compute_video_risk(
                features["eye_contact_ratio"],
                features["head_movement_std"]
            )
            
            # Prepare response features
            response_features = {
                "eye_contact_ratio": features["eye_contact_ratio"],
                "head_movement_std": features["head_movement_std"],
                "face_detected_ratio": features["face_detected_ratio"],
                "total_frames": features["total_frames"]
            }
            
            logger.info(f"Video analysis completed: risk_score={video_risk:.3f}")
            
            return VideoAnalysisResponse(
                success=True,
                features=response_features,
                video_risk_score=video_risk,
                video_risk_percent=round(video_risk * 100, 1)
            )
            
        finally:
            # Clean up temporary file
            cleanup_temp_file(temp_file_path)
            
    except Exception as e:
        logger.error(f"Error in video analysis: {str(e)}")
        return VideoAnalysisResponse(
            success=False,
            error=f"Video analysis failed: {str(e)}"
        )

@router.post("/audio", response_model=AudioAnalysisResponse)
async def analyze_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze audio file for autism risk indicators.
    
    - Accepts audio/video files up to 20MB
    - Extracts pitch, energy, and speech features
    - Returns audio-based risk score
    """
    try:
        logger.info(f"Processing audio file: {file.filename}")
        
        # Validate file
        if not validate_file_extension(file.filename or "", AUDIO_EXTENSIONS):
            return AudioAnalysisResponse(
                success=False,
                error="Invalid file type. Allowed: .wav, .mp3, .m4a, .mp4, .mov"
            )
        
        if not validate_file_size(file, MAX_AUDIO_SIZE):
            return AudioAnalysisResponse(
                success=False,
                error="File too large. Maximum size: 20MB"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract audio features
            features = extract_audio_features(temp_file_path)
            
            if features.get("error"):
                return AudioAnalysisResponse(
                    success=False,
                    error=f"Audio processing failed: {features['error']}"
                )
            
            # Compute audio risk score
            audio_risk = compute_audio_risk(
                features["pitch_variability"],
                features["energy_mean"],
                features["speech_rate"]
            )
            
            # Prepare response features
            response_features = {
                "pitch_variability": features["pitch_variability"],
                "energy_mean": features["energy_mean"],
                "speech_rate": features["speech_rate"],
                "duration_seconds": features["duration_seconds"]
            }
            
            logger.info(f"Audio analysis completed: risk_score={audio_risk:.3f}")
            
            return AudioAnalysisResponse(
                success=True,
                features=response_features,
                audio_risk_score=audio_risk,
                audio_risk_percent=round(audio_risk * 100, 1)
            )
            
        finally:
            # Clean up temporary file
            cleanup_temp_file(temp_file_path)
            
    except Exception as e:
        logger.error(f"Error in audio analysis: {str(e)}")
        return AudioAnalysisResponse(
            success=False,
            error=f"Audio analysis failed: {str(e)}"
        )

@router.post("/full")
async def full_screening(
    request: FullScreeningRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Combine questionnaire, video, and audio scores for final assessment with AI interpretation.
    
    - Fuses multimodal scores using weighted algorithm
    - Gets AI interpretation from Gemini
    - Saves results to database
    - Returns comprehensive risk assessment with AI insights
    """
    try:
        print(f"✅ SCREENING HIT for user: {current_user.id}")
        print(f"✅ Questionnaire proba: {request.questionnaire_proba}")
        print(f"✅ Questionnaire answers: {request.questionnaire_answers}")
        print(f"✅ Child age months: {request.child_age_months}")
        print(f"✅ Video risk score: {request.video_risk_score}")
        print(f"✅ Audio risk score: {request.audio_risk_score}")
        
        logger.info(f"Processing full screening: questionnaire={request.questionnaire_proba:.3f}")
        
        # Only run video analysis if video was uploaded
        video_score = None
        video_analyzed = False
        if request.video_risk_score is not None:
            try:
                video_score = request.video_risk_score
                video_analyzed = True
                print(f"✅ Video score: {video_score}")
            except Exception as e:
                print(f"⚠️ Video analysis failed: {e}")
                video_score = None
                video_analyzed = False

        # Only run audio analysis if audio was uploaded
        audio_score = None
        audio_analyzed = False
        if request.audio_risk_score is not None:
            try:
                audio_score = request.audio_risk_score
                audio_analyzed = True
                print(f"✅ Audio score: {audio_score}")
            except Exception as e:
                print(f"⚠️ Audio analysis failed: {e}")
                audio_score = None
                audio_analyzed = False
        
        # Validate input scores (only validate if provided)
        if not validate_scores(request.questionnaire_proba, 
                             video_score or 0.0, 
                             audio_score or 0.0):
            raise HTTPException(status_code=400, detail="Invalid score values. Must be between 0.0 and 1.0")
        
        # Step 1: Fuse the three scores (only include provided modalities)
        print(f"✅ Starting score fusion...")
        fusion_result = fuse_scores(
            questionnaire_proba = request.questionnaire_proba,
            video_risk          = video_score or 0.0,
            audio_risk          = audio_score or 0.0
        )
        print(f"✅ Fusion completed: {fusion_result}")

        # Step 2: Get AI interpretation from Gemini
        print(f"✅ Starting AI interpretation...")
        ai_result = get_ai_interpretation(
            questionnaire_answers = request.questionnaire_answers.dict(),
            questionnaire_score   = request.questionnaire_proba * 100,
            video_features        = request.video_features.dict() if video_analyzed and request.video_features else {},
            video_risk_score      = video_score,
            audio_features        = request.audio_features.dict() if audio_analyzed and request.audio_features else {},
            audio_risk_score      = audio_score,
            final_score           = fusion_result["final_score"],
            risk_level            = fusion_result["risk_level"],
            child_age_months      = request.child_age_months,
            video_analyzed        = video_analyzed,
            audio_analyzed        = audio_analyzed
        )
        print(f"✅ AI interpretation completed")

        # Step 3: Save to database
        print(f"✅ Saving to database...")
        screening_record = ScreeningResult(
            user_id             = current_user.id,  # Now properly set from authenticated user
            questionnaire_score = request.questionnaire_proba * 100,
            video_score         = video_score * 100 if video_score else None,
            audio_score         = audio_score * 100 if audio_score else None,
            final_score         = fusion_result["final_score"],
            risk_level          = fusion_result["risk_level"],
            breakdown           = fusion_result["breakdown"],
            ai_interpretation   = ai_result
        )
        db.add(screening_record)
        db.commit()
        db.refresh(screening_record)
        print(f"✅ Result saved: {screening_record.id}")

        # Step 4: Return combined response
        print(f"✅ Returning response...")
        return {
            "success":      True,
            "screening_id": screening_record.id,
            "final_score":  fusion_result["final_score"],
            "risk_level":   fusion_result["risk_level"],
            "color":        fusion_result["color"],
            "message":      fusion_result["message"],
            "questionnaire_score": request.questionnaire_proba * 100,
            "video_score": video_score * 100 if video_score else None,
            "audio_score": audio_score * 100 if audio_score else None,
            "video_analyzed": video_analyzed,
            "audio_analyzed": audio_analyzed,
            "breakdown": {
                "questionnaire_score": fusion_result["breakdown"]["questionnaire_score"],
                "video_score":         fusion_result["breakdown"]["video_score"] if video_analyzed else None,
                "audio_score":         fusion_result["breakdown"]["audio_score"] if audio_analyzed else None
            },
            "ai_interpretation": ai_result
        }

    except Exception as e:
        import traceback
        print(f"❌ SCREENING CRASH: {e}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Screening failed: {str(e)}"
        )

@router.get("/history", response_model=List[ScreeningHistoryResponse])
async def get_screening_history(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get screening history for a user.
    
    - JWT protected endpoint
    - Returns last 10 screening results
    - Ordered by most recent first
    """
    try:
        logger.info(f"Getting screening history for user: {current_user.id}")
        
        # Query screening results - always filter by current user
        results = db.query(ScreeningResult)\
            .filter(ScreeningResult.user_id == current_user.id)\
            .order_by(ScreeningResult.created_at.desc())\
            .limit(limit)\
            .all()
        
        # Format response
        history = []
        for result in results:
            history.append(ScreeningHistoryResponse(
                id=result.id,
                created_at=result.created_at.isoformat(),
                final_score=result.final_score,
                risk_level=result.risk_level,
                breakdown=result.breakdown or {}
            ))
        
        logger.info(f"Returned {len(history)} screening results")
        return history
        
    except Exception as e:
        logger.error(f"Error getting screening history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@router.get("/result/{result_id}")
async def get_screening_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed screening result by ID.
    """
    try:
        result = db.query(ScreeningResult)\
            .filter(ScreeningResult.id == result_id, ScreeningResult.user_id == current_user.id)\
            .first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Screening result not found")
        
        return {
            "id": result.id,
            "session_id": result.session_id,
            "user_id": result.user_id,
            "created_at": result.created_at.isoformat(),
            "questionnaire_score": result.questionnaire_score,
            "video_score": result.video_score,
            "audio_score": result.audio_score,
            "final_score": result.final_score,
            "risk_level": result.risk_level,
            "breakdown": result.breakdown
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting screening result: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve result: {str(e)}")
