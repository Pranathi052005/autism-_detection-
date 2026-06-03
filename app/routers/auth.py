"""
Authentication router for EarlyBloom Autism Detection Platform
Handles user registration, login, and token management
"""

from datetime import timedelta, datetime
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, validator

from app.database import get_db
from app.models.user import User
from app.auth import create_access_token, get_current_user

# Password hashing context - using simple hash for now due to bcrypt issues
import hashlib
def simple_hash(password: str) -> str:
    """Simple password hash for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    
    @validator('password')
    def validate_password(cls, v):
        # Truncate password if too long for bcrypt
        if len(v) > 72:
            return v[:72]
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str
    full_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return simple_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return simple_hash(password)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email from database"""
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

@router.post("/register", status_code=201)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    print(f"✅ REGISTER HIT: {user_data.full_name}, {user_data.email}")
    try:
        # Check duplicate email
        existing = db.query(User).filter(User.email == user_data.email).first()
        print(f"✅ DUPLICATE CHECK DONE: existing={existing}")
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        password = user_data.password
        print(f"✅ PASSWORD DEBUG: len={len(password)}, repr={repr(password)}, bytes={len(password.encode('utf-8'))}")
        hashed = get_password_hash(password)
        print(f"✅ PASSWORD HASHED: {hashed[:20]}...")

        # Create user
        db_user = User(
            id=str(uuid4()),
            full_name=user_data.full_name,
            email=user_data.email,
            password_hash=hashed,
            is_active=True,
            is_admin=False,
            created_at=datetime.utcnow()
        )
        print(f"✅ USER OBJECT CREATED")

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"✅ USER SAVED TO DB")

        return {
            "message": "Account created successfully",
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "full_name": db_user.full_name
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ REGISTER CRASH: {e}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user and return JWT token"""
    # Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30 * 24 * 60)  # 30 days
    access_token = create_access_token(
        data={
            "sub": user.email,
            "name": user.full_name,
            "user_id": str(user.id)
        }, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin
    )

@router.post("/logout")
def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}
