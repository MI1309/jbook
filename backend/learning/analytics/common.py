from django.db.models import Count, Q

from learning.models import QuizAttempt


def get_status_label(wrong, right):
    if wrong <= 0 or (wrong == 1 and right >= 1):
        return None
    if wrong >= 4:
        return "Perbaiki"
    if wrong == 3:
        return "Cukup"
    return "Lumayan"


def compute_source_stats(user, relation, label_field, question_type, date_range=None, label_limit=None):
    label_key = f"{relation}__{label_field}"
    level_key = f"{relation}__jlpt_level"
    queryset = QuizAttempt.objects.filter(user=user, **{f"{relation}__isnull": False})
    if date_range:
        queryset = queryset.filter(timestamp__range=date_range)

    rows = queryset.values(label_key, level_key).annotate(
        wrong=Count("id", filter=Q(is_correct=False)),
        right=Count("id", filter=Q(is_correct=True)),
    ).order_by("-wrong")[:30]

    wrong_stats = []
    for row in rows:
        if row["wrong"] <= 0:
            continue
        character = row[label_key]
        if label_limit is not None and character:
            character = character[:label_limit]
        wrong_stats.append({
            "character": character,
            "count": row["wrong"],
            "type": question_type,
            "status": get_status_label(row["wrong"], row["right"]),
            "level": row[level_key],
        })
    return {"wrong_stats": wrong_stats}