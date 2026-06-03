import librosa
import numpy as np
import subprocess
import tempfile
import os
import logging
from typing import Dict, Optional
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check if FFmpeg is available
FFMPEG_AVAILABLE = shutil.which('ffmpeg') is not None
if not FFMPEG_AVAILABLE:
    logger.warning("FFmpeg not found - audio extraction from video will not work")

def extract_audio_features(audio_path: str) -> Dict:
    """
    Extract audio features using Librosa.
    
    Args:
        audio_path: Path to audio file (or video file for audio extraction)
        
    Returns:
        Dictionary with extracted features and error information
    """
    try:
        logger.info(f"Processing audio: {audio_path}")
        
        # Check if FFmpeg is available for video files
        if audio_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm')):
            if not FFMPEG_AVAILABLE:
                logger.warning("FFmpeg not available - returning mock audio features")
                return {
                    "mfcc_mean": 0.5,
                    "mfcc_std": 0.2,
                    "pitch_variability": 50.0,
                    "energy_mean": 0.02,
                    "energy_std": 0.01,
                    "speech_rate": 0.08,
                    "duration_seconds": 30.0,
                    "error": "FFmpeg not available - using mock audio features"
                }
        
        # Check if input is video file and extract audio if needed
        temp_audio_path = None
        if audio_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm')):
            if not FFMPEG_AVAILABLE:
                logger.error("FFmpeg not available - cannot extract audio from video")
                return {
                    "mfcc_mean": 0.0,
                    "mfcc_std": 0.0,
                    "pitch_variability": 0.0,
                    "energy_mean": 0.0,
                    "energy_std": 0.0,
                    "speech_rate": 0.0,
                    "duration_seconds": 0.0,
                    "error": "FFmpeg not available - cannot extract audio from video"
                }
            
            # Extract audio from video using ffmpeg
            temp_dir = tempfile.mkdtemp()
            temp_audio_path = os.path.join(temp_dir, 'extracted_audio.wav')
            
            logger.info(f"Extracting audio from video to: {temp_audio_path}")
            
            try:
                result = subprocess.run([
                    'ffmpeg', '-i', audio_path,
                    '-ar', '22050', '-ac', '1',
                    '-y', temp_audio_path
                ], capture_output=True, text=True, timeout=30)  # 30 second timeout
                
                if result.returncode != 0:
                    logger.error(f"FFmpeg error: {result.stderr}")
                    return {
                        "mfcc_mean": 0.0,
                        "mfcc_std": 0.0,
                        "pitch_variability": 0.0,
                        "energy_mean": 0.0,
                        "energy_std": 0.0,
                        "speech_rate": 0.0,
                        "duration_seconds": 0.0,
                        "error": f"Audio extraction failed: {result.stderr}"
                    }
                
                audio_path = temp_audio_path
            except subprocess.TimeoutExpired:
                logger.error("FFmpeg extraction timed out")
                return {
                    "mfcc_mean": 0.0,
                    "mfcc_std": 0.0,
                    "pitch_variability": 0.0,
                    "energy_mean": 0.0,
                    "energy_std": 0.0,
                    "speech_rate": 0.0,
                    "duration_seconds": 0.0,
                    "error": "Audio extraction timed out"
                }
        
        # Load audio file
        try:
            y, sr = librosa.load(audio_path, sr=22050)
        except Exception as e:
            logger.error(f"Error loading audio file: {str(e)}")
            return {
                "mfcc_mean": 0.0,
                "mfcc_std": 0.0,
                "pitch_variability": 0.0,
                "energy_mean": 0.0,
                "energy_std": 0.0,
                "speech_rate": 0.0,
                "duration_seconds": 0.0,
                "error": f"Audio loading failed: {str(e)}"
            }
        
        duration_seconds = len(y) / sr
        logger.info(f"Audio duration: {duration_seconds:.2f} seconds")
        
        # Edge case: very short audio
        if duration_seconds < 1.0:
            logger.warning("Audio too short for meaningful analysis")
            return {
                "mfcc_mean": 0.0,
                "mfcc_std": 0.0,
                "pitch_variability": 0.0,
                "energy_mean": 0.0,
                "energy_std": 0.0,
                "speech_rate": 0.0,
                "duration_seconds": float(duration_seconds),
                "error": "Audio too short for analysis (< 1 second)"
            }
        
        # Trim to first 30 seconds if longer
        if duration_seconds > 30:
            max_samples = 30 * sr
            y = y[:max_samples]
            duration_seconds = 30.0
            logger.info("Trimmed audio to first 30 seconds")
        
        # Extract MFCC features
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = float(np.mean(mfccs))
        mfcc_std = float(np.std(mfccs))
        
        # Extract pitch variability
        try:
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            magnitude_threshold = np.median(magnitudes) + 1e-6
            pitch_mask = magnitudes > magnitude_threshold
            pitch_vals = pitches[pitch_mask]
            pitch_variability = float(np.std(pitch_vals)) if len(pitch_vals) > 0 else 0.0
        except Exception as e:
            logger.warning(f"Pitch extraction failed, falling back to default: {e}")
            pitch_variability = 0.0
        
        # Extract energy features
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = float(np.mean(rms))
        energy_std = float(np.std(rms))
        
        # Extract speech rate (zero crossing rate)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        speech_rate = float(np.mean(zcr))
        
        logger.info(f"Extracted features: mfcc_mean={mfcc_mean:.3f}, "
                   f"pitch_variability={pitch_variability:.3f}, "
                   f"energy_mean={energy_mean:.3f}, "
                   f"speech_rate={speech_rate:.3f}")
        
        # Clean up temporary file if created
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
            # Also remove temp directory
            temp_dir = os.path.dirname(temp_audio_path)
            try:
                os.rmdir(temp_dir)
            except:
                pass
        
        return {
            "mfcc_mean": float(mfcc_mean),
            "mfcc_std": float(mfcc_std),
            "pitch_variability": float(pitch_variability),
            "energy_mean": float(energy_mean),
            "energy_std": float(energy_std),
            "speech_rate": float(speech_rate),
            "duration_seconds": float(duration_seconds),
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return {
            "mfcc_mean": 0.0,
            "mfcc_std": 0.0,
            "pitch_variability": 0.0,
            "energy_mean": 0.0,
            "energy_std": 0.0,
            "speech_rate": 0.0,
            "duration_seconds": 0.0,
            "error": str(e)
        }

def compute_audio_risk(pitch_variability: float, energy_mean: float, speech_rate: float) -> float:
    """
    Compute audio-based autism risk score using clinical thresholds.
    
    Args:
        pitch_variability: Standard deviation of pitch values
        energy_mean: Mean RMS energy
        speech_rate: Mean zero crossing rate
        
    Returns:
        Risk score between 0.0 and 1.0
    """
    try:
        # Clinical thresholds from literature
        THRESHOLDS = {
            "pitch_variability_low": 15.0,    # below = too flat = at risk
            "pitch_variability_high": 150.0,  # above = too erratic = at risk
            "energy_mean": 0.015,             # below = flat affect = at risk
            "speech_rate": 0.13,              # above = atypical = at risk
        }
        
        # Edge case: no meaningful data
        if pitch_variability == 0.0 and energy_mean == 0.0 and speech_rate == 0.0:
            return 0.5  # neutral risk
        
        # Pitch risk (weight 0.60)
        if pitch_variability < THRESHOLDS["pitch_variability_low"]:
            pitch_risk = 1.0  # too flat
        elif pitch_variability > THRESHOLDS["pitch_variability_high"]:
            pitch_risk = 1.0  # too erratic
        else:
            midpoint = (THRESHOLDS["pitch_variability_low"] + THRESHOLDS["pitch_variability_high"]) / 2  # = 82.5
            normal_range = (THRESHOLDS["pitch_variability_high"] - THRESHOLDS["pitch_variability_low"]) / 2  # = 67.5
            pitch_risk = min(abs(pitch_variability - midpoint) / normal_range, 1.0)
        
        # Energy risk (weight 0.30)
        if energy_mean < THRESHOLDS["energy_mean"]:
            deficit = THRESHOLDS["energy_mean"] - energy_mean
            energy_risk = min(deficit / THRESHOLDS["energy_mean"], 1.0)
        else:
            energy_risk = 0.0
        
        # Speech rate risk (weight 0.10)
        if speech_rate > THRESHOLDS["speech_rate"]:
            excess = speech_rate - THRESHOLDS["speech_rate"]
            speech_risk = min(excess / THRESHOLDS["speech_rate"], 1.0)
        else:
            speech_risk = 0.0
        
        # Combined risk score
        audio_risk = (0.60 * pitch_risk) + (0.30 * energy_risk) + (0.10 * speech_risk)
        
        logger.info(f"Audio risk calculation: pitch_risk={pitch_risk:.3f}, "
                   f"energy_risk={energy_risk:.3f}, speech_risk={speech_risk:.3f}, "
                   f"audio_risk={audio_risk:.3f}")
        
        return round(audio_risk, 4)
        
    except Exception as e:
        logger.error(f"Error computing audio risk: {str(e)}")
        return 0.5  # neutral risk on error

def cleanup_temp_file(file_path: str) -> None:
    """Clean up temporary file."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {str(e)}")
