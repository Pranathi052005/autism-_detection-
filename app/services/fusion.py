import logging
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fuse_scores(
    questionnaire_proba: float,  # 0.0 to 1.0 from XGBoost predict_proba
    video_risk: float,           # 0.0 to 1.0 from compute_video_risk
    audio_risk: float,           # 0.0 to 1.0 from compute_audio_risk
    weights: Optional[Dict] = None
) -> Dict:
    """
    Fuse multimodal scores into final autism risk assessment.
    
    Args:
        questionnaire_proba: Probability from XGBoost model (0.0 to 1.0)
        video_risk: Video-based risk score (0.0 to 1.0)
        audio_risk: Audio-based risk score (0.0 to 1.0)
        weights: Optional custom weights for each modality
        
    Returns:
        Dictionary with final score, risk level, and breakdown
    """
    try:
        logger.info(f"Fusing scores: questionnaire={questionnaire_proba:.3f}, "
                   f"video={video_risk}, audio={audio_risk}")
        
        # Handle null/None values for video and audio
        if video_risk is None:
            logger.info("Video risk score is None, treating as 0.0")
            video_risk = 0.0
            
        if audio_risk is None:
            logger.info("Audio risk score is None, treating as 0.0")
            audio_risk = 0.0
        
        # Adjust weights based on available modalities
        available_modalities = []
        if questionnaire_proba is not None:
            available_modalities.append("questionnaire")
        if video_risk is not None:
            available_modalities.append("video")
        if audio_risk is not None:
            available_modalities.append("audio")
        
        logger.info(f"Available modalities: {available_modalities}")
        
        # Dynamic weights based on available modalities
        if len(available_modalities) == 1:
            # Only questionnaire available
            weights = {"questionnaire": 1.0}
        elif len(available_modalities) == 2:
            # Two modalities available
            if "questionnaire" in available_modalities and "video" in available_modalities:
                weights = {"questionnaire": 0.70, "video": 0.30}
            elif "questionnaire" in available_modalities and "audio" in available_modalities:
                weights = {"questionnaire": 0.80, "audio": 0.20}
            else:  # video + audio only
                weights = {"video": 0.60, "audio": 0.40}
        else:
            # All three modalities available
            weights = {
                "questionnaire": 0.60,
                "video": 0.25,
                "audio": 0.15
            }
        
        # Special handling for high questionnaire risk to prevent dilution by default scores
        if questionnaire_proba >= 0.8:
            # High questionnaire risk should dominate the decision
            logger.info(f"High questionnaire risk detected ({questionnaire_proba:.3f}), prioritizing questionnaire result")
            final_score = questionnaire_proba
            final_score_pct = round(final_score * 100, 1)
            risk_level = "High"
            color = "red"
            message = "Multiple indicators detected. Please seek a professional evaluation promptly."
        else:
            # Normal fusion calculation for lower questionnaire scores
            final_score = (
                weights["questionnaire"] * questionnaire_proba +
                weights["video"] * video_risk +
                weights["audio"] * audio_risk
            )
            
            # Convert to percentage
            final_score_pct = round(final_score * 100, 1)
            
            # Determine risk level and color
            if final_score_pct <= 40:
                risk_level = "Low"
                color = "green"
                message = "No significant ASD indicators detected. Continue monitoring development."
            elif final_score_pct <= 70:
                risk_level = "Medium"
                color = "yellow"
                message = "Some indicators present. A consultation with a pediatric specialist is recommended."
            else:
                risk_level = "High"
                color = "red"
                message = "Multiple indicators detected. Please seek a professional evaluation promptly."
        
        # Create breakdown
        breakdown = {
            "questionnaire_score": round(questionnaire_proba * 100, 1),
            "video_score": round(video_risk * 100, 1),
            "audio_score": round(audio_risk * 100, 1),
            "weights": weights
        }
        
        result = {
            "final_score": final_score_pct,          # 0.0 to 100.0
            "risk_level": risk_level,               # "Low" / "Medium" / "High"
            "color": color,                         # "green" / "yellow" / "red"
            "message": message,                     # human-readable message
            "breakdown": breakdown
        }
        
        logger.info(f"Fusion result: final_score={final_score_pct}%, "
                   f"risk_level={risk_level}, color={color}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error fusing scores: {str(e)}")
        # Return neutral result on error
        return {
            "final_score": 50.0,
            "risk_level": "Medium",
            "color": "yellow",
            "message": "Error in score fusion. Please try again.",
            "breakdown": {
                "questionnaire_score": 0.0,
                "video_score": 0.0,
                "audio_score": 0.0,
                "weights": {"questionnaire": 0.60, "video": 0.25, "audio": 0.15}
            }
        }

def validate_scores(questionnaire_proba: float, video_risk: float, audio_risk: float) -> bool:
    """
    Validate that all scores are in valid range [0.0, 1.0].
    
    Args:
        questionnaire_proba: Questionnaire probability
        video_risk: Video risk score
        audio_risk: Audio risk score
        
    Returns:
        True if all scores are valid, False otherwise
    """
    try:
        scores = [questionnaire_proba, video_risk, audio_risk]
        for score in scores:
            if not isinstance(score, (int, float)) or score < 0.0 or score > 1.0:
                logger.error(f"Invalid score detected: {score}")
                return False
        return True
    except Exception as e:
        logger.error(f"Error validating scores: {str(e)}")
        return False

def get_risk_explanation(risk_level: str) -> Dict:
    """
    Get detailed explanation for each risk level.
    
    Args:
        risk_level: "Low", "Medium", or "High"
        
    Returns:
        Dictionary with explanation and recommendations
    """
    explanations = {
        "Low": {
            "title": "Low Risk Assessment",
            "description": "The assessment indicates typical developmental patterns with minimal autism risk indicators.",
            "recommendations": [
                "Continue regular developmental monitoring",
                "Maintain age-appropriate social interactions",
                "Follow standard pediatric check-up schedule",
                "Observe for any changes in behavior over time"
            ],
            "next_steps": "No immediate action required. Continue normal developmental activities."
        },
        "Medium": {
            "title": "Medium Risk Assessment",
            "description": "Some indicators suggest potential developmental concerns that warrant further evaluation.",
            "recommendations": [
                "Schedule consultation with pediatric specialist",
                "Consider formal developmental assessment",
                "Implement early intervention strategies if recommended",
                "Monitor progress closely over next 3-6 months"
            ],
            "next_steps": "Professional consultation recommended within 1-2 months."
        },
        "High": {
            "title": "High Risk Assessment",
            "description": "Multiple indicators suggest significant developmental concerns requiring prompt professional evaluation.",
            "recommendations": [
                "Seek immediate professional evaluation",
                "Request comprehensive autism assessment",
                "Explore early intervention services",
                "Contact local autism support organizations"
            ],
            "next_steps": "Professional evaluation should be sought as soon as possible."
        }
    }
    
    return explanations.get(risk_level, explanations["Medium"])
