from openai import OpenAI
from app.config import get_settings
import json
import numpy as np

settings = get_settings()

CLINICAL_CHUNKS = [
    {"source": "DSM-5", "text": "Persistent deficits in social communication and social interaction across multiple contexts."},
    {"source": "DSM-5", "text": "Restricted, repetitive patterns of behavior, interests, or activities."},
    {"source": "ADOS-2", "text": "Abnormalities in eye contact, body language, or deficits in understanding and use of gestures."},
    {"source": "Clinical Guidelines", "text": "Lack of spontaneous seeking to share enjoyment, interests, or achievements with other people."}
]

try:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
except:
    client = None

def get_embedding(text: str) -> list[float]:
    if not client or settings.OPENAI_API_KEY == "sk-placeholder":
        return np.random.rand(1536).tolist()
    try:
        response = client.embeddings.create(input=[text], model="text-embedding-3-small")
        return response.data[0].embedding
    except Exception:
        return np.random.rand(1536).tolist()

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10)

CHUNK_EMBEDDINGS = [np.random.rand(1536).tolist() for _ in CLINICAL_CHUNKS]

def retrieve_evidence(query_text: str, top_k: int = 2) -> list[dict]:
    query_emb = get_embedding(query_text)
    
    similarities = []
    for idx, c_emb in enumerate(CHUNK_EMBEDDINGS):
        sim = cosine_similarity(query_emb, c_emb)
        similarities.append((sim, CLINICAL_CHUNKS[idx]))
        
    similarities.sort(key=lambda x: x[0], reverse=True)
    return [chunk[1] for chunk in similarities[:top_k]]
