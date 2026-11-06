import random


def sample_distractors(pool, correct_id, answer_for_item, count=3):
    candidates = random.sample(pool, min(len(pool), 10))
    return [answer_for_item(item) for item in candidates if item.id != correct_id][:count]


def build_options(correct_answer, distractor_answers):
    options = [
        {"text": correct_answer, "is_correct": True},
        *[{"text": answer, "is_correct": False} for answer in distractor_answers],
    ]
    random.shuffle(options)
    return options