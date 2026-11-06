from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from content.models import Grammar, Kanji, Vocab
from learning.analytics import grammar, kanji, vocab
from learning.analytics.aggregator import compute_analytics
from learning.models import QuizAttempt


@override_settings(EMAIL_ENCRYPTION_KEY="test-email-encryption-key")
class AnalyticsModuleTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="analytics-user",
            email="analytics@example.com",
            password="test-password-123",
        )

    def test_kanji_module_computes_kanji_wrong_stats(self):
        item = Kanji.objects.create(character="日", meaning="matahari", strokes=4, jlpt_level=5)
        QuizAttempt.objects.create(user=self.user, kanji=item, is_correct=False)

        result = kanji.compute(self.user)

        self.assertEqual(result["wrong_stats"][0]["character"], "日")
        self.assertEqual(result["wrong_stats"][0]["type"], "kanji")

    def test_vocab_module_computes_vocab_wrong_stats(self):
        item = Vocab.objects.create(word="水", reading="みず", meaning="air", jlpt_level=5)
        QuizAttempt.objects.create(user=self.user, vocab=item, is_correct=False)

        result = vocab.compute(self.user)

        self.assertEqual(result["wrong_stats"][0]["character"], "水")
        self.assertEqual(result["wrong_stats"][0]["type"], "vocab")

    def test_grammar_module_computes_grammar_wrong_stats(self):
        item = Grammar.objects.create(title="〜ている", structure="Vている", explanation="sedang", jlpt_level=5)
        QuizAttempt.objects.create(user=self.user, grammar=item, is_correct=False)

        result = grammar.compute(self.user)

        self.assertEqual(result["wrong_stats"][0]["character"], "〜ている")
        self.assertEqual(result["wrong_stats"][0]["type"], "grammar")

    def test_aggregator_preserves_totals_levels_and_kakitori_response(self):
        kanji_item = Kanji.objects.create(character="日", meaning="matahari", strokes=4, jlpt_level=5)
        vocab_item = Vocab.objects.create(word="水", reading="みず", meaning="air", jlpt_level=5)
        QuizAttempt.objects.create(user=self.user, kanji=kanji_item, is_correct=True, mode="kakitori")
        QuizAttempt.objects.create(user=self.user, vocab=vocab_item, is_correct=False, mode="kakitori")

        result = compute_analytics(self.user)

        self.assertEqual(result["total_attempts"], 2)
        self.assertEqual(result["accuracy"], 50.0)
        self.assertEqual(result["wrong_stats"][0]["type"], "vocab")
        self.assertEqual(result["level_stats"], [{
            "level": 5,
            "total": 2,
            "correct": 1,
            "accuracy": 50.0,
        }])
        self.assertEqual(result["kakitori_stats"]["total_questions"], 2)
        self.assertEqual(result["kakitori_stats"]["correct"], 1)
        self.assertEqual(result["kakitori_stats"]["level_breakdown"][0]["level"], 5)
        self.assertEqual(len(result["kakitori_stats"]["recent_details"]), 2)