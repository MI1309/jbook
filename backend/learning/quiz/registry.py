from .strategies import (
    GrammarQuizStrategy,
    KanjiQuizStrategy,
    KanaQuizStrategy,
    VocabQuizStrategy,
)


kanji_strategy = KanjiQuizStrategy()
vocab_strategy = VocabQuizStrategy()
grammar_strategy = GrammarQuizStrategy()
kana_strategy = KanaQuizStrategy()

QUIZ_STRATEGIES = {
    "kanji": kanji_strategy,
    "vocab": vocab_strategy,
    "kotoba": vocab_strategy,
    "grammar": grammar_strategy,
    "bunpo": grammar_strategy,
    "kana": kana_strategy,
}


def get_quiz_strategy(question_type):
    return QUIZ_STRATEGIES.get(question_type)