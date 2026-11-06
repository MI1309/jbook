from datetime import timedelta
from typing import List, Optional

from django.db import transaction
from django.db.models import (
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

from content.models import FeatureSetting, Vocab
from .models import LearningPathStage, QuizAttempt, StudyLog, StudySession, UserStageProgress, UserVocabulary
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


def _calculate_streaks(active_dates, today):
    active_dates = set(active_dates)
    current_streak = 0
    current_day = today if today in active_dates else today - timedelta(days=1)
    while current_day in active_dates:
        current_streak += 1
        current_day -= timedelta(days=1)

    longest_streak = 0
    streak = 0
    previous_day = None
    for active_day in sorted(active_dates):
        streak = streak + 1 if previous_day and active_day == previous_day + timedelta(days=1) else 1
        longest_streak = max(longest_streak, streak)
        previous_day = active_day
    return current_streak, longest_streak


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
    progress_for_user = UserStageProgress.objects.filter(
        user=request.auth, stage_id=OuterRef("pk")
    ).values("completion_percent")[:1]
    roadmap = [
        {
            "stage_code": stage.code,
            "title": stage.title,
            "is_available": stage.availability == LearningPathStage.Availability.AVAILABLE,
            "completion_percentage": stage.completion_percentage,
        }
        for stage in LearningPathStage.objects.annotate(
            completion_percentage=Coalesce(
                Subquery(progress_for_user, output_field=IntegerField()), Value(0)
            )
        )
    ]
    next_stage = next(
        (
            {"stage_code": stage["stage_code"], "title": stage["title"]}
            for stage in roadmap
            if stage["is_available"] and stage["completion_percentage"] < 100
        ),
        None,
    )
    today = timezone.localdate()
    start_date = today - timedelta(days=29)
    activity_rows = StudyLog.objects.filter(
        user=request.auth, items_studied__gt=0, date__lte=today
    ).values("date", "activity_type").annotate(
        items_studied=Sum("items_studied")
    ).order_by("date", "activity_type")
    activity_by_date = {}
    activity_totals = {}
    active_dates = set()
    for row in activity_rows:
        activity_date = row["date"]
        items_studied = row["items_studied"]
        active_dates.add(activity_date)
        activity_by_date[activity_date] = activity_by_date.get(activity_date, 0) + items_studied
        if activity_date >= start_date:
            activity_type = row["activity_type"]
            activity_totals[activity_type] = activity_totals.get(activity_type, 0) + items_studied
    daily_activity = [
        {
            "date": start_date + timedelta(days=offset),
            "items_studied": activity_by_date.get(start_date + timedelta(days=offset), 0),
        }
        for offset in range(30)
    ]
    activity_breakdown = [
        {"activity_type": activity_type, "items_studied": items_studied}
        for activity_type, items_studied in sorted(activity_totals.items())
    ]
    vocabulary_stats = user_vocab.aggregate(
        total_saved=Count("id"),
        mastered=Count("id", filter=Q(status=UserVocabulary.Status.MASTERED)),
        learning=Count("id", filter=Q(status=UserVocabulary.Status.LEARNING)),
        new=Count("id", filter=Q(status=UserVocabulary.Status.NEW)),
        due_today=Count("id", filter=Q(next_review_date__lte=today)),
        reviewed=Count("id", filter=Q(times_reviewed__gt=0)),
        progressed=Count("id", filter=Q(times_reviewed__gt=0, box_level__gt=0)),
    )
    quiz_stats = QuizAttempt.objects.filter(user=request.auth).aggregate(
        total=Count("id"),
        correct=Count("id", filter=Q(is_correct=True)),
    )
    study_duration = StudySession.objects.filter(
        user=request.auth,
        end_time__isnull=False,
        end_time__gte=F("start_time"),
    ).aggregate(
        total=Sum(
            ExpressionWrapper(F("end_time") - F("start_time"), output_field=DurationField())
        )
    )["total"]
    current_streak, longest_streak = _calculate_streaks(active_dates, today)
    return {
        "username": request.auth.username,
        "total_tts_points": profile.total_tts_points if profile else request.auth.tts_points,
        "tts_games_played": request.auth.tts_point_sessions.count(),
        "total_saved": vocabulary_stats["total_saved"],
        "mastered": vocabulary_stats["mastered"],
        "learning": vocabulary_stats["learning"],
        "new": vocabulary_stats["new"],
        "daily_activity": daily_activity,
        "activity_breakdown": activity_breakdown,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "due_today": vocabulary_stats["due_today"],
        "retention_rate": round(
            vocabulary_stats["progressed"] * 100 / vocabulary_stats["reviewed"], 1
        ) if vocabulary_stats["reviewed"] else 0,
        "accuracy_rate": round(quiz_stats["correct"] * 100 / quiz_stats["total"], 1)
        if quiz_stats["total"] else 0,
        "total_time_spent": int(study_duration.total_seconds()) if study_duration else 0,
        "roadmap": roadmap,
        "next_stage": next_stage,
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
