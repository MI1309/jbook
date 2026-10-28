from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

class StudySession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

class UserProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    srs_stage = models.IntegerField(default=0)
    next_review = models.DateTimeField(null=True, blank=True)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]


class UserVocabulary(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        LEARNING = "learning", "Learning"
        MASTERED = "mastered", "Mastered"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_vocabularies",
    )
    vocabulary = models.ForeignKey(
        "content.Vocab",
        on_delete=models.CASCADE,
        related_name="saved_by_users",
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW)
    box_level = models.PositiveSmallIntegerField(default=0)
    next_review_date = models.DateField(null=True, blank=True)
    times_reviewed = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "vocabulary"],
                name="unique_user_saved_vocabulary",
            ),
            models.CheckConstraint(
                condition=models.Q(box_level__lte=5),
                name="user_vocabulary_box_level_lte_5",
            ),
        ]
        ordering = ["next_review_date", "created_at"]
        indexes = [models.Index(fields=["user", "next_review_date"]) ]

    def __str__(self):
        return f"{self.user_id}: {self.vocabulary_id} ({self.status})"


class LearningPathStage(models.Model):
    class Availability(models.TextChoices):
        AVAILABLE = "available", "Available"
        BETA = "beta", "Beta"

    code = models.SlugField(max_length=32, unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    display_order = models.PositiveSmallIntegerField(unique=True)
    availability = models.CharField(
        max_length=10,
        choices=Availability.choices,
        default=Availability.AVAILABLE,
    )

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.title


class UserStageProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_stage_progress",
    )
    stage = models.ForeignKey(
        LearningPathStage,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )
    completion_percent = models.PositiveSmallIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "stage"], name="unique_user_stage_progress"),
            models.CheckConstraint(
                condition=models.Q(completion_percent__lte=100),
                name="user_stage_progress_percent_lte_100",
            ),
        ]
        ordering = ["stage__display_order"]

    def __str__(self):
        return f"{self.user_id}: {self.stage.code} ({self.completion_percent}%)"


class StudyLog(models.Model):
    class ActivityType(models.TextChoices):
        VOCABULARY_ADDED = "vocabulary_added", "Vocabulary added"
        VOCABULARY_REVIEW = "vocabulary_review", "Vocabulary review"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_logs",
    )
    activity_type = models.CharField(max_length=32, choices=ActivityType.choices)
    items_studied = models.PositiveIntegerField(default=0)
    date = models.DateField(default=timezone.localdate)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "activity_type", "date"],
                name="unique_user_study_activity_per_day",
            ),
        ]
        ordering = ["-date", "activity_type"]
        indexes = [models.Index(fields=["user", "date"]) ]

    def __str__(self):
        return f"{self.user_id}: {self.activity_type} on {self.date}"

class QuizAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    kanji = models.ForeignKey('content.Kanji', on_delete=models.CASCADE, null=True, blank=True)
    vocab = models.ForeignKey('content.Vocab', on_delete=models.CASCADE, null=True, blank=True)
    grammar = models.ForeignKey('content.Grammar', on_delete=models.CASCADE, null=True, blank=True)
    particle = models.ForeignKey('content.Particle', on_delete=models.CASCADE, null=True, blank=True)
    minna_question = models.ForeignKey('content.MinnaQuestion', on_delete=models.CASCADE, null=True, blank=True)
    
    is_correct = models.BooleanField()
    answer_given = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    mode = models.CharField(max_length=20, default='choice') 

    def __str__(self):
        target = self.kanji or self.vocab or self.grammar or "Unknown"
        return f"{self.user.username} - {target} - {'Correct' if self.is_correct else 'Wrong'}"
