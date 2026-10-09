from django.test import TestCase

from .models import FeatureSetting, Vocab, Kanji, Grammar, GrammarSentence, WordType
from .admin_api import _save_bunpo_sentences


class VocabListApiTests(TestCase):
    def setUp(self):
        FeatureSetting.objects.create(
            key='vocab_visibility',
            value={'disabled_levels': [1, 2, 3]},
        )
        Vocab.objects.create(word='word-four', reading='reading-four', meaning='meaning-four', jlpt_level=4)
        Vocab.objects.create(word='word-five', reading='reading-five', meaning='meaning-five', jlpt_level=5)

    def test_vocab_list_uses_clean_paginated_response_contract(self):
        response = self.client.get('/api/content/vocab?level=4%2C5&limit=30&page=1', secure=True)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(set(payload), {'items', 'total', 'page', 'pages'})
        self.assertEqual([item['jlpt_level'] for item in payload['items']], [4, 5])

    def test_vocab_list_excludes_disabled_levels_when_explicitly_requested(self):
        response = self.client.get('/api/content/vocab?level=1%2C2%2C3&limit=30&page=1', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['items'], [])


class KanjiListApiTests(TestCase):
    def setUp(self):
        FeatureSetting.objects.update_or_create(
            key='kanji_visibility',
            defaults={'value': {'disabled_levels': [1, 2, 3]}},
        )
        Kanji.objects.create(character='四', meaning='four', strokes=5, jlpt_level=4)
        Kanji.objects.create(character='五', meaning='five', strokes=4, jlpt_level=5)

    def test_kanji_list_excludes_disabled_levels_when_explicitly_requested(self):
        response = self.client.get('/api/content/kanji?level=1%2C2%2C3&limit=30&page=1', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['items'], [])


class GrammarExpressionRelationTests(TestCase):
    def setUp(self):
        self.expression = Vocab.objects.create(
            word='〜の一つ',
            reading='no hitotsu',
            meaning='salah satu',
            word_type=WordType.EXPRESSION,
            jlpt_level=4,
        )
        self.grammar = Grammar.objects.create(
            title='Nの一つ',
            structure='Nの一つ',
            explanation='Salah satu dari sesuatu.',
            chapter=1,
            jlpt_level=4,
            sentences=[{'jp': '読書は趣味の一つです。', 'id': 'Membaca adalah salah satu hobi.'}],
        )
        sentence = GrammarSentence.objects.create(
            grammar=self.grammar,
            order=0,
            jp='読書は趣味の一つです。',
            translation='Membaca adalah salah satu hobi.',
        )
        sentence.expressions.add(self.expression)

    def test_public_bunpo_detail_includes_linked_expression(self):
        response = self.client.get(f'/api/content/bunpo/{self.grammar.id}', secure=True)

        self.assertEqual(response.status_code, 200)
        sentence = response.json()['sentences'][0]
        self.assertEqual(sentence['expression_ids'], [str(self.expression.id)])
        self.assertEqual(sentence['expressions'][0]['word'], self.expression.word)

    def test_sentence_updates_replace_expression_relations(self):
        replacement = Vocab.objects.create(
            word='別の表現',
            reading='betsu no hyougen',
            meaning='ungkapan lain',
            word_type=WordType.EXPRESSION,
            jlpt_level=4,
        )

        _save_bunpo_sentences(self.grammar, [{
            'jp': '別の例文です。',
            'id': 'Ini contoh lain.',
            'expression_ids': [str(replacement.id)],
        }])

        sentence = self.grammar.sentence_records.get(order=0)
        self.assertEqual(sentence.jp, '別の例文です。')
        self.assertEqual(list(sentence.expressions.values_list('id', flat=True)), [replacement.id])
        self.assertEqual(self.grammar.sentences, [{'jp': '別の例文です。', 'id': 'Ini contoh lain.'}])
