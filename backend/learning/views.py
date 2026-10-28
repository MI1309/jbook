from datetime import timedelta
from typing import List, Optional

from django.db import transaction
from django.db.models import F, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

from content.models import FeatureSetting, Vocab
from .models import LearningPathStage, StudyLog, UserStageProgress, UserVocabulary
from .serializers import (
    UserDashboardStatsSchema,
    LearningPathStageSchema,
    UserVocabularyCreateSchema,
    UserVocabularySchema,
    UserVocabularyUpdateSchema,
    VocabularyReviewSchema,
    VocabularySchema,
    UserStageProgressUpdateSchema,
)

router = Router()


def _public_vocabulary_queryset():
    setting = FeatureSetting.objects.filter(key="vocab_visibility").only("value").first()
    value = setting.value if setting and isinstance(setting.value, dict) else {}
    disabled_levels = [
        level for level in value.get("disabled_levels", [])
        if isinstance(level, int) and level in range(1, 6)
    ]
    return Vocab.objects.exclude(jlpt_level__in=disabled_levels)


def _record_activity(user, activity_type, count=1):
    today = timezone.localdate()
    log, created = StudyLog.objects.get_or_create(
        user=user,
        activity_type=activity_type,
        date=today,
        defaults={"items_studied": count},
    )
    if not created:
        StudyLog.objects.filter(pk=log.pk).update(items_studied=F("items_studied") + count)


@router.get("/vocabulary", response=List[VocabularySchema])
def list_vocabulary(request, jlpt_level: Optional[int] = None, search: Optional[str] = None):
    queryset = _public_vocabulary_queryset().order_by("jlpt_level", "word")
    if jlpt_level is not None:
        if jlpt_level not in range(1, 6):
            raise HttpError(422, "jlpt_level harus bernilai 1 sampai 5")
        queryset = queryset.filter(jlpt_level=jlpt_level)
    if search:
        term = search.strip()[:100]
        if term:
            queryset = queryset.filter(
                Q(word__icontains=term)
                | Q(reading__icontains=term)
                | Q(meaning__icontains=term)
            )
    return queryset


@router.get("/my-vocabulary", response=List[UserVocabularySchema], auth=JWTAuth())
def list_user_vocabulary(request):
    return UserVocabulary.objects.filter(user=request.auth).select_related("vocabulary")


@router.post("/my-vocabulary", response=UserVocabularySchema, auth=JWTAuth())
def add_user_vocabulary(request, payload: UserVocabularyCreateSchema):
    vocabulary = get_object_or_404(_public_vocabulary_queryset(), id=payload.vocabulary_id)
    with transaction.atomic():
        entry, created = UserVocabulary.objects.get_or_create(
            user=request.auth,
            vocabulary=vocabulary,
        )
        if not created:
            raise HttpError(409, "Kosakata sudah ada di koleksi")
        _record_activity(request.auth, StudyLog.ActivityType.VOCABULARY_ADDED)
    return entry


@router.patch("/my-vocabulary/{entry_id}", response=UserVocabularySchema, auth=JWTAuth())
def update_user_vocabulary(request, entry_id: int, payload: UserVocabularyUpdateSchema):
    entry = get_object_or_404(
        UserVocabulary.objects.select_related("vocabulary"),
        id=entry_id,
        user=request.auth,
    )
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(entry, field, value)

    if updates.get("status") == UserVocabulary.Status.MASTERED:
        entry.box_level = 5
    elif updates.get("box_level") == 5:
        entry.status = UserVocabulary.Status.MASTERED

    entry.save()
    return entry


@router.delete("/my-vocabulary/{entry_id}", auth=JWTAuth())
def delete_user_vocabulary(request, entry_id: int):
    entry = get_object_or_404(UserVocabulary, id=entry_id, user=request.auth)
    entry.delete()
    return {"deleted": True}


@router.post(
    "/my-vocabulary/{entry_id}/review",
    response=UserVocabularySchema,
    auth=JWTAuth(),
)
def review_user_vocabulary(request, entry_id: int, payload: VocabularyReviewSchema):
    intervals_days = {1: 1, 2: 3, 3: 7, 4: 14, 5: 30}
    with transaction.atomic():
        entry = get_object_or_404(
            UserVocabulary.objects.select_for_update().select_related("vocabulary"),
            id=entry_id,
            user=request.auth,
        )
        entry.times_reviewed += 1
        if payload.correct:
            entry.box_level = min(entry.box_level + 1, 5)
            entry.status = (
                UserVocabulary.Status.MASTERED
                if entry.box_level == 5
                else UserVocabulary.Status.LEARNING
            )
            entry.next_review_date = timezone.localdate() + timedelta(
                days=intervals_days[entry.box_level]
            )
        else:
            entry.box_level = 0
            entry.status = UserVocabulary.Status.LEARNING
            entry.next_review_date = timezone.localdate() + timedelta(days=1)
        entry.save()
        _record_activity(request.auth, StudyLog.ActivityType.VOCABULARY_REVIEW)
    return entry


@router.get("/dashboard/stats", response=UserDashboardStatsSchema, auth=JWTAuth())
def user_dashboard_stats(request):
    user_vocab = UserVocabulary.objects.filter(user=request.auth)
    profile = getattr(request.auth, "profile", None)
    roadmap_progress = {
        progress.stage_id: progress.completion_percent
        for progress in UserStageProgress.objects.filter(user=request.auth)
    }
    roadmap = [
        {
            "stage_code": stage.code,
            "title": stage.title,
            "is_available": stage.availability == LearningPathStage.Availability.AVAILABLE,
            "completion_percentage": roadmap_progress.get(stage.id, 0),
        }
        for stage in LearningPathStage.objects.all()
    ]
    today = timezone.localdate()
    start_date = today - timedelta(days=29)
    logs = StudyLog.objects.filter(user=request.auth, date__gte=start_date, date__lte=today)
    activity_by_date = {
        row["date"]: row["items_studied"]
        for row in logs.values("date").annotate(items_studied=Sum("items_studied"))
    }
    daily_activity = [
        {
            "date": start_date + timedelta(days=offset),
            "items_studied": activity_by_date.get(start_date + timedelta(days=offset), 0),
        }
        for offset in range(30)
    ]
    activity_breakdown = logs.values("activity_type").annotate(
        items_studied=Sum("items_studied")
    ).order_by("activity_type")

    return {
        "username": request.auth.username,
        "total_tts_points": profile.total_tts_points if profile else request.auth.tts_points,
        "tts_games_played": request.auth.tts_point_sessions.count(),
        "total_saved": user_vocab.count(),
        "mastered": user_vocab.filter(status=UserVocabulary.Status.MASTERED).count(),
        "learning": user_vocab.filter(status=UserVocabulary.Status.LEARNING).count(),
        "new": user_vocab.filter(status=UserVocabulary.Status.NEW).count(),
        "daily_activity": daily_activity,
        "activity_breakdown": list(activity_breakdown),
        "roadmap": roadmap,
    }


@router.get("/roadmap", response=List[LearningPathStageSchema], auth=JWTAuth())
def learning_roadmap(request):
    progress_by_stage = {
        progress.stage_id: progress
        for progress in UserStageProgress.objects.filter(user=request.auth)
    }
    return [
        {
            "id": stage.id,
            "code": stage.code,
            "title": stage.title,
            "description": stage.description,
            "display_order": stage.display_order,
            "availability": stage.availability,
            "completion_percent": getattr(progress_by_stage.get(stage.id), "completion_percent", 0),
            "completed_at": getattr(progress_by_stage.get(stage.id), "completed_at", None),
        }
        for stage in LearningPathStage.objects.all()
    ]


@router.put(
    "/roadmap/{stage_id}/progress",
    response=LearningPathStageSchema,
    auth=JWTAuth(),
)
def update_learning_stage_progress(request, stage_id: int, payload: UserStageProgressUpdateSchema):
    stage = get_object_or_404(LearningPathStage, id=stage_id)
    progress, _ = UserStageProgress.objects.get_or_create(user=request.auth, stage=stage)
    progress.completion_percent = payload.completion_percent
    progress.completed_at = timezone.now() if payload.completion_percent == 100 else None
    progress.save()
    return {
        "id": stage.id,
        "code": stage.code,
        "title": stage.title,
        "description": stage.description,
        "display_order": stage.display_order,
        "availability": stage.availability,
        "completion_percent": progress.completion_percent,
        "completed_at": progress.completed_at,
    }
