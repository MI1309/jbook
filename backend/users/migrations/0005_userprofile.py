from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def create_existing_profiles(apps, schema_editor):
    User = apps.get_model("users", "User")
    UserProfile = apps.get_model("users", "UserProfile")
    database = schema_editor.connection.alias
    UserProfile.objects.using(database).bulk_create(
        [
            UserProfile(user_id=user_id, total_tts_points=tts_points)
            for user_id, tts_points in User.objects.using(database).values_list(
                "id", "tts_points"
            )
        ],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_private_email_storage"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("total_tts_points", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.RunPython(create_existing_profiles, migrations.RunPython.noop),
    ]