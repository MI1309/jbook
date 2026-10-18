from django.db import migrations, models


def check_duplicate_emails(apps, schema_editor):
    from users.privacy import email_lookup_digest

    User = apps.get_model("users", "User")
    database = schema_editor.connection.alias
    seen_hashes = set()
    duplicate_count = 0

    for user in User.objects.using(database).only("email").iterator(chunk_size=500):
        lookup_hash = email_lookup_digest(user.email)
        if lookup_hash and lookup_hash in seen_hashes:
            duplicate_count += 1
        elif lookup_hash:
            seen_hashes.add(lookup_hash)

    if duplicate_count:
        raise RuntimeError(
            f"Email privacy migration stopped: {duplicate_count} duplicate email address(es) "
            "must be resolved before migration. No addresses were printed."
        )


def protect_existing_emails(apps, schema_editor):
    from users.privacy import email_lookup_digest, encrypt_email

    User = apps.get_model("users", "User")
    database = schema_editor.connection.alias
    for user in User.objects.using(database).all().iterator(chunk_size=500):
        original_email = (user.email or "").strip().casefold()
        if original_email:
            user.email_ciphertext = encrypt_email(original_email)
            user.email_lookup_hash = email_lookup_digest(original_email)
            user.email = f"private+{user.pk}@privacy.invalid"
        user.save(
            using=database,
            update_fields=["email", "email_ciphertext", "email_lookup_hash"],
        )


def restore_emails(apps, schema_editor):
    from users.privacy import decrypt_email

    User = apps.get_model("users", "User")
    database = schema_editor.connection.alias
    for user in User.objects.using(database).all().iterator(chunk_size=500):
        user.email = decrypt_email(user.email_ciphertext)
        user.email_ciphertext = ""
        user.email_lookup_hash = None
        user.save(
            using=database,
            update_fields=["email", "email_ciphertext", "email_lookup_hash"],
        )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_tts_points"),
    ]

    operations = [
        migrations.RunPython(check_duplicate_emails, migrations.RunPython.noop),
        migrations.AddField(
            model_name="user",
            name="email_ciphertext",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="user",
            name="email_lookup_hash",
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
        migrations.RunPython(protect_existing_emails, restore_emails),
    ]