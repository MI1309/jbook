from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

from .privacy import decrypt_email, email_lookup_digest, encrypt_email

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
    email_ciphertext = models.TextField(blank=True, default="")
    email_lookup_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.email and not self.email.endswith("@privacy.invalid"):
            normalized_email = self.email.strip().casefold()
            self.email_ciphertext = encrypt_email(normalized_email)
            self.email_lookup_hash = email_lookup_digest(normalized_email)
            self.email = f"private+{uuid.uuid4().hex}@privacy.invalid"
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = set(update_fields) | {
                    "email", "email_ciphertext", "email_lookup_hash"
                }
        super().save(*args, **kwargs)

    def get_private_email(self):
        return decrypt_email(self.email_ciphertext)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    total_tts_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"


class TTSPointSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tts_point_sessions")
    session_id = models.UUIDField(default=uuid.uuid4)
    points = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "session_id"], name="unique_tts_points_per_session"),
        ]
