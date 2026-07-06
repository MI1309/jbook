from ninja import Router
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.core.cache import cache
import random
import string
from core.decorators import rate_limit

router = Router()
User = get_user_model()

class AuthBearer(JWTAuth):
    pass

# Schemas
class UserSchema(BaseModel):
    id: int
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    level_target: int = Field(..., ge=1, le=5)
    is_staff: bool = False
    
    model_config = {"from_attributes": True}

class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=150, pattern=r"^[\w.@+-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8)
    level_target: int = Field(default=5, ge=1, le=5)

class LoginSchema(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1)


class GoogleAuthSchema(BaseModel):
    token: str = Field(..., min_length=1)

class PasswordResetRequestSchema(BaseModel):
    email: EmailStr

class PasswordResetConfirmSchema(BaseModel):
    uid: str = Field(..., min_length=1)
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class PasswordResetOtpConfirmSchema(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

class AuthResponse(BaseModel):
    access: str
    refresh: str
    user: UserSchema

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@router.post("/register", response=AuthResponse)
@rate_limit(key='ip', rate='10/h')  # Max 10 registrasi per IP per jam
def register(request, data: RegisterSchema):
    if User.objects.filter(email=data.email).exists():
        raise HttpError(400, "Email already registered")
    if User.objects.filter(username=data.username).exists():
        raise HttpError(400, "Username already taken")
    
    try:
        user = User.objects.create_user(
            username=data.username,
            email=data.email,
            password=data.password,
            level_target=data.level_target
        )
    except IntegrityError:
        raise HttpError(400, "Registration failed")
    
    tokens = get_tokens_for_user(user)
    return {**tokens, "user": user}

@router.post("/login", response=AuthResponse)
@rate_limit(key='ip', rate='30/m')  # Max 30 login per IP per menit
def login(request, data: LoginSchema):
    # Authenticate using email or username
    from django.db.models import Q
    user = User.objects.filter(Q(email=data.identifier) | Q(username=data.identifier)).first()
    if user is None:
        raise HttpError(400, "User not found")
    
    # Check password
    if not user.check_password(data.password):
        raise HttpError(400, "Incorrect password")
        
    tokens = get_tokens_for_user(user)
    return {**tokens, "user": user}

@router.post("/google", response=AuthResponse)
@rate_limit(key='ip', rate='20/h')  # Max 20 google auth per IP per jam
def google_auth(request, data: GoogleAuthSchema):
    try:
        # Verify handle (we skip checking strict client_id for now to allow dev flexibility)
        # In production, pass CLIENT_ID as second argument
        # id_info = id_token.verify_oauth2_token(data.token, requests.Request(), settings.GOOGLE_CLIENT_ID) 
        
        # For now, just verifies signature and expiry with clock skew tolerance
        id_info = id_token.verify_oauth2_token(data.token, requests.Request(), clock_skew_in_seconds=10)

        email = id_info['email']
        name = id_info.get('name', email.split('@')[0])
        
        # Check if user exists
        user = User.objects.filter(email=email).first()
        
        if not user:
            # Create new user
            # Generate a unique username based on email/name
            base_username = name.replace(" ", "").lower()
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                password=None # Unusable password
            )
            
        tokens = get_tokens_for_user(user)
        return {**tokens, "user": user}

    except Exception as e:
        print(f"DEBUG: Google Auth Exception: {e}")
        raise HttpError(400, f"Google auth failed: {str(e)}")

@router.get("/me", response=UserSchema, auth=JWTAuth())
@rate_limit(key='user', rate='120/m')  # Max 120 req per user per menit
def me(request):
    return request.auth

def _generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

@router.post("/password-reset")
@rate_limit(key='ip', rate='5/h')  # Max 5 password reset request per IP per jam
def password_reset_request(request, data: PasswordResetRequestSchema):
    user = User.objects.filter(email=data.email).first()
    if user:
        # Generate token and uid for direct link
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Determine base URL for reset link
        # 1. Try Origin header (sent by browsers for POST)
        # 2. Try Referer header (common fallback)
        # 3. Fallback to settings.FRONTEND_URL
        origin = request.headers.get('origin')
        referer = request.headers.get('referer')
        
        if origin:
            base_url = origin
        elif referer:
            from urllib.parse import urlparse
            parsed_referer = urlparse(referer)
            base_url = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
        else:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            
        reset_link = f"{base_url}/reset-password?uid={uid}&token={token}"
        
        # Also generate OTP for backward compatibility
        otp = _generate_otp(6)
        cache.set(f"otp_reset_{data.email}", otp, timeout=600)  # 10 menit
        
        subject = "JBook - Reset Password"
        message = f"Klik link berikut untuk reset password Anda:\n{reset_link}\n\nAtau gunakan kode OTP ini: {otp}\n\nLink dan kode ini berlaku selama 10 menit. Jika Anda tidak meminta reset password, abaikan email ini."
        
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@localhost'),
            [user.email],
            fail_silently=False,
        )
        return {
            "message": "If an account with that email exists, a reset link has been sent to your email.",
            "reset_link": reset_link
        }
    return {"message": "If an account with that email exists, a reset link has been sent to your email."}

@router.post("/password-reset-otp")
@rate_limit(key='ip', rate='10/m')  # Max 10 otp confirm per IP per menit
def password_reset_otp_confirm(request, data: PasswordResetOtpConfirmSchema):
    stored_otp = cache.get(f"otp_reset_{data.email}")
    if stored_otp is None or stored_otp != data.otp.strip():
        raise HttpError(400, "OTP invalid or expired.")
    user = User.objects.filter(email=data.email).first()
    if not user:
        raise HttpError(400, "Invalid request.")
    user.set_password(data.new_password)
    user.save()
    cache.delete(f"otp_reset_{data.email}")
    return {"message": "Password has been reset successfully."}

@router.post("/password-reset-confirm")
@rate_limit(key='ip', rate='10/m')  # Max 10 reset confirm per IP per menit
def password_reset_confirm(request, data: PasswordResetConfirmSchema):
    try:
        uid = force_str(urlsafe_base64_decode(data.uid))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, data.token):
        user.set_password(data.new_password)
        user.save()
        return {"message": "Password has been reset with the new password."}
    else:
        raise HttpError(400, "Reset link is invalid or has expired.")

