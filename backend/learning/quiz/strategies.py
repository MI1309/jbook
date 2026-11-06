import random
from typing import Any, Mapping, TypedDict

from content.models import FeatureSetting, Grammar, Kanji, Vocab
from utils.kana import ROMAJI_MAP, format_reading, to_kana

from .distractors import build_options, sample_distractors


class QuizOption(TypedDict):
    text: str
    is_correct: bool


class QuizItem(TypedDict):
    id: str
    character: str
    type: str
    options: list[QuizOption]
    reading: str | None
    meaning: str | None
    level: int | None
    word_type: str | None


class ModelQuizStrategy:
    model = None
    question_type = ""
    visibility_key = ""
    default_disabled_levels = []
    display_field = ""
    answer_field = ""

    def generate(self, level: list[int], count: int, options: Mapping[str, Any]) -> list[QuizItem]:
        setting = FeatureSetting.objects.filter(key=self.visibility_key).first()
        value = setting.value if setting and isinstance(setting.value, dict) else {
            "disabled_levels": self.default_disabled_levels
        }
        queryset = self.model.objects.exclude(jlpt_level__in=value.get("disabled_levels", []))
        if options.get("unit"):
            queryset = queryset.filter(curriculum_units__id=options["unit"]).distinct()
        if level:
            queryset = queryset.filter(jlpt_level__in=level)

        pool = list(queryset)
        selected = random.sample(pool, min(len(pool), count))
        return [self._build_item(item, pool) for item in selected]

    def _build_item(self, item, pool) -> QuizItem:
        correct_answer = getattr(item, self.answer_field)
        distractors = sample_distractors(
            pool,
            item.id,
            lambda candidate: getattr(candidate, self.answer_field),
        )
        return {
            "id": str(item.id),
            "character": getattr(item, self.display_field),
            "type": self.question_type,
            "options": build_options(correct_answer, distractors),
            "reading": self._reading(item),
            "meaning": self._meaning(item),
            "level": getattr(item, "jlpt_level", None),
            "word_type": getattr(item, "word_type", None),
        }

    def _reading(self, item):
        raise NotImplementedError

    def _meaning(self, item):
        return getattr(item, self.answer_field)


class KanjiQuizStrategy(ModelQuizStrategy):
    model = Kanji
    question_type = "kanji"
    visibility_key = "kanji_visibility"
    default_disabled_levels = [1, 2, 3]
    display_field = "character"
    answer_field = "meaning"

    def _reading(self, item):
        return f"On: {format_reading(item.onyomi, True)} | Kun: {format_reading(item.kunyomi, False)}"


class VocabQuizStrategy(ModelQuizStrategy):
    model = Vocab
    question_type = "vocab"
    visibility_key = "vocab_visibility"
    display_field = "word"
    answer_field = "meaning"

    def _reading(self, item):
        return to_kana((item.furigana or item.reading or "").lower())


class GrammarQuizStrategy(ModelQuizStrategy):
    model = Grammar
    question_type = "grammar"
    visibility_key = "bunpo_visibility"
    display_field = "title"
    answer_field = "explanation"

    def _reading(self, item):
        return item.structure


class KanaQuizStrategy:
    def generate(self, level: list[int], count: int, options: Mapping[str, Any]) -> list[QuizItem]:
        items = list(ROMAJI_MAP.items())
        random.shuffle(items)
        questions = []
        for romaji, kana in items[:count]:
            distractors = random.sample([key for key, _ in items if key != romaji], 3)
            questions.append({
                "id": f"kana_{kana}",
                "character": kana,
                "type": "kana",
                "options": build_options(romaji, distractors),
                "reading": romaji,
                "meaning": f"Karakter Kana: {kana}",
                "level": None,
                "word_type": None,
            })
        return questions