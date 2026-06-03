from openai import OpenAI
from app.config import get_settings
import json

settings = get_settings()

def generate_report(patient_name: str, age_months: int, notes: str, questionnaire: str, scores: list[dict], evidence: list[dict]) -> dict:
    if settings.OPENAI_API_KEY == "sk-placeholder":
        return {
            "recommendations": [
                "Schedule a follow-up assessment with a local pediatric specialist.",
                "Encourage daily interactive play focusing on joint attention.",
                "Maintain consistent routines and visual schedules at home."
            ]
        }
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    Analyze the following patient data for an autism detection tool context. 
    Patient: {patient_name}, Age: {age_months} months
    Notes: {notes}
    Questionnaire Responses: {questionnaire}
    Computed Scores: {json.dumps(scores)}
    Evidence context: {json.dumps(evidence)}
    
    Return a structured JSON object with a single key "recommendations" containing a list of 3 to 5 clinically appropriate, empathetic recommendation strings for the parents.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a clinical assistant expert in pediatric development. Always output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        print(f"OpenAI Generation error: {e}")
        return {
            "recommendations": [
                "Consider a follow-up assessment with a pediatric specialist.",
                "Provide a calm and supportive environment."
            ]
        }
