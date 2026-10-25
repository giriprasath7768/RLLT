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

_user_sessions_table_ready = False

async def _ensure_user_sessions_table_ready(db: AsyncSession):
    global _user_sessions_table_ready
    if _user_sessions_table_ready:
        return
    from sqlalchemy import text
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                user_name VARCHAR,
                email VARCHAR,
                role VARCHAR NOT NULL,
                location_id UUID,
                location_name VARCHAR,
                login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                logout_time TIMESTAMPTZ,
                session_status VARCHAR NOT NULL DEFAULT 'active',
                ip_address VARCHAR,
                user_agent VARCHAR
            )
        """))
        await db.commit()
        _user_sessions_table_ready = True
    except Exception:
        await db.rollback()

async def _resolve_user_location_and_name(db: AsyncSession, user: User, role_name: str):
    from app.db.models import Location, Admin, Leader, SuperAdmin
    loc_id = user.location_id
    display_name = user.name

    if role_name == "super_admin" and not display_name:
        sa_res = await db.execute(select(SuperAdmin).where(SuperAdmin.user_id == user.id))
        sa = sa_res.scalars().first()
        if sa and sa.name:
            display_name = sa.name
    elif role_name == "admin":
        adm_res = await db.execute(select(Admin).where(Admin.user_id == user.id))
        adm = adm_res.scalars().first()
        if adm:
            if not display_name and adm.name:
                display_name = adm.name
            if not loc_id and adm.location_id:
                loc_id = adm.location_id
    elif role_name == "leader":
        ldr_res = await db.execute(select(Leader).where(Leader.user_id == user.id))
        ldr = ldr_res.scalars().first()
        if ldr:
            if not display_name and ldr.name:
                display_name = ldr.name
            if not loc_id and ldr.admin_id:
                adm_res = await db.execute(select(Admin).where(Admin.id == ldr.admin_id))
                adm = adm_res.scalars().first()
                if adm and adm.location_id:
                    loc_id = adm.location_id

    loc_name = None
    if loc_id:
        loc_res = await db.execute(select(Location).where(Location.id == loc_id))
        loc = loc_res.scalars().first()
        if loc:
            parts = [loc.country, loc.city]
            loc_name = ", ".join([p for p in parts if p])

    if not display_name:
        display_name = user.email.split("@")[0] if user.email else "User"

    return display_name, loc_id, loc_name

@router.post("/login", response_model=dict)
async def login_access_token(
    request: Request,
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

    # Record user login session
    session_uuid = uuid_mod.uuid4()
    try:
        from datetime import timezone
        from app.db.models import UserSession
        await _ensure_user_sessions_table_ready(db)
        display_name, loc_id, loc_name = await _resolve_user_location_and_name(db, user, role_name)
        ip_addr = request.client.host if request.client else None
        ua_str = request.headers.get("user-agent", "")[:255]

        new_session = UserSession(
            id=session_uuid,
            user_id=user.id,
            user_name=display_name,
            email=user.email,
            role=role_name,
            location_id=loc_id,
            location_name=loc_name,
            login_time=datetime.now(timezone.utc),
            logout_time=None,
            session_status="active",
            ip_address=ip_addr,
            user_agent=ua_str
        )
        db.add(new_session)
        await db.commit()
    except Exception:
        await db.rollback()
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,    # Disabled for localhost HTTP traversal
        samesite="lax"   # Lax is good for CSRF protection while still allowing some cross-site nav
    )
    response.set_cookie(
        key="session_id",
        value=str(session_uuid),
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"message": "Successfully logged in", "session_id": str(session_uuid)}

@router.post("/logout", response_model=dict)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Record logout time for the active session and clear cookies
    """
    from datetime import timezone
    from app.db.models import UserSession

    try:
        await _ensure_user_sessions_table_ready(db)
        now_utc = datetime.now(timezone.utc)
        session_id_cookie = request.cookies.get("session_id")
        updated_session = False

        if session_id_cookie:
            try:
                sid = uuid_mod.UUID(session_id_cookie.strip())
                s_res = await db.execute(select(UserSession).where(UserSession.id == sid))
                sess_obj = s_res.scalars().first()
                if sess_obj:
                    sess_obj.logout_time = now_utc
                    sess_obj.session_status = "logged_out"
                    await db.commit()
                    updated_session = True
            except Exception:
                await db.rollback()

        if not updated_session:
            token = request.cookies.get("access_token")
            if token:
                if token.startswith("Bearer "):
                    token = token.split(" ")[1]
                try:
                    from jose import jwt
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                    sub_id = payload.get("sub")
                    if sub_id:
                        uid = uuid_mod.UUID(str(sub_id))
                        s_res = await db.execute(
                            select(UserSession)
                            .where((UserSession.user_id == uid) & (UserSession.logout_time.is_(None)))
                            .order_by(UserSession.login_time.desc())
                        )
                        sess_obj = s_res.scalars().first()
                        if sess_obj:
                            sess_obj.logout_time = now_utc
                            sess_obj.session_status = "logged_out"
                            await db.commit()
                except Exception:
                    await db.rollback()
    except Exception:
        await db.rollback()

    response.delete_cookie("access_token", httponly=True, secure=False, samesite="lax")
    response.delete_cookie("session_id", httponly=True, secure=False, samesite="lax")
    return {"message": "Successfully logged out"}

from pydantic import BaseModel
class TTomLoginRequest(BaseModel):
    mobile_number: str
    pin: str

@router.post("/ttom-login", response_model=dict)
async def ttom_login_endpoint(
    request: Request,
    body: TTomLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    from app.db.models import TTOMUser, UserSession
    from datetime import timezone
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

    session_uuid = uuid_mod.uuid4()
    try:
        await _ensure_user_sessions_table_ready(db)
        full_name = " ".join([p for p in [getattr(ttom_user, "first_name", None), getattr(ttom_user, "last_name", None)] if p]).strip() or "T-Tom-T User"
        loc_parts = [getattr(ttom_user, "country", None), getattr(ttom_user, "city", None)]
        loc_name = ", ".join([p for p in loc_parts if p]) or None
        ip_addr = request.client.host if request.client else None
        ua_str = request.headers.get("user-agent", "")[:255]

        new_session = UserSession(
            id=session_uuid,
            user_id=ttom_user.id,
            user_name=full_name,
            email=ttom_user.mobile_number,
            role=role_name,
            location_id=None,
            location_name=loc_name,
            login_time=datetime.now(timezone.utc),
            logout_time=None,
            session_status="active",
            ip_address=ip_addr,
            user_agent=ua_str
        )
        db.add(new_session)
        await db.commit()
    except Exception:
        await db.rollback()
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    response.set_cookie(
        key="session_id",
        value=str(session_uuid),
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"message": "Successfully logged in as T-Tom-T user", "session_id": str(session_uuid)}

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
@router.get("/users/me", response_model=UserInfo)
async def read_users_me(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user info, leveraging the HttpOnly cookie.
    Also ensures an active session record exists for already-authenticated users.
    """
    try:
        from datetime import timezone
        from app.db.models import UserSession
        await _ensure_user_sessions_table_ready(db)
        sid_cookie = request.cookies.get("session_id")
        has_active = False
        if sid_cookie:
            try:
                sid = uuid_mod.UUID(sid_cookie.strip())
                s_res = await db.execute(select(UserSession).where(UserSession.id == sid))
                if s_res.scalars().first():
                    has_active = True
            except Exception:
                pass
        if not has_active:
            s_res = await db.execute(
                select(UserSession)
                .where((UserSession.user_id == current_user.id) & (UserSession.logout_time.is_(None)))
                .order_by(UserSession.login_time.desc())
            )
            existing_sess = s_res.scalars().first()
            if existing_sess:
                response.set_cookie(key="session_id", value=str(existing_sess.id), httponly=True, secure=False, samesite="lax")
            else:
                role_name = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
                if role_name != "ttom_user":
                    display_name, loc_id, loc_name = await _resolve_user_location_and_name(db, current_user, role_name)
                    email_val = current_user.email
                else:
                    display_name = "T-Tom-T User"
                    loc_id = None
                    loc_name = None
                    email_val = ""
                new_sid = uuid_mod.uuid4()
                new_sess = UserSession(
                    id=new_sid,
                    user_id=current_user.id,
                    user_name=display_name,
                    email=email_val,
                    role=role_name,
                    location_id=loc_id,
                    location_name=loc_name,
                    login_time=datetime.now(timezone.utc),
                    logout_time=None,
                    session_status="active",
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent", "")[:255]
                )
                db.add(new_sess)
                await db.commit()
                response.set_cookie(key="session_id", value=str(new_sid), httponly=True, secure=False, samesite="lax")
    except Exception:
        await db.rollback()

    return current_user

@router.get("/user-sessions")
async def list_user_sessions(
    role: str = None,
    status_filter: str = None,
    search: str = None,
    from_date: str = None,
    to_date: str = None,
    tz_offset: int = -330,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List user login/logout sessions for all users.
    """
    from datetime import timezone, date as dt_date
    from app.db.models import UserSession

    await _ensure_user_sessions_table_ready(db)

    q = select(UserSession).order_by(UserSession.login_time.desc())
    if role and role.strip() and role.strip().lower() != "all":
        q = q.where(UserSession.role == role.strip())
    if status_filter and status_filter.strip() and status_filter.strip().lower() != "all":
        q = q.where(UserSession.session_status == status_filter.strip())

    rows = (await db.execute(q)).scalars().all()

    parsed_from_date = None
    parsed_to_date = None
    if from_date and from_date.strip():
        try:
            parsed_from_date = dt_date.fromisoformat(from_date.strip())
        except Exception:
            pass
    if to_date and to_date.strip():
        try:
            parsed_to_date = dt_date.fromisoformat(to_date.strip())
        except Exception:
            pass

    offset_delta = timedelta(minutes=int(tz_offset or 0))
    now_utc = datetime.now(timezone.utc)
    search_lower = search.strip().lower() if search and search.strip() else None

    result_list = []
    for s in rows:
        if search_lower:
            haystack = " ".join([
                str(s.user_name or ""),
                str(s.email or ""),
                str(s.role or ""),
                str(s.location_name or "")
            ]).lower()
            if search_lower not in haystack:
                continue

        if s.login_time:
            lt_utc = s.login_time.astimezone(timezone.utc).replace(tzinfo=None) if s.login_time.tzinfo else s.login_time
            local_login_date = (lt_utc - offset_delta).date()
            if parsed_from_date and parsed_to_date:
                low_d = min(parsed_from_date, parsed_to_date)
                high_d = max(parsed_from_date, parsed_to_date)
                if not (low_d <= local_login_date <= high_d):
                    continue
            elif parsed_from_date:
                if local_login_date != parsed_from_date:
                    continue
            elif parsed_to_date:
                if local_login_date != parsed_to_date:
                    continue

        duration_seconds = None
        if s.login_time:
            end_dt = s.logout_time if s.logout_time else now_utc
            start_dt = s.login_time if s.login_time.tzinfo else s.login_time.replace(tzinfo=timezone.utc)
            end_dt_tz = end_dt if end_dt.tzinfo else end_dt.replace(tzinfo=timezone.utc)
            duration_seconds = max(0, int((end_dt_tz - start_dt).total_seconds()))

        result_list.append({
            "id": str(s.id),
            "user_id": str(s.user_id),
            "user_name": s.user_name or (s.email.split("@")[0] if s.email else "User"),
            "email": s.email or "-",
            "role": s.role,
            "location_id": str(s.location_id) if s.location_id else None,
            "location_name": s.location_name or "All / Global",
            "login_time": s.login_time.isoformat() if s.login_time else None,
            "logout_time": s.logout_time.isoformat() if s.logout_time else None,
            "session_status": "logged_out" if s.logout_time else (s.session_status or "active"),
            "duration_seconds": duration_seconds,
            "ip_address": s.ip_address or "-"
        })

    return result_list

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
