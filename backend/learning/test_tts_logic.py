from unittest import TestCase
from unittest.mock import patch

from .tts_logic import CrosswordGenerator


class CrosswordGeneratorTests(TestCase):
    def test_starting_word_varies_with_random_selection(self):
        words = [
            {"id": "1", "word": "取る", "meaning": "mengambil"},
            {"id": "2", "word": "走る", "meaning": "berlari"},
            {"id": "3", "word": "学校", "meaning": "sekolah"},
        ]

        starters = []
        for chooser in (lambda options: options[-1], lambda options: options[0]):
            with patch("learning.tts_logic.random.choice", side_effect=chooser):
                _, placed_words = CrosswordGenerator(words, size=9).generate()
                starters.append(placed_words[0]["word"])

        self.assertEqual(starters, ["学校", "取る"])