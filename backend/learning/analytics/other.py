from .common import compute_source_stats


def compute(user, date_range=None):
    particle_stats = compute_source_stats(
        user, "particle", "character", "particle", date_range
    )["wrong_stats"]
    minna_stats = compute_source_stats(
        user, "minna_question", "question_jp", "minna", date_range, label_limit=30
    )["wrong_stats"]
    return {"wrong_stats": [*particle_stats, *minna_stats]}