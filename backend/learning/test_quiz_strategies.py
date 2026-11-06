from django.test import TestCase

from content.models import FeatureSetting, Grammar, Kanji, Vocab
from learning.quiz.registry import get_quiz_strategy


class QuizStrategyTests(TestCase):
    def generate_one(self, question_type):
        return get_quiz_strategy(question_type).generate([5], 1, {})[0]

    def test_kanji_strategy_builds_a_kanji_quiz_item(self):
        FeatureSetting.objects.update_or_create(
            key="kanji_visibility",
            defaults={"value": {"disabled_levels": []}},
        )
        Kanji.objects.create(character="日", meaning="matahari", strokes=4, jlpt_level=5)

        question = self.generate_one("kanji")

        self.assertEqual(question["type"], "kanji")
        self.assertEqual(question["character"], "日")
        self.assertEqual(question["options"][0]["text"], "matahari")
        self.assertEqual(question["level"], 5)

    def test_vocab_strategy_builds_a_vocab_quiz_item(self):
        Vocab.objects.create(word="水", reading="みず", meaning="air", jlpt_level=5)

        question = self.generate_one("vocab")

        self.assertEqual(question["type"], "vocab")
        self.assertEqual(question["character"], "水")
        self.assertEqual(question["reading"], "みず")
        self.assertEqual(question["meaning"], "air")

    def test_grammar_strategy_builds_a_grammar_quiz_item(self):
        Grammar.objects.create(title="〜ている", structure="Vている", explanation="sedang", jlpt_level=5)

        question = self.generate_one("grammar")

        self.assertEqual(question["type"], "grammar")
        self.assertEqual(question["character"], "〜ている")
        self.assertEqual(question["reading"], "Vている")
        self.assertEqual(question["options"][0]["text"], "sedang")

    def test_kana_strategy_builds_four_choices(self):
        question = self.generate_one("kana")

        self.assertEqual(question["type"], "kana")
        self.assertEqual(len(question["options"]), 4)
        self.assertEqual(sum(option["is_correct"] for option in question["options"]), 1)

    def test_registry_resolves_type_aliases(self):
        self.assertIs(get_quiz_strategy("kotoba"), get_quiz_strategy("vocab"))
        self.assertIs(get_quiz_strategy("bunpo"), get_quiz_strategy("grammar"))