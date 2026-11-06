from .common import compute_source_stats


def compute(user, date_range=None):
    return compute_source_stats(user, "vocab", "word", "vocab", date_range)