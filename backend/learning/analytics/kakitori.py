from django.db.models import Q


def compute_kakitori_stats(queryset):
    kakitori_queryset = queryset.filter(mode="kakitori")
    total = kakitori_queryset.count()
    correct = kakitori_queryset.filter(is_correct=True).count()
    sessions = max(1, (total + 9) // 10) if total else 0

    level_breakdown = []
    for level in range(1, 6):
        level_queryset = kakitori_queryset.filter(
            Q(kanji__jlpt_level=level)
            | Q(vocab__jlpt_level=level)
            | Q(grammar__jlpt_level=level)
            | Q(particle__jlpt_level=level)
        )
        level_total = level_queryset.count()
        if level_total:
            level_correct = level_queryset.filter(is_correct=True).count()
            level_breakdown.append({
                "level": level,
                "total": level_total,
                "correct": level_correct,
                "accuracy": round(level_correct / level_total * 100, 1),
            })

    recent_details = []
    attempts = kakitori_queryset.select_related("kanji", "vocab").order_by("-timestamp")[:50]
    for attempt in attempts:
        character = ""
        reading = ""
        if attempt.kanji:
            character = attempt.kanji.character
            reading = attempt.kanji.onyomi[0] if attempt.kanji.onyomi else (
                attempt.kanji.kunyomi[0] if attempt.kanji.kunyomi else ""
            )
        elif attempt.vocab:
            character = attempt.vocab.word
            reading = attempt.vocab.reading
        recent_details.append({
            "id": attempt.id,
            "character": character,
            "reading": reading,
            "answer_given": attempt.answer_given,
            "is_correct": attempt.is_correct,
            "timestamp": attempt.timestamp,
        })

    return {
        "total_attempts": sessions,
        "total_questions": total,
        "correct": correct,
        "accuracy": round(correct / total * 100, 1) if total else 0.0,
        "level_breakdown": sorted(level_breakdown, key=lambda item: item["level"], reverse=True),
        "recent_details": recent_details,
    }