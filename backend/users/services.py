import hashlib
import ipaddress
import json
import logging
import random
import string
from dataclasses import dataclass
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request as UrlRequest, urlopen

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils import timezone
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
    email_sent = send_reset_email(user, token, reset_url, request=request)
    return ResetOutcome(account_exists=True, email_sent=bool(email_sent))


def _parse_ip(value):
    try:
        return ipaddress.ip_address((value or '').strip())
    except ValueError:
        return None


def _is_trusted_proxy(address):
    for configured_proxy in getattr(settings, 'TRUSTED_PROXY_IPS', ('127.0.0.1', '::1')):
        try:
            if address in ipaddress.ip_network(configured_proxy, strict=False):
                return True
        except ValueError:
            logger.warning('Ignoring invalid TRUSTED_PROXY_IPS entry')
    return False


def get_client_ip(request):
    remote_address = _parse_ip(request.META.get('REMOTE_ADDR')) if request else None
    if remote_address is None:
        return None
    if not _is_trusted_proxy(remote_address):
        return remote_address.compressed

    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    forwarded_addresses = [
        address
        for value in forwarded_for.split(',')
        if (address := _parse_ip(value)) is not None
    ]
    address_chain = [*forwarded_addresses, remote_address]
    for address in reversed(address_chain):
        if not _is_trusted_proxy(address):
            return address.compressed
    return forwarded_addresses[0].compressed if forwarded_addresses else remote_address.compressed


def get_ip_location(client_ip):
    address = _parse_ip(client_ip)
    if address is None or not address.is_global:
        return None

    cache_key = f"password-reset-ip-location:{hashlib.sha256(address.packed).hexdigest()}"
    cached_location = cache.get(cache_key)
    if cached_location is not None:
        return cached_location or None

    url = f"https://ipapi.co/{quote(address.compressed, safe='')}/json/"
    request = UrlRequest(url, headers={'User-Agent': 'JBook-PasswordReset/1.0'})
    try:
        with urlopen(request, timeout=1.5) as response:
            data = json.loads(response.read(8192))
        location_parts = [data.get('city'), data.get('region'), data.get('country_name')]
        location = ', '.join(dict.fromkeys(part.strip() for part in location_parts if isinstance(part, str) and part.strip()))
        cache.set(cache_key, location, timeout=24 * 60 * 60)
        return location or None
    except Exception:
        logger.info('IP geolocation lookup unavailable')
        cache.set(cache_key, '', timeout=5 * 60)
        return None


def send_reset_email(user, token, reset_url, request=None):
    otp = ''.join(random.choices(string.digits, k=6))
    email_hash = email_lookup_digest(user.get_private_email())
    cache.set(f"otp_reset_{email_hash}", otp, timeout=600)

    if getattr(settings, 'EMAIL_HOST_USER', None) and getattr(settings, 'EMAIL_HOST_PASSWORD', None):
        client_ip = get_client_ip(request)
        location = get_ip_location(client_ip) if client_ip else None
        requested_at = timezone.localtime().strftime('%Y-%m-%d %H:%M %Z')
        message = (
            f"Klik link berikut untuk reset password Anda:\n{reset_url}\n\n"
            f"Atau gunakan kode OTP ini: {otp}\n\n"
            "Informasi permintaan reset:\n"
            f"Waktu: {requested_at}\n"
            f"Alamat IP: {client_ip or 'Tidak tersedia'}\n"
            f"Lokasi perkiraan: {location or 'Tidak tersedia'}\n"
            "Lokasi diperkirakan dari alamat IP dan dapat keliru, terutama jika Anda menggunakan VPN atau proxy.\n\n"
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