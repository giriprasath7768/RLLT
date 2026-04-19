from typing import Any
from datetime import datetime, timedelta
import uuid as uuid_mod
import secrets
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import User, PasswordReset, UserRole
from app.core import security
from app.core.config import settings
from app.schemas.user import Token, UserInfo, ForgotPasswordRequest, UserRegister, ResetPasswordConfirmRequest
from app.services.email_service import send_password_reset_email, send_student_activation_email

router = APIRouter()

@router.post("/login", response_model=dict)
async def login_access_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    email_clean = form_data.username.strip()
    pwd_clean = form_data.password.strip()
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalars().first()
    
    if user:
        if not security.verify_password(pwd_clean, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        elif not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        role_name = user.role.value if hasattr(user.role, 'value') else str(user.role)
        target_subject = user.id
    else:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    try:
        access_token = security.create_access_token(
            subject=target_subject, role=role_name
        )
    except Exception as e:
        import traceback
        with open("login_error.log", "a") as f:
            f.write(f"{datetime.now()} - Error: {str(e)}\n{traceback.format_exc()}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,    # Disabled for localhost HTTP traversal
        samesite="lax"   # Lax is good for CSRF protection while still allowing some cross-site nav
    )
    
    return {"message": "Successfully logged in"}

@router.post("/logout", response_model=dict)
async def logout(response: Response) -> Any:
    """
    Clear the access token cookie
    """
    response.delete_cookie("access_token", httponly=True, secure=False, samesite="lax")
    return {"message": "Successfully logged out"}

from pydantic import BaseModel
class TTomLoginRequest(BaseModel):
    mobile_number: str
    pin: str

@router.post("/ttom-login", response_model=dict)
async def ttom_login_endpoint(
    body: TTomLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    from app.db.models import TTOMUser
    ttom_result = await db.execute(select(TTOMUser).where(TTOMUser.mobile_number == body.mobile_number.strip()))
    ttom_user = ttom_result.scalars().first()

    if not ttom_user:
        raise HTTPException(status_code=400, detail="Incorrect mobile number or PIN")
    
    if not security.verify_password(body.pin.strip(), ttom_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect mobile number or PIN")
        
    if not ttom_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    role_name = "ttom_user"
    target_subject = ttom_user.id

    try:
        access_token = security.create_access_token(
            subject=target_subject, role=role_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"message": "Successfully logged in as T-Tom-T user"}

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
        
    try:
        from jose import jwt
        from app.core.config import settings
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        # Fallback to check TTOMUser table natively
        from app.db.models import TTOMUser
        ttom_result = await db.execute(select(TTOMUser).where(TTOMUser.id == user_id))
        ttom_user = ttom_result.scalars().first()
        
        if ttom_user:
            class MockUser:
                id = ttom_user.id
                email = None
                role = "ttom_user"
                is_active = ttom_user.is_active
                assessment_status = "pending"
                assessment_marks = None
            return MockUser()
            
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

from typing import Optional

async def get_current_user_optional(request: Request, db: AsyncSession = Depends(get_db)) -> Optional[User]:
    token = request.cookies.get("access_token")
    if not token:
        return None
    
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
        
    try:
        from jose import jwt
        from app.core.config import settings
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except Exception:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    return user

@router.get("/me", response_model=UserInfo)
async def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user info, leveraging the HttpOnly cookie
    """
    return current_user

@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Request a password-reset email.

    Always returns the same generic message regardless of whether the email
    exists in the database, to prevent email-enumeration attacks.
    """
    safe_message = "If this email is registered, a reset link has been sent."

    from sqlalchemy import func
    import logging
    logger = logging.getLogger(__name__)

    # Look up user — if not found, return the safe message immediately
    result = await db.execute(select(User).where(func.lower(User.email) == func.lower(body.email.strip())))
    user = result.scalars().first()

    if not user:
        logger.warning(f"Forgot password attempt for unknown email: {body.email}")
    else:
        logger.info(f"Generating password reset token for: {user.email}")

    if user:
        # Generate a unique token and compute expiry
        token = str(uuid_mod.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        reset_entry = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        db.add(reset_entry)
        await db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(to_email=user.email, reset_url=reset_url)

    return {"message": safe_message}

@router.post("/reset-password", response_model=dict)
async def reset_password(
    body: ResetPasswordConfirmRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Look up token in PasswordReset
    result = await db.execute(select(PasswordReset).where(PasswordReset.token == body.token))
    reset_entry = result.scalars().first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid token.")

    if reset_entry.expires_at.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token has expired.")

    # 2. Get user
    result = await db.execute(select(User).where(User.id == reset_entry.user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    # 3. Update password
    user.hashed_password = security.get_password_hash(body.new_password)
    
    # 4. Clean up token
    await db.delete(reset_entry)
    await db.commit()

    return {"message": "Password has been successfully reset."}

# Replaced mock with send_student_activation_email from email_service

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(
    body: UserRegister,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 1. Validation
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="This email is already in use.")
    
    # 2. Auto-Generation
    enroll_id = "ACR-" + uuid_mod.uuid4().hex[:8].upper()
    temp_password = secrets.token_hex(4) # Alphanumeric Hex block prevents accidental '-' email drag truncation
    
    # 3. Persistence
    new_user = User(
        email=body.email,
        hashed_password=security.get_password_hash(temp_password),
        role=UserRole.student,
        is_active=True,
        name=body.name,
        address=body.address,
        mobile_number=body.mobile_number,
        dob=body.dob,
        gender=body.gender,
        enrollment_number=enroll_id,
        location_id=body.location_id,
        category=body.category,
        stage=body.stage
    )
    db.add(new_user)
    await db.commit()
    
    # 4. Email mapped natively to SMTP template
    background_tasks.add_task(send_student_activation_email, body.email, body.name, enroll_id, temp_password)
    
    return {"message": "Registration successful"}
