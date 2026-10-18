import sys
from pathlib import Path


def update_admin():
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_dir))
    import os

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    import django

    django.setup()

    from users.models import User
    from users.privacy import email_lookup_digest

    email = input("Email akun yang akan diberi akses admin: ").strip()
    if not email:
        print("No email provided; no changes made.")
        return

    lookup_hash = email_lookup_digest(email)
    updated = User.objects.filter(email_lookup_hash=lookup_hash).update(is_staff=True)
    print("Admin access enabled." if updated else "No matching account was found.")


if __name__ == '__main__':
    update_admin()
