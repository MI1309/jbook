from django.db.models import Q

from learning.models import QuizAttempt

from . import grammar, kakitori, kanji, other, vocab


def compute_analytics(user, date_range=None):
    queryset = QuizAttempt.objects.filter(user=user)
    if date_range:
        queryset = queryset.filter(timestamp__range=date_range)

    total_attempts = queryset.count()
    correct_count = queryset.filter(is_correct=True).count()
    accuracy = correct_count / total_attempts * 100 if total_attempts else 0.0

    source_results = [
        kanji.compute(user, date_range),
        vocab.compute(user, date_range),
        grammar.compute(user, date_range),
        other.compute(user, date_range),
    ]
    wrong_stats = [
        item for result in source_results for item in result["wrong_stats"]
    ]
    wrong_stats.sort(key=lambda item: item["count"], reverse=True)

    level_stats = []
    for level in range(1, 6):
        level_queryset = queryset.filter(
            Q(kanji__jlpt_level=level)
            | Q(vocab__jlpt_level=level)
            | Q(grammar__jlpt_level=level)
            | Q(particle__jlpt_level=level)
            | Q(minna_question__jlpt_level=level)
        )
        total = level_queryset.count()
        if total:
            correct = level_queryset.filter(is_correct=True).count()
            level_stats.append({
                "level": level,
                "total": total,
                "correct": correct,
                "accuracy": round(correct / total * 100, 1),
            })

    return {
        "total_attempts": total_attempts,
        "accuracy": round(accuracy, 1),
        "wrong_stats": wrong_stats[:50],
        "level_stats": sorted(level_stats, key=lambda item: item["level"], reverse=True),
        "kakitori_stats": kakitori.compute_kakitori_stats(queryset),
    }