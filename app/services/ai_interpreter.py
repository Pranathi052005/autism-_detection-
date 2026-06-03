import google.generativeai as genai
import json
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()
GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL   = settings.GEMINI_MODEL or "gemini-1.5-flash"

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def build_interpretation_prompt(
    questionnaire_answers: dict,
    questionnaire_score: float,
    video_features: dict,
    video_risk_score: float,
    audio_features: dict,
    audio_risk_score: float,
    final_score: float,
    risk_level: str,
    child_age_months: int,
    video_analyzed: bool = False,
    audio_analyzed: bool = False
) -> str:

    question_labels = {
        "A1":  "Responds to name",
        "A2":  "Eye contact",
        "A3":  "Points to request",
        "A4":  "Points to share interest",
        "A5":  "Pretend play",
        "A6":  "Follows gaze",
        "A7":  "Shows empathy",
        "A8":  "Typical first words",
        "A9":  "Uses gestures",
        "A10": "Does not stare at nothing"
    }

    flagged = [
        f"{question_labels[k]} ({k})"
        for k, v in questionnaire_answers.items()
        if v == 1
    ]
    flagged_str = ', '.join(flagged) if flagged else 'None'

    # Build analyzed modalities list
    analyzed = ["Questionnaire"]
    if video_analyzed: analyzed.append("Video")
    if audio_analyzed: analyzed.append("Audio")

    # Build video section
    video_section = ""
    if video_analyzed:
        video_section = f"""
VIDEO ANALYSIS RESULTS:
- Eye contact ratio: {video_features.get('eye_contact_ratio', 'N/A')}
  (Typical: 0.50 to 0.70 | Below 0.50 = potential indicator)
- Head movement variability: {video_features.get('head_movement_std', 'N/A')}
  (Typical: 0.01 to 0.05 | Above 0.05 = potential indicator)
- Face detected in: {video_features.get('face_detected_ratio', 'N/A')} of frames
- Video risk score: {video_risk_score * 100:.1f}%
"""

    # Build audio section
    audio_section = ""
    if audio_analyzed:
        audio_section = f"""
AUDIO ANALYSIS RESULTS:
- Pitch variability: {audio_features.get('pitch_variability', 'N/A')} Hz
  (Typical: 15 to 150 Hz | Outside range = potential indicator)
- Vocal energy: {audio_features.get('energy_mean', 'N/A')}
  (Typical: above 0.015 | Below = flat affect indicator)
- Speech rate: {audio_features.get('speech_rate', 'N/A')}
  (Typical: below 0.13 | Above = atypical articulation)
- Duration analyzed: {audio_features.get('duration_seconds', 'N/A')} seconds
- Audio risk score: {audio_risk_score * 100:.1f}%
"""

    prompt = f"""You are a clinical AI assistant supporting early autism
spectrum disorder (ASD) screening for toddlers. You are NOT making
a diagnosis. You are providing an observational interpretation to
help parents understand results and decide whether to seek
professional advice.

CHILD INFORMATION:
- Age: {child_age_months} months old

MODALITIES ANALYZED: {', '.join(analyzed)}

QUESTIONNAIRE RESULTS:
- Risk score: {questionnaire_score:.1f}%
- Flagged behavioral indicators: {flagged_str}
{video_section}
{audio_section}
OVERALL RESULT:
- Final screening score: {final_score:.1f} / 100
- Risk level: {risk_level}

INSTRUCTIONS:
Respond ONLY with a valid JSON object.
No text before or after the JSON.
No markdown code fences.
No explanation outside the JSON.
Use supportive, parent-friendly language.
Do not diagnose. Do not use alarming language.

Required JSON format:
{{
  "summary": "2-3 sentence plain English summary of what the screening found",
  "video_observation": "1-2 sentences interpreting the video features {'(not analyzed)' if not video_analyzed else ''}",
  "audio_observation": "1-2 sentences interpreting the audio features {'(not analyzed)' if not audio_analyzed else ''}",
  "questionnaire_observation": "1-2 sentences about flagged behavioral indicators",
  "what_this_means": "2-3 sentences explaining what this risk level means for the parent",
  "key_findings": ["finding 1 based on actual data", "finding 2", "finding 3", "finding 4"],
  "developmental_considerations": ["age-specific consideration 1", "consideration 2", "consideration 3", "consideration 4"],
  "recommendations": [
    {{
      "category": "Immediate Actions",
      "priority": "high",
      "items": ["action 1", "action 2"]
    }},
    {{
      "category": "Therapeutic Interventions",
      "priority": "medium",
      "items": ["intervention 1", "intervention 2"]
    }},
    {{
      "category": "Educational Support",
      "priority": "medium",
      "items": ["support 1", "support 2"]
    }},
    {{
      "category": "Home Environment",
      "priority": "low",
      "items": ["home strategy 1", "home strategy 2"]
    }}
  ],
  "recommended_next_steps": ["step 1", "step 2", "step 3"],
  "important_disclaimer": "One sentence reminding this is a screening tool not a diagnosis"
}}"""

    return prompt


def get_ai_interpretation(
    questionnaire_answers: dict,
    questionnaire_score: float,
    video_features: dict,
    video_risk_score: float,
    audio_features: dict,
    audio_risk_score: float,
    final_score: float,
    risk_level: str,
    child_age_months: int,
    video_analyzed: bool = False,
    audio_analyzed: bool = False
) -> dict:

    try:
        # Check API key exists
        if not GEMINI_API_KEY:
            logger.warning("No Gemini API key found — using fallback")
            return _fallback_interpretation(risk_level)

        # Build prompt
        prompt = build_interpretation_prompt(
            questionnaire_answers, questionnaire_score,
            video_features, video_risk_score,
            audio_features, audio_risk_score,
            final_score, risk_level, child_age_months,
            video_analyzed, audio_analyzed
        )

        # Call Gemini
        model    = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=2048,
            )
        )

        raw_text = response.text.strip()
        logger.info(f"Gemini response received, length: {len(raw_text)}")

        # Clean markdown fences if Gemini adds them
        if "```" in raw_text:
            parts = raw_text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw_text = part
                    break

        # Extract JSON object
        start = raw_text.find("{")
        end   = raw_text.rfind("}") + 1
        if start != -1 and end > start:
            raw_text = raw_text[start:end]

        interpretation = json.loads(raw_text)

        # Validate all required keys exist
        required_keys = [
            "summary",
            "video_observation",
            "audio_observation",
            "questionnaire_observation",
            "what_this_means",
            "key_findings",
            "developmental_considerations",
            "recommendations",
            "recommended_next_steps",
            "important_disclaimer"
        ]
        for key in required_keys:
            if key not in interpretation:
                if key == "key_findings":
                    interpretation[key] = []
                elif key == "developmental_considerations":
                    interpretation[key] = []
                elif key == "recommendations":
                    interpretation[key] = []
                elif key == "recommended_next_steps":
                    interpretation[key] = []
                else:
                    interpretation[key] = ""

        if not isinstance(interpretation.get("key_findings"), list):
            interpretation["key_findings"] = []
        
        if not isinstance(interpretation.get("developmental_considerations"), list):
            interpretation["developmental_considerations"] = []
        
        if not isinstance(interpretation.get("recommendations"), list):
            interpretation["recommendations"] = []

        if not isinstance(interpretation.get("recommended_next_steps"), list):
            interpretation["recommended_next_steps"] = [
                "Consult a pediatric specialist"
            ]

        interpretation["ai_powered"] = True
        interpretation["model_used"] = GEMINI_MODEL
        return interpretation

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from Gemini: {e}")
        fallback = _fallback_interpretation(risk_level)
        fallback["parse_error"] = True
        return fallback

    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return _fallback_interpretation(risk_level, error=str(e))


def _fallback_interpretation(risk_level: str, error: str = None) -> dict:
    messages = {
        "Low": {
            "summary": (
                "The screening did not detect significant ASD indicators "
                "at this time. Your child's responses are within typical "
                "developmental ranges."
            ),
            "what_this_means": (
                "A low risk result means no strong indicators were found "
                "across the questionnaire, video, and audio assessments. "
                "Continue regular developmental monitoring and routine "
                "pediatric checkups."
            ),
            "steps": [
                "Continue regular pediatric checkups",
                "Monitor developmental milestones as your child grows",
                "Repeat this screening in 3 to 6 months if you have concerns"
            ],
            "key_findings": [
                "Child demonstrates typical social engagement responses",
                "Communication patterns are within developmental norms",
                "Behavioral indicators are minimal",
                "Overall developmental trajectory is positive"
            ],
            "developmental_considerations": [
                "Continue regular developmental surveillance",
                "Maintain consistent communication with pediatrician",
                "Support typical play and social interactions",
                "Document any future concerns for follow-up"
            ],
            "recommendations": [
                {
                    "category": "Monitoring & Prevention",
                    "priority": "low",
                    "items": [
                        "Continue routine developmental screening",
                        "Engage in typical early childhood activities",
                        "Maintain close relationship with pediatrician"
                    ]
                },
                {
                    "category": "Family Support",
                    "priority": "low",
                    "items": [
                        "Provide typical daily interactions and play",
                        "Support language development through conversation",
                        "Engage with peers and family members"
                    ]
                },
                {
                    "category": "Educational Support",
                    "priority": "low",
                    "items": [
                        "Ensure age-appropriate early care if applicable",
                        "Support exploration and play-based learning",
                        "Foster positive peer relationships"
                    ]
                },
                {
                    "category": "Home Environment",
                    "priority": "low",
                    "items": [
                        "Maintain predictable daily routines",
                        "Create opportunities for social interaction",
                        "Support emerging language and communication"
                    ]
                }
            ]
        },
        "Medium": {
            "summary": (
                "The screening detected some indicators that may warrant "
                "further attention. This does not mean your child has ASD."
            ),
            "what_this_means": (
                "A medium risk result means some behavioral or sensory "
                "patterns were noted that are sometimes associated with ASD. "
                "Many children with these patterns do not have ASD. "
                "A professional evaluation will give you a clearer picture."
            ),
            "steps": [
                "Schedule an appointment with your pediatrician soon",
                "Share these screening results with your doctor",
                "Consider a referral to a child development specialist"
            ],
            "key_findings": [
                "Some areas of social communication show variation from typical",
                "Behavioral patterns warrant further evaluation",
                "Multimodal assessment shows mixed results",
                "Early professional assessment recommended"
            ],
            "developmental_considerations": [
                "Early intervention services can be beneficial",
                "Professional evaluation is appropriate next step",
                "Monitor communication and social development closely",
                "Individual profile requires specialist assessment"
            ],
            "recommendations": [
                {
                    "category": "Immediate Actions",
                    "priority": "high",
                    "items": [
                        "Schedule developmental evaluation with pediatrician",
                        "Request referral to child development specialist",
                        "Document current skills and concerns for specialist"
                    ]
                },
                {
                    "category": "Therapeutic Interventions",
                    "priority": "medium",
                    "items": [
                        "Consider speech-language pathology evaluation",
                        "Explore occupational therapy assessment",
                        "Discuss early intervention eligibility with specialist"
                    ]
                },
                {
                    "category": "Educational Support",
                    "priority": "medium",
                    "items": [
                        "Plan early childhood services if applicable",
                        "Coordinate with school/preschool if enrolled",
                        "Implement supportive classroom strategies"
                    ]
                },
                {
                    "category": "Home Environment",
                    "priority": "medium",
                    "items": [
                        "Establish visual supports and clear routines",
                        "Practice targeted communication strategies",
                        "Create supportive play-based learning activities"
                    ]
                }
            ]
        },
        "High": {
            "summary": (
                "The screening detected multiple indicators associated "
                "with ASD traits across behavioral, visual, and audio "
                "assessments."
            ),
            "what_this_means": (
                "A high risk result means several patterns were identified "
                "that are commonly associated with ASD. Early professional "
                "evaluation and intervention, if appropriate, is most effective "
                "before age 3. Please seek an evaluation promptly."
            ),
            "steps": [
                "Seek an evaluation from a developmental pediatrician promptly",
                "Contact local early intervention services immediately",
                "Request referral to ASD evaluation center"
            ],
            "key_findings": [
                "Multiple behavioral indicators across assessed domains",
                "Social communication patterns require specialist evaluation",
                "Sensory/motor patterns suggest need for intervention",
                "Urgent professional assessment is recommended"
            ],
            "developmental_considerations": [
                "Early intervention before age 3 is most effective",
                "Comprehensive evaluation by ASD specialist needed",
                "Family support services will be beneficial",
                "Individual profile may benefit from targeted therapies"
            ],
            "recommendations": [
                {
                    "category": "Immediate Actions",
                    "priority": "high",
                    "items": [
                        "Contact developmental pediatrician immediately",
                        "Access early intervention services without delay",
                        "Initiate comprehensive ASD evaluation process",
                        "Document all developmental concerns and strengths"
                    ]
                },
                {
                    "category": "Therapeutic Interventions",
                    "priority": "high",
                    "items": [
                        "Begin speech-language therapy evaluation",
                        "Pursue occupational therapy assessment",
                        "Consider Applied Behavior Analysis (ABA) consultation",
                        "Explore relationship-based intervention approaches"
                    ]
                },
                {
                    "category": "Educational Support",
                    "priority": "high",
                    "items": [
                        "Enroll in early intervention preschool services",
                        "Develop Individualized Family Service Plan (IFSP)",
                        "Coordinate care across service providers",
                        "Plan transition to special education services"
                    ]
                },
                {
                    "category": "Home Environment",
                    "priority": "high",
                    "items": [
                        "Implement structured daily routines and visual schedules",
                        "Create sensory-friendly spaces and supports",
                        "Use evidence-based communication strategies",
                        "Coordinate family involvement in intervention plan"
                    ]
                }
            ]
        }
    }

    data = messages.get(risk_level, messages["Medium"])

    result = {
        "summary":                   data["summary"],
        "video_observation":         "Video analysis completed using computer vision feature extraction.",
        "audio_observation":         "Audio analysis completed using acoustic signal processing.",
        "questionnaire_observation": "Behavioral questionnaire responses analyzed using trained ML model.",
        "what_this_means":           data["what_this_means"],
        "key_findings":              data.get("key_findings", []),
        "developmental_considerations": data.get("developmental_considerations", []),
        "recommendations":           data.get("recommendations", []),
        "recommended_next_steps":    data["steps"],
        "important_disclaimer": (
            "This is an early screening tool only and does not constitute "
            "a medical diagnosis. Always consult a qualified healthcare "
            "professional for a formal assessment."
        ),
        "ai_powered": False
    }

    if error:
        result["error"] = error

    return result
