import logging
import random
import string
from dataclasses import dataclass
from urllib.parse import urlencode, urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .privacy import email_lookup_digest

logger = logging.getLogger(__name__)
User = get_user_model()


@dataclass(frozen=True)
class ResetOutcome:
    account_exists: bool
    email_sent: bool


def generate_reset_token(user):
    return default_token_generator.make_token(user)


def build_password_reset_url(request, uid, token):
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    if origin:
        base_url = origin
    elif referer:
        parsed_referer = urlparse(referer)
        base_url = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
    else:
        base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")

    query = urlencode({"uid": uid, "token": token})
    return f"{base_url.rstrip('/')}/reset-password?{query}"


def request_password_reset(email, request):
    email_hash = email_lookup_digest(email)
    user = User.objects.filter(email_lookup_hash=email_hash).first()
    if user is None:
        return ResetOutcome(account_exists=False, email_sent=False)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = generate_reset_token(user)
    reset_url = build_password_reset_url(request, uid, token)
    email_sent = send_reset_email(user, token, reset_url)
    return ResetOutcome(account_exists=True, email_sent=bool(email_sent))


def send_reset_email(user, token, reset_url):
    otp = ''.join(random.choices(string.digits, k=6))
    email_hash = email_lookup_digest(user.get_private_email())
    cache.set(f"otp_reset_{email_hash}", otp, timeout=600)

    if getattr(settings, 'EMAIL_HOST_USER', None) and getattr(settings, 'EMAIL_HOST_PASSWORD', None):
        message = (
            f"Klik link berikut untuk reset password Anda:\n{reset_url}\n\n"
            f"Atau gunakan kode OTP ini: {otp}\n\n"
            "Link dan kode ini berlaku selama 10 menit. "
            "Jika Anda tidak meminta reset password, abaikan email ini."
        )
        try:
            return send_mail(
                "JBook - Reset Password",
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@localhost'),
                [user.get_private_email()],
                fail_silently=False,
            ) == 1
        except Exception:
            logger.exception("Password reset email delivery failed")
            return False

    if settings.DEBUG:
        print(f"\n[PASSWORD RESET - DEV MODE] Reset link generated for user {user.pk}")
        print(f"[PASSWORD RESET - DEV MODE] OTP: {otp}\n")

    return False