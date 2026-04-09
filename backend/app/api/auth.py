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
from app.services.email_service import send_password_reset_email

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
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    try:
        # UserRole enum value handling
        role_name = user.role.value if hasattr(user.role, 'value') else str(user.role)
        
        access_token = security.create_access_token(
            subject=user.id, role=role_name
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
        secure=True,     # True means HTTPS only. For localhost it still works in most browsers or use conditionally.
        samesite="lax"   # Lax is good for CSRF protection while still allowing some cross-site nav
    )
    
    return {"message": "Successfully logged in"}

@router.post("/logout", response_model=dict)
async def logout(response: Response) -> Any:
    """
    Clear the access token cookie
    """
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}

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
        raise HTTPException(status_code=404, detail="User not found")
        
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

async def send_registration_email(email: str, name: str, enrollment_number: str, password: str):
    await asyncio.sleep(1)
    print(f"\n--- ASYNC EMAIL SENDER ---")
    print(f"Para: {email}")
    print(f"Assunto: Confirmação de Matrícula - Bem-vindo!")
    print(f"Corpo: Olá {name},\nSua matrícula foi realizada com sucesso!\nNúmero de Matrícula: {enrollment_number}\nSenha Temporária: {password}\nPor favor, faça o login e altere sua senha.")
    print(f"--------------------------\n")

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(
    body: UserRegister,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 1. Validation
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
    
    # 2. Auto-Generation
    enroll_id = "ACR-" + uuid_mod.uuid4().hex[:8].upper()
    temp_password = secrets.token_urlsafe(8)
    
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
        enrollment_number=enroll_id
    )
    db.add(new_user)
    await db.commit()
    
    # 4. Email
    background_tasks.add_task(send_registration_email, body.email, body.name, enroll_id, temp_password)
    
    return {"message": "Registration successful"}
