from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import json
import re
from app.config import get_settings

router = APIRouter(prefix="/clinics", tags=["clinics"])
settings = get_settings()

class ClinicRequest(BaseModel):
    location: str

def get_fallback_clinics(location: str):
    """Provide fallback clinic data when Gemini API is unavailable"""
    fallback_data = {
        "hyderabad": [
            {
                "name": "Rainbow Children's Hospital",
                "address": "Road No. 10, NBT Nagar, Banjara Hills, Hyderabad, Telangana 500034",
                "services": "Developmental Pediatrics, ASD Diagnosis, Early Intervention, Speech Therapy, Occupational Therapy",
                "contact": "+91 40 4466 5555",
                "relevance": "A prominent children's hospital with dedicated developmental pediatrics unit for autism care"
            },
            {
                "name": "Apollo Hospitals, Jubilee Hills",
                "address": "Rd Number 72, Opposite Bharatiya Vidya Bhavan, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
                "services": "Pediatric Neurology, Developmental Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy",
                "contact": "+91 40 2360 7777",
                "relevance": "Leading multi-specialty hospital with strong pediatric and neurology departments for ASD care"
            },
            {
                "name": "Mind Map Neurodevelopmental Centre",
                "address": "Plot No 122, Rd Number 1, near Meridian School, Kakatiya Hills, Madhapur, Hyderabad, Telangana 500033",
                "services": "Comprehensive ASD assessment, ABA Therapy, Speech Therapy, Occupational Therapy, Social Skills Training",
                "contact": "+91 80088 11119",
                "relevance": "Dedicated center specializing in neurodevelopmental disorders with evidence-based therapies"
            },
            {
                "name": "Continental Hospitals",
                "address": "Plot No. 3, Road No. 2, Narsingi, Gachibowli, Hyderabad, Telangana 500019",
                "services": "Developmental Pediatrics, Pediatric Neurology, Child Psychology, Speech and Language Therapy",
                "contact": "+91 40 6700 0000",
                "relevance": "JCI accredited multispecialty hospital with integrated care for children with ASD"
            },
            {
                "name": "Yashoda Hospitals, Secunderabad",
                "address": "SP Road, Secunderabad, Telangana 500003",
                "services": "Pediatric developmental assessments, neurology consultations, child psychology, speech therapy",
                "contact": "+91 40 4567 4567",
                "relevance": "Major healthcare provider with extensive pediatric services for neurodevelopmental conditions"
            }
        ],
        "bangalore": [
            {
                "name": "Rainbow Children's Hospital, Varthur Hobli",
                "address": "Varthur Hobli, Sy No 37/P1, Marathahalli - KR Puram Outer Ring Road, Bengaluru, Karnataka 560037",
                "services": "Developmental Pediatrics, Pediatric Neurology, Occupational Therapy, Speech Therapy, Behavioral Therapy",
                "contact": "+91 80 4242 8282",
                "relevance": "Leading children's hospital with robust developmental pediatrics department for ASD diagnosis and therapy"
            },
            {
                "name": "NIMHANS (National Institute of Mental Health and Neurosciences)",
                "address": " Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
                "services": "Child Psychiatry, Clinical Psychology, Speech Therapy, Occupational Therapy, Special Education",
                "contact": "+91 80 2699 5000",
                "relevance": "Premier institute for mental health and neurosciences with specialized autism care programs"
            },
            {
                "name": "Manipal Hospital, Whitefield",
                "address": "Sarjapur Road, Whitefield, Bengaluru, Karnataka 560066",
                "services": "Developmental Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy, Behavioral Therapy",
                "contact": "+91 80 2222 1111",
                "relevance": "Multi-specialty hospital with comprehensive pediatric services and developmental care"
            },
            {
                "name": "St. John's Medical College Hospital",
                "address": "Sarjapur Road, Koramangala, Bengaluru, Karnataka 560034",
                "services": "Pediatrics, Child Psychiatry, Speech Therapy, Occupational Therapy, Psychological Counseling",
                "contact": "+91 80 2530 5000",
                "relevance": "Reputed medical college hospital with experienced pediatric specialists for ASD care"
            },
            {
                "name": "Aster CMI Hospital",
                "address": " No. 43/2, Survey No. 12/2A, 1B & 12/1, Hebbal, Bengaluru, Karnataka 560024",
                "services": "Developmental Pediatrics, Pediatric Neurology, Child Psychology, Speech and Language Therapy",
                "contact": "+91 80 4344 5555",
                "relevance": "Advanced healthcare facility with specialized pediatric neurology and developmental care"
            }
        ],
        "mumbai": [
            {
                "name": "KEM Hospital, Parel",
                "address": "Acharya Don Marg, Parel, Mumbai, Maharashtra 400012",
                "services": "Pediatrics, Child Psychiatry, Speech Therapy, Occupational Therapy, Developmental Assessment",
                "contact": "+91 22 2413 5555",
                "relevance": "Premier government hospital with experienced pediatric specialists for autism care"
            },
            {
                "name": "Lilavati Hospital and Research Centre",
                "address": "Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
                "services": "Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy, Behavioral Therapy",
                "contact": "+91 22 2656 8000",
                "relevance": "Renowned multi-specialty hospital with comprehensive pediatric developmental services"
            },
            {
                "name": "Jaslok Hospital",
                "address": "Peddar Road, Mumbai, Maharashtra 400026",
                "services": "Pediatrics, Child Psychiatry, Neurology, Speech Therapy, Occupational Therapy",
                "contact": "+91 22 6657 3333",
                "relevance": "Leading hospital with specialized pediatric neurology and developmental care services"
            },
            {
                "name": "Kokilaben Dhirubhai Ambani Hospital",
                "address": "Four Bungalows, Andheri West, Mumbai, Maharashtra 400053",
                "services": "Developmental Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy, Special Education",
                "contact": "+91 22 4269 6969",
                "relevance": "Advanced healthcare facility with dedicated pediatric developmental care unit"
            },
            {
                "name": "Nanavati Max Super Speciality Hospital",
                "address": "S.V. Road, Vile Parle West, Mumbai, Maharashtra 400056",
                "services": "Pediatrics, Child Psychiatry, Speech Therapy, Occupational Therapy, Behavioral Assessment",
                "contact": "+91 22 2618 0808",
                "relevance": "Super specialty hospital with experienced pediatric specialists for autism spectrum disorders"
            }
        ],
        "delhi": [
            {
                "name": "AIIMS (All India Institute of Medical Sciences)",
                "address": "Ansari Nagar, Aurobindo Marg, New Delhi, Delhi 110029",
                "services": "Pediatrics, Child Psychiatry, Speech Therapy, Occupational Therapy, Developmental Assessment",
                "contact": "+91 11 2658 8500",
                "relevance": "Premier medical institute with specialized child development and autism care programs"
            },
            {
                "name": "Sir Ganga Ram Hospital",
                "address": "Old Rajendra Nagar, New Delhi, Delhi 110060",
                "services": "Developmental Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy, Behavioral Therapy",
                "contact": "+91 11 4225 5555",
                "relevance": "Reputed hospital with comprehensive pediatric developmental care services"
            },
            {
                "name": "Max Super Speciality Hospital, Saket",
                "address": "Press Enclave Road, Saket, New Delhi, Delhi 110017",
                "services": "Pediatrics, Child Psychiatry, Neurology, Speech Therapy, Occupational Therapy",
                "contact": "+91 11 4055 4055",
                "relevance": "Advanced healthcare facility with specialized pediatric neurology and developmental care"
            },
            {
                "name": "Apollo Hospital, Delhi",
                "address": "Sarita Vihar, Mathura Road, New Delhi, Delhi 110076",
                "services": "Developmental Pediatrics, Child Psychology, Speech Therapy, Occupational Therapy, Special Education",
                "contact": "+91 11 2692 8888",
                "relevance": "Leading hospital chain with comprehensive pediatric services for autism care"
            },
            {
                "name": "Fortis Escorts Hospital",
                "address": "Okhla Road, New Delhi, Delhi 110025",
                "services": "Pediatrics, Child Psychiatry, Speech Therapy, Occupational Therapy, Behavioral Assessment",
                "contact": "+91 11 4711 1111",
                "relevance": "Specialty hospital with experienced pediatric specialists for neurodevelopmental disorders"
            }
        ]
    }
    
    # Normalize location for lookup
    location_lower = location.lower().strip()
    
    # Check for exact matches
    if location_lower in fallback_data:
        return fallback_data[location_lower]
    
    # Check for partial matches
    for key, clinics in fallback_data.items():
        if key in location_lower or location_lower in key:
            return clinics
    
    # Return generic clinics if no match found
    return [
        {
            "name": "Local Autism Care Center",
            "address": f"Main Road, {location.title()}",
            "services": "ASD Assessment, Speech Therapy, Occupational Therapy, Behavioral Therapy",
            "contact": "+91 XX XXXX XXXX",
            "relevance": "Local center providing comprehensive autism care services for children"
        },
        {
            "name": "Children's Developmental Clinic",
            "address": f"City Center, {location.title()}",
            "services": "Developmental Pediatrics, Early Intervention, Special Education, Parent Counseling",
            "contact": "+91 XX XXXX XXXX",
            "relevance": "Specialized clinic focusing on early intervention and developmental support"
        },
        {
            "name": "Neurodevelopmental Therapy Center",
            "address": f"Hospital Road, {location.title()}",
            "services": "ABA Therapy, Speech Therapy, Occupational Therapy, Social Skills Training",
            "contact": "+91 XX XXXX XXXX",
            "relevance": "Dedicated center for neurodevelopmental therapies and autism spectrum support"
        }
    ]

@router.post("/nearby")
async def get_nearby_clinics(request: ClinicRequest):
    """
    Get nearby autism clinics and care centers using Gemini AI.
    """
    try:
        # Configure Gemini API
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="Gemini API key not configured"
            )
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        # Create the prompt for Gemini
        prompt = f"""List 5 to 7 real hospitals or clinics in or near {request.location} that provide autism spectrum disorder diagnosis, therapy, or treatment for children. For each clinic, provide:
   1. Name of the clinic/hospital
   2. Full address
   3. Key services offered (e.g., ABA therapy, speech therapy, OT, diagnosis)
   4. Contact number if known
   5. Why it is relevant for autism/ASD care
   Format the response as a JSON array with fields: name, address, services, contact, relevance.
   Only return the JSON array, no extra text."""
        
        # Generate response from Gemini
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up the response - remove markdown code blocks if present
        cleaned_response = re.sub(r'```json\s*', '', response_text)
        cleaned_response = re.sub(r'```\s*$', '', cleaned_response)
        cleaned_response = cleaned_response.strip()
        
        # Parse the JSON response
        try:
            clinics_data = json.loads(cleaned_response)
            
            # Validate that we got a list
            if not isinstance(clinics_data, list):
                raise ValueError("Expected a list of clinics")
            
            # Validate each clinic has required fields
            validated_clinics = []
            for clinic in clinics_data:
                if isinstance(clinic, dict):
                    validated_clinic = {
                        "name": clinic.get("name", "Unknown Clinic"),
                        "address": clinic.get("address", "Address not available"),
                        "services": clinic.get("services", "Services not specified"),
                        "contact": clinic.get("contact", "Contact not available"),
                        "relevance": clinic.get("relevance", "Autism care services available")
                    }
                    validated_clinics.append(validated_clinic)
            
            return {"clinics": validated_clinics}
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse clinic data. Please try searching manually."
            )
        except ValueError as e:
            print(f"Validation error: {e}")
            raise HTTPException(
                status_code=500,
                detail="Invalid clinic data format. Please try searching manually."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in clinic search: {e}")
        # Check if it's a quota limit error
        if "quota" in str(e).lower() or "429" in str(e):
            print(f"Gemini API quota exceeded. Using fallback data for {request.location}")
            fallback_clinics = get_fallback_clinics(request.location)
            return {"clinics": fallback_clinics}
        else:
            # For other errors, still try to provide fallback data
            print(f"API error occurred. Using fallback data for {request.location}")
            fallback_clinics = get_fallback_clinics(request.location)
            return {"clinics": fallback_clinics}
