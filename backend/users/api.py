from ninja import Router
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError
from pydantic import BaseModel, EmailStr
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

router = Router()
User = get_user_model()

class AuthBearer(JWTAuth):
    pass

# Schemas
class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    level_target: int
    
    model_config = {"from_attributes": True}

class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    level_target: int = 5

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthSchema(BaseModel):
    token: str

class PasswordResetRequestSchema(BaseModel):
    email: EmailStr

class PasswordResetConfirmSchema(BaseModel):
    uid: str
    token: str
    new_password: str

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
def login(request, data: LoginSchema):
    # Authenticate using email
    user = User.objects.filter(email=data.email).first()
    if user is None:
        raise HttpError(400, "Invalid credentials")
    
    # Check password
    if not user.check_password(data.password):
        raise HttpError(400, "Invalid credentials")
        
    tokens = get_tokens_for_user(user)
    return {**tokens, "user": user}

@router.post("/google", response=AuthResponse)
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
def me(request):
    return request.auth

@router.post("/password-reset")
def password_reset_request(request, data: PasswordResetRequestSchema):
    user = User.objects.filter(email=data.email).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        # Using the frontend URL from settings or default to localhost:3000
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        
        # Simple email text
        subject = "Password Reset Requested"
        message = f"You requested a password reset. Click the link below to reset your password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email."
        
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@localhost'),
            [user.email],
            fail_silently=False,
        )
    # Always return success to prevent email enumeration
    return {"message": "If an account with that email exists, an email has been sent with instructions to reset your password."}

@router.post("/password-reset-confirm")
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

