"""Read-only aggregate audit for learning, TTS, and content data.

Run from backend/: python scripts/audit_data.py
The script performs SELECT queries only and does not print user-identifying data.
"""

import os
import sys
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django

django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count, Q
from django.utils import timezone

from content.models import Vocab
from learning.models import QuizAttempt, StudyLog, StudySession, UserProgress, UserVocabulary
from users.models import TTSPointSession, UserProfile

if settings.DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    connection.ensure_connection()
    connection.connection.execute("PRAGMA query_only = ON")


User = get_user_model()
TARGET_FIELDS = ("kanji_id", "vocab_id", "grammar_id", "particle_id", "minna_question_id")
TARGET_TYPES = ("kanji", "vocab", "grammar", "particle", "minna")
SESSION_GAP = timedelta(minutes=30)
EPOCH_DATE = date(1970, 1, 1)


def week_start(value):
    return value - timedelta(days=value.weekday())


def index_fields(model):
    table = model._meta.db_table
    constraints = connection.introspection.get_constraints(connection.cursor(), table)
    return sorted(
        ",".join(details.get("columns") or [])
        for details in constraints.values()
        if (details.get("index") or details.get("unique")) and details.get("columns")
    )


def main():
    today = timezone.localdate()
    now = timezone.now()
    start_7d = now - timedelta(days=7)
    start_30d = now - timedelta(days=30)

    users = User.objects.all()
    user_joined = dict(users.values_list("id", "date_joined"))

    attempts = list(
        QuizAttempt.objects.values_list(
            "user_id", "timestamp", "is_correct", *TARGET_FIELDS
        )
    )
    study_sessions = list(StudySession.objects.values_list("user_id", "start_time", "end_time"))
    study_logs = list(StudyLog.objects.values_list("user_id", "date", "items_studied"))
    user_progress = list(UserProgress.objects.values_list("user_id", "srs_stage", "next_review", "last_reviewed"))
    saved_vocabulary = list(UserVocabulary.objects.values_list("user_id", "updated_at", "status", "box_level", "next_review_date"))
    tts_sessions = list(
        TTSPointSession.objects.values_list("user_id", "created_at", "points")
    )

    events = defaultdict(list)
    for user_id, timestamp, *_ in attempts:
        events[user_id].append(timestamp)
    for user_id, study_date, _ in study_logs:
        events[user_id].append(timezone.make_aware(datetime.combine(study_date, time.min)))
    for user_id, _, _, last_reviewed in user_progress:
        if last_reviewed:
            events[user_id].append(last_reviewed)
    for user_id, updated_at, _, _, _ in saved_vocabulary:
        events[user_id].append(updated_at)
    for user_id, timestamp, _ in tts_sessions:
        events[user_id].append(timestamp)

    active_7d = {
        user_id for user_id, timestamps in events.items()
        if any(timestamp >= start_7d and timestamp <= now for timestamp in timestamps)
    }
    active_30d = {
        user_id for user_id, timestamps in events.items()
        if any(timestamp >= start_30d and timestamp <= now for timestamp in timestamps)
    }

    recent_attempts = [
        row for row in attempts if start_30d <= row[1] <= now
    ]
    attempts_by_user_week = defaultdict(list)
    for row in recent_attempts:
        user_id, timestamp = row[0], row[1]
        attempts_by_user_week[(user_id, week_start(timezone.localtime(timestamp).date()))].append(timestamp)

    inferred_sessions = []
    for (_, _), timestamps in attempts_by_user_week.items():
        timestamps.sort()
        session = [timestamps[0]] if timestamps else []
        for timestamp in timestamps[1:]:
            if timestamp - session[-1] > SESSION_GAP:
                inferred_sessions.append(session)
                session = [timestamp]
            else:
                session.append(timestamp)
        if session:
            inferred_sessions.append(session)

    active_user_weeks = len(attempts_by_user_week)
    avg_sessions_per_user_week = (
        len(inferred_sessions) / active_user_weeks if active_user_weeks else None
    )
    avg_questions_per_session = (
        sum(len(session) for session in inferred_sessions) / len(inferred_sessions)
        if inferred_sessions else None
    )
    avg_session_minutes = (
        sum((session[-1] - session[0]).total_seconds() / 60 for session in inferred_sessions)
        / len(inferred_sessions)
        if inferred_sessions else None
    )

    practice_by_type = {name: {"attempts": 0, "correct": 0, "wrong": 0} for name in TARGET_TYPES}
    targetless_attempts = 0
    multi_target_attempts = 0
    for row in attempts:
        is_correct = row[2]
        linked_types = [name for name, target_id in zip(TARGET_TYPES, row[3:]) if target_id]
        if not linked_types:
            targetless_attempts += 1
        elif len(linked_types) > 1:
            multi_target_attempts += 1
        else:
            stats = practice_by_type[linked_types[0]]
            stats["attempts"] += 1
            stats["correct"] += int(is_correct)
            stats["wrong"] += int(not is_correct)

    for stats in practice_by_type.values():
        stats["accuracy_pct"] = round(stats["correct"] / stats["attempts"] * 100, 2) if stats["attempts"] else None

    profile_ids = set(UserProfile.objects.values_list("user_id", flat=True))
    tts_by_user = defaultdict(int)
    for user_id, _, points in tts_sessions:
        tts_by_user[user_id] += points
    profiles = dict(UserProfile.objects.values_list("user_id", "total_tts_points"))
    users_tts_points = dict(users.values_list("id", "tts_points"))
    profile_missing = sum(user_id not in profile_ids for user_id, _, _ in tts_sessions)
    profile_mismatches = [
        user_id for user_id, total in profiles.items()
        if total != tts_by_user.get(user_id, 0)
    ]
    user_field_mismatches = [
        user_id for user_id, total in users_tts_points.items()
        if total != profiles.get(user_id, 0)
    ]

    future_study_logs = 0
    pre_epoch_study_logs = 0
    before_join_study_logs = 0
    zero_item_study_logs = 0
    for user_id, study_date, items_studied in study_logs:
        future_study_logs += int(study_date > today)
        pre_epoch_study_logs += int(study_date < EPOCH_DATE)
        joined = user_joined.get(user_id)
        before_join_study_logs += int(joined is not None and study_date < timezone.localtime(joined).date())
        zero_item_study_logs += int(items_studied == 0)

    missing_tts_users = TTSPointSession.objects.exclude(user_id__in=users.values("id")).count()
    missing_quiz_users = QuizAttempt.objects.exclude(user_id__in=users.values("id")).count()

    total_points = sum(points for _, _, points in tts_sessions)
    tts_points_over_10k = sum(points > 10000 for _, _, points in tts_sessions)
    tts_points_over_api_limit = sum(points > 5000 for _, _, points in tts_sessions)
    quiz_future_timestamps = sum(timestamp > now for _, timestamp, *_ in attempts)
    missing_answers = QuizAttempt.objects.filter(
        Q(answer_given__isnull=True) | Q(answer_given="")
    ).count()
    mode_counts = dict(QuizAttempt.objects.values_list("mode").annotate(count=Count("id")))
    vocab_total = UserVocabulary.objects.count()
    vocab_without_review_date = UserVocabulary.objects.filter(next_review_date__isnull=True).count()
    progress_without_next_review = sum(next_review is None for _, _, next_review, _ in user_progress)
    future_last_reviewed = sum(last_reviewed is not None and last_reviewed > now for _, _, _, last_reviewed in user_progress)
    srs_stage_counts = defaultdict(int)
    for _, srs_stage, _, _ in user_progress:
        srs_stage_counts[srs_stage] += 1

    print(f"Audit date: {today.isoformat()} (read-only; database alias: default)")
    print("\n[Row counts]")
    print(f"users={users.count()} profiles={UserProfile.objects.count()} vocab={Vocab.objects.count()}")
    print(f"quiz_attempts={len(attempts)} study_sessions={len(study_sessions)} study_logs={len(study_logs)} tts_point_sessions={len(tts_sessions)}")
    print(f"study_sessions_completed={sum(end_time is not None for _, _, end_time in study_sessions)} study_sessions_open={sum(end_time is None for _, _, end_time in study_sessions)}")
    print(f"user_vocabulary={vocab_total} user_progress={len(user_progress)}")

    print("\n[Activity and practice sessions]")
    print(f"active_users_7d={len(active_7d)} active_users_30d={len(active_30d)} (activity: quiz, StudyLog, TTS claim, SRS review, or saved vocabulary update)")
    print(f"practice_attempts_30d={len(recent_attempts)} active_practice_user_weeks_30d={active_user_weeks}")
    print(f"estimated_sessions_per_active_user_week={avg_sessions_per_user_week}")
    print(f"estimated_questions_per_session={avg_questions_per_session} estimated_session_minutes={avg_session_minutes}")
    print("Session estimates use a 30-minute idle gap; no native practice session ID exists.")

    print("\n[TTS]")
    print(f"total_points={total_points} average_points_per_claim={round(total_points / len(tts_sessions), 2) if tts_sessions else None}")
    print(f"claims_over_10000={tts_points_over_10k} claims_over_api_limit_5000={tts_points_over_api_limit}")
    print(f"sessions_missing_profile={profile_missing} sessions_missing_user={missing_tts_users}")
    print(f"profile_vs_session_sum_mismatch_users={len(profile_mismatches)} user_vs_profile_mismatch_users={len(user_field_mismatches)}")
    print("completion_rate=not_available (TTSPointSession has no completion flag; claims are not a completion denominator)")

    print("\n[Practice accuracy by item type]")
    for name, stats in practice_by_type.items():
        print(f"{name}: attempts={stats['attempts']} wrong={stats['wrong']} accuracy_pct={stats['accuracy_pct']}")
    print(f"targetless_attempts={targetless_attempts} multi_target_attempts={multi_target_attempts} future_attempt_timestamps={quiz_future_timestamps}")
    print(f"orphan_user_attempts={missing_quiz_users}")
    print(f"missing_answer_given={missing_answers}/{len(attempts)} practice_modes={mode_counts}")
    print(f"saved_vocab_without_review_date={vocab_without_review_date}/{vocab_total} srs_stage_counts={dict(srs_stage_counts)}")
    print(f"user_progress_without_next_review={progress_without_next_review}/{len(user_progress)} future_last_reviewed={future_last_reviewed}")

    print("\n[StudyLog anomalies]")
    print(f"future_dates={future_study_logs} pre_1970_dates={pre_epoch_study_logs} before_user_joined={before_join_study_logs} zero_items={zero_item_study_logs}")

    print("\n[Indexes present]")
    print(f"QuizAttempt={index_fields(QuizAttempt)}")
    print(f"StudyLog={index_fields(StudyLog)}")
    print(f"TTSPointSession={index_fields(TTSPointSession)}")


if __name__ == "__main__":
    main()