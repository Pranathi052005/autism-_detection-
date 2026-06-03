from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import sessions, screening, clinics, auth
from app.database import Base, engine
import traceback

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutismDetect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:8002", "http://127.0.0.1:8002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler - returns error WITH cors headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("🚨 GLOBAL ERROR:", traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(screening.router)
app.include_router(clinics.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
