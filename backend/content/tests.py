from django.test import TestCase

from .models import FeatureSetting, Vocab, Kanji


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
