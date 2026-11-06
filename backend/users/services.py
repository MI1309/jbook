import logging
import random
import string

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail

from .privacy import email_lookup_digest

logger = logging.getLogger(__name__)


def generate_reset_token(user):
    return default_token_generator.make_token(user)


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