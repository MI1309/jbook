import hmac

from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from users.privacy import decrypt_email, email_lookup_digest, normalize_email


class Command(BaseCommand):
    help = "Audit stored user emails without printing personal data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--database",
            default="default",
            help="Database alias to audit (default: default)",
        )
        parser.add_argument(
            "--username",
            help="Inspect one account by username (requires --reveal)",
        )
        parser.add_argument(
            "--reveal",
            action="store_true",
            help="Print the selected account's ciphertext and decrypted email",
        )

    def handle(self, *args, **options):
        database = options["database"]
        username = options["username"]
        reveal = options["reveal"]
        if reveal and not username:
            raise CommandError("--reveal requires --username to select exactly one account")
        if username and not reveal:
            raise CommandError("--username requires --reveal to display email details")

        user_model = get_user_model()
        connection = connections[database]
        with connection.cursor() as cursor:
            columns = {
                column.name
                for column in connection.introspection.get_table_description(
                    cursor, user_model._meta.db_table
                )
            }
        required_columns = {"email", "email_ciphertext", "email_lookup_hash"}
        if not required_columns.issubset(columns):
            raise CommandError(
                "Email privacy schema is not installed on this database. "
                "Apply users migration 0004_private_email_storage, then rerun the audit."
            )

        if username:
            record = user_model.objects.using(database).filter(username=username).values(
                "email", "email_ciphertext", "email_lookup_hash"
            ).first()
            if record is None:
                raise CommandError("No account found for that username.")

            try:
                decrypted_email = decrypt_email(record["email_ciphertext"])
            except ImproperlyConfigured as exc:
                raise CommandError(
                    "Could not decrypt this account's email; verify EMAIL_ENCRYPTION_KEY."
                ) from exc

            expected_hash = email_lookup_digest(decrypted_email)
            verified = (
                bool(decrypted_email)
                and record["email"].endswith("@privacy.invalid")
                and hmac.compare_digest(expected_hash or "", record["email_lookup_hash"] or "")
                and normalize_email(decrypted_email) == decrypted_email
            )

            self.stdout.write(f"Username: {username}")
            self.stdout.write(f"Database email field: {record['email']}")
            self.stdout.write(f"Encrypted email_ciphertext: {record['email_ciphertext']}")
            self.stdout.write(f"Decrypted email: {decrypted_email}")
            self.stdout.write(f"Integrity check: {'PASSED' if verified else 'FAILED'}")
            if not verified:
                raise CommandError("Email data failed verification.")
            return

        rows = user_model.objects.using(database).values_list(
            "email", "email_ciphertext", "email_lookup_hash"
        ).iterator(chunk_size=500)

        total = 0
        protected = 0
        empty = 0
        invalid = 0

        for stored_email, ciphertext, lookup_hash in rows:
            total += 1
            stored_email = stored_email or ""
            ciphertext = ciphertext or ""

            if not stored_email and not ciphertext and not lookup_hash:
                empty += 1
                continue

            if not stored_email.endswith("@privacy.invalid") or not ciphertext or not lookup_hash:
                invalid += 1
                continue

            try:
                decrypted_email = decrypt_email(ciphertext)
            except ImproperlyConfigured:
                invalid += 1
                continue

            expected_hash = email_lookup_digest(decrypted_email)
            if (
                not decrypted_email
                or not hmac.compare_digest(expected_hash or "", lookup_hash)
                or normalize_email(decrypted_email) != decrypted_email
            ):
                invalid += 1
                continue

            protected += 1

        self.stdout.write(f"Users checked: {total}")
        self.stdout.write(f"Protected and verified: {protected}")
        self.stdout.write(f"Empty email records: {empty}")
        self.stdout.write(f"Plaintext or invalid records: {invalid}")

        if invalid:
            raise CommandError(
                "Email storage audit failed. No email addresses were displayed."
            )

        self.stdout.write(self.style.SUCCESS("Email storage audit passed."))
