from .common import compute_source_stats


def compute(user, date_range=None):
    return compute_source_stats(user, "kanji", "character", "kanji", date_range)