from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    class JLPTLevel(models.IntegerChoices):
        N5 = 5, 'N5'
        N4 = 4, 'N4'
        N3 = 3, 'N3'
        N2 = 2, 'N2'
        N1 = 1, 'N1'

    level_target = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5)
    profile_image = models.URLField(blank=True, max_length=500)
    tts_points = models.PositiveIntegerField(default=0)


class TTSPointSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tts_point_sessions")
    session_id = models.UUIDField(default=uuid.uuid4)
    points = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "session_id"], name="unique_tts_points_per_session"),
        ]
