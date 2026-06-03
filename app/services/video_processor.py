import cv2
import numpy as np
import tempfile
import os
import logging
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Maximum frames to analyze for video performance
MAX_ANALYSIS_FRAMES = 80

# Try to import MediaPipe with graceful fallback
try:
    import mediapipe as mp
    MP_AVAILABLE = True
    try:
        mp_face_mesh = mp.solutions.face_mesh
        mp_drawing = mp.solutions.drawing_utils
        mp_drawing_styles = mp.solutions.drawing_styles
        logger.info("MediaPipe imported successfully")
    except AttributeError as e:
        logger.warning(f"MediaPipe solutions not available: {e}")
        MP_AVAILABLE = False
        mp_face_mesh = None
        mp_drawing = None
        mp_drawing_styles = None
except ImportError as e:
    logger.warning(f"MediaPipe not available: {e}")
    MP_AVAILABLE = False
    mp_face_mesh = None
    mp_drawing = None
    mp_drawing_styles = None

def extract_video_features(video_path: str) -> Dict:
    """
    Extract features from video file using OpenCV and MediaPipe FaceMesh.
    
    Args:
        video_path: Path to video file
        
    Returns:
        Dictionary with extracted features and error information
    """
    try:
        logger.info(f"Processing video: {video_path}")
        
        # Check if MediaPipe is available
        if not MP_AVAILABLE:
            logger.warning("MediaPipe not available, returning mock features")
            return {
                "eye_contact_ratio": 0.5,  # Mock value
                "head_movement_std": 0.03,  # Mock value
                "head_movement_mean": 0.02,  # Mock value
                "face_detected_ratio": 0.8,  # Mock value
                "total_frames": 100,  # Mock value
                "error": "MediaPipe not available - using mock features"
            }
        
        # Initialize MediaPipe Face Mesh
        with mp_face_mesh.FaceMesh(
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as face_mesh:
            
            # Open video file
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {
                    "eye_contact_ratio": 0.0,
                    "head_movement_std": 0.0,
                    "head_movement_mean": 0.0,
                    "face_detected_ratio": 0.0,
                    "total_frames": 0,
                    "error": "Could not open video file"
                }
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            logger.info(f"Video FPS: {fps}, Total frames: {total_frames}")

            if total_frames <= 0 or fps <= 0:
                return {
                    "eye_contact_ratio": 0.0,
                    "head_movement_std": 0.0,
                    "head_movement_mean": 0.0,
                    "face_detected_ratio": 0.0,
                    "total_frames": 0,
                    "error": "Invalid video file or unable to determine frame count"
                }
            
            frame_skip = max(1, total_frames // MAX_ANALYSIS_FRAMES)
            
            # Initialize tracking variables
            eye_contact_frames = 0
            face_detected_frames = 0
            nose_positions = []
            prev_nose = None
            displacements = []
            
            frame_count = 0
            processed_frames = 0
            
            # Process each frame
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % frame_skip != 0:
                    continue
                
                processed_frames += 1
                if processed_frames > MAX_ANALYSIS_FRAMES:
                    break
                
                if results.multi_face_landmarks:
                    face_detected_frames += 1
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Get key landmarks
                    # Left eye (index 33), Right eye (index 263), Nose tip (index 1)
                    left_eye = landmarks.landmark[33]
                    right_eye = landmarks.landmark[263]
                    nose_tip = landmarks.landmark[1]
                    
                    # Store nose position for movement tracking
                    nose_pos = np.array([nose_tip.x, nose_tip.y])
                    nose_positions.append(nose_pos)
                    
                    # Calculate face symmetry for eye contact detection
                    # Face symmetry: abs(left_eye.x - (1 - right_eye.x))
                    symmetry = abs(left_eye.x - (1 - right_eye.x))
                    
                    # Eye contact condition: symmetry < 0.07 AND nose_tip.z < 0
                    if symmetry < 0.07 and nose_tip.z < 0:
                        eye_contact_frames += 1
                    
                    # Calculate displacement from previous frame
                    if prev_nose is not None:
                        displacement = np.linalg.norm(nose_pos - prev_nose)
                        displacements.append(displacement)
                    
                    prev_nose = nose_pos
            
            # Release video capture
            cap.release()
            
            # Calculate final metrics
            if processed_frames == 0:
                return {
                    "eye_contact_ratio": 0.0,
                    "head_movement_std": 0.0,
                    "head_movement_mean": 0.0,
                    "face_detected_ratio": 0.0,
                    "total_frames": total_frames,
                    "error": "No usable frames were analyzed"
                }
            
            # Calculate ratios and statistics using processed frames
            eye_contact_ratio = eye_contact_frames / processed_frames
            face_detected_ratio = face_detected_frames / processed_frames
            
            # Calculate movement statistics
            if displacements:
                head_movement_std = float(np.std(displacements))
                head_movement_mean = float(np.mean(displacements))
            else:
                head_movement_std = 0.0
                head_movement_mean = 0.0
            
            logger.info(f"Extracted features: eye_contact_ratio={eye_contact_ratio:.3f}, "
                       f"head_movement_std={head_movement_std:.3f}, "
                       f"face_detected_ratio={face_detected_ratio:.3f}")
            
            return {
                "eye_contact_ratio": float(eye_contact_ratio),
                "head_movement_std": float(head_movement_std),
                "head_movement_mean": float(head_movement_mean),
                "face_detected_ratio": float(face_detected_ratio),
                "total_frames": int(total_frames),
                "error": None
            }
            
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return {
            "eye_contact_ratio": 0.0,
            "head_movement_std": 0.0,
            "head_movement_mean": 0.0,
            "face_detected_ratio": 0.0,
            "total_frames": 0,
            "error": str(e)
        }

def compute_video_risk(eye_contact_ratio: float, head_movement_std: float) -> float:
    """
    Compute video-based autism risk score using clinical thresholds.
    
    Args:
        eye_contact_ratio: Fraction of frames with eye contact (0.0 to 1.0)
        head_movement_std: Standard deviation of head movements (typically 0.01 to 0.15)
        
    Returns:
        Risk score between 0.0 and 1.0
    """
    try:
        # Clinical thresholds from literature
        THRESHOLDS = {
            "eye_contact_ratio": 0.50,   # below = at risk
            "head_movement_std": 0.05,   # above = at risk
        }
        
        # Edge cases
        if eye_contact_ratio == 0.0 and head_movement_std == 0.0:
            return 0.5  # neutral if no data
        
        if eye_contact_ratio < 0.10:  # very low face detection
            return 0.6  # slightly elevated risk
        
        # Eye contact risk (weight 0.70)
        if eye_contact_ratio < THRESHOLDS["eye_contact_ratio"]:
            deficit = THRESHOLDS["eye_contact_ratio"] - eye_contact_ratio
            eye_risk = min(deficit / THRESHOLDS["eye_contact_ratio"], 1.0)
        else:
            eye_risk = 0.0
        
        # Head movement risk (weight 0.30)
        if head_movement_std > THRESHOLDS["head_movement_std"]:
            excess = head_movement_std - THRESHOLDS["head_movement_std"]
            head_risk = min(excess / THRESHOLDS["head_movement_std"], 1.0)
        else:
            head_risk = 0.0
        
        # Combined risk score
        video_risk = (0.70 * eye_risk) + (0.30 * head_risk)
        
        logger.info(f"Video risk calculation: eye_risk={eye_risk:.3f}, "
                   f"head_risk={head_risk:.3f}, video_risk={video_risk:.3f}")
        
        return round(video_risk, 4)
        
    except Exception as e:
        logger.error(f"Error computing video risk: {str(e)}")
        return 0.5  # neutral risk on error

def cleanup_temp_file(file_path: str) -> None:
    """Clean up temporary file."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {str(e)}")
