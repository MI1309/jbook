import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_profile_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="tts_points",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="TTSPointSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_id", models.UUIDField(default=uuid.uuid4)),
                ("points", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tts_point_sessions", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="ttspointsession",
            constraint=models.UniqueConstraint(fields=("user", "session_id"), name="unique_tts_points_per_session"),
        ),
    ]