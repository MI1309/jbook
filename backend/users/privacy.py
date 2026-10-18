import base64
import hashlib
import hmac

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def _secret_bytes():
    secret = getattr(settings, "EMAIL_ENCRYPTION_KEY", "")
    if not secret:
        raise ImproperlyConfigured("EMAIL_ENCRYPTION_KEY must be configured")
    return secret.encode("utf-8")


def normalize_email(email):
    return (email or "").strip().casefold()


def email_lookup_digest(email):
    normalized = normalize_email(email)
    if not normalized:
        return None
    lookup_key = hmac.new(_secret_bytes(), b"jbook-email-lookup", hashlib.sha256).digest()
    return hmac.new(lookup_key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def encrypt_email(email):
    normalized = normalize_email(email)
    if not normalized:
        return ""
    encryption_key = base64.urlsafe_b64encode(hashlib.sha256(_secret_bytes()).digest())
    return Fernet(encryption_key).encrypt(normalized.encode("utf-8")).decode("ascii")


def decrypt_email(ciphertext):
    if not ciphertext:
        return ""
    encryption_key = base64.urlsafe_b64encode(hashlib.sha256(_secret_bytes()).digest())
    try:
        return Fernet(encryption_key).decrypt(ciphertext.encode("ascii")).decode("utf-8")
    except (InvalidToken, UnicodeDecodeError) as exc:
        raise ImproperlyConfigured(
            "Could not decrypt stored email; verify EMAIL_ENCRYPTION_KEY has not changed"
        ) from exc


def mask_email(email):
    normalized = normalize_email(email)
    if "@" not in normalized:
        return ""
    local, domain = normalized.rsplit("@", 1)
    if not local or not domain:
        return ""
    return f"{local[:1]}***@{domain}"