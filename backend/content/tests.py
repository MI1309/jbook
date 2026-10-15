from django.test import TestCase

from .models import FeatureSetting, Vocab, Kanji, Grammar, GrammarSentence, WordType, CurriculumLevel, ReferenceBook, CurriculumUnit, Particle
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


class BunpoVisibilityTests(TestCase):
    def setUp(self):
        FeatureSetting.objects.update_or_create(
            key='bunpo_visibility',
            defaults={'value': {'disabled_levels': [3]}},
        )
        self.disabled_grammar = Grammar.objects.create(title='N3 grammar', structure='N3', explanation='N3', chapter=1, jlpt_level=3)
        Grammar.objects.create(title='N4 grammar', structure='N4', explanation='N4', chapter=1, jlpt_level=4)

    def test_public_bunpo_visibility_reports_enabled_levels(self):
        response = self.client.get('/api/content/bunpo/visibility', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['disabled_levels'], [3])
        self.assertEqual(response.json()['enabled_levels'], [1, 2, 4, 5])

    def test_bunpo_list_hides_disabled_levels(self):
        response = self.client.get('/api/content/bunpo?limit=30&page=1', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['jlpt_level'] for item in response.json()['items']], [4])

    def test_bunpo_detail_hides_disabled_level(self):
        response = self.client.get(f'/api/content/bunpo/{self.disabled_grammar.id}', secure=True)

        self.assertEqual(response.status_code, 404)


class CurriculumApiTests(TestCase):
    def setUp(self):
        self.levels = {level.code: level for level in CurriculumLevel.objects.all()}
        self.n4_book = ReferenceBook.objects.get(title='Minna no Nihongo Shokyu II')
        self.n4_unit = CurriculumUnit.objects.get(
            jlpt_level=self.levels['N4'],
            reference_book=self.n4_book,
            original_unit_number=1,
        )

    def test_all_jlpt_curriculum_levels_are_listed(self):
        response = self.client.get('/api/content/curriculum/levels', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['code'] for item in response.json()], ['N5', 'N4', 'N3', 'N2', 'N1'])

    def test_books_are_filtered_by_level(self):
        response = self.client.get('/api/content/curriculum/books?level=N4', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['title'] for item in response.json()], ['Minna no Nihongo Shokyu II'])

    def test_level_without_seeded_books_returns_an_empty_list(self):
        response = self.client.get('/api/content/curriculum/books?level=N3', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_book_detail_includes_available_bibliography(self):
        response = self.client.get(f'/api/content/curriculum/books/{self.n4_book.id}', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Minna no Nihongo Shokyu II')
        self.assertEqual(response.json()['jlpt_levels'], ['N4'])
        self.assertEqual(response.json()['isbn'], '')

    def test_units_preserve_original_numbers_and_display_order(self):
        response = self.client.get(f'/api/content/curriculum/units?book={self.n4_book.id}', secure=True)

        self.assertEqual(response.status_code, 200)
        units = response.json()
        self.assertEqual(len(units), 25)
        self.assertEqual([unit['original_unit_number'] for unit in units], list(range(1, 26)))
        self.assertEqual([unit['display_order'] for unit in units], list(range(26, 51)))

    def test_same_original_number_from_another_book_is_not_mixed(self):
        book = ReferenceBook.objects.create(title='Manual N4 reference')
        book.jlpt_levels.add(self.levels['N4'])
        CurriculumUnit.objects.create(
            jlpt_level=self.levels['N4'], reference_book=book,
            original_unit_number=1, display_order=1,
        )

        response = self.client.get(f'/api/content/curriculum/units?book={book.id}', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['reference_book_title'], 'Manual N4 reference')

    def test_material_filter_uses_curriculum_unit_relation(self):
        grammar = Grammar.objects.create(
            title='Mapped N4 pattern', structure='N + です', explanation='Unit-scoped item',
            chapter=1, jlpt_level=4,
        )
        grammar.curriculum_units.add(self.n4_unit)
        vocab = Vocab.objects.create(word='一つ', reading='ひとつ', meaning='satu', jlpt_level=4)
        vocab.curriculum_units.add(self.n4_unit)
        kanji = Kanji.objects.create(character='一', meaning='satu', strokes=1, jlpt_level=5)
        kanji.curriculum_units.add(self.n4_unit)
        particle = Particle.objects.create(
            character='まで', meaning='sampai', explanation='Batas', jlpt_level=4,
        )
        particle.curriculum_units.add(self.n4_unit)
        Grammar.objects.create(
            title='Unmapped pattern', structure='N + でした', explanation='Legacy only',
            chapter=1, jlpt_level=4,
        )

        listing = self.client.get(f'/api/content/bunpo?unit={self.n4_unit.id}', secure=True)
        materials = self.client.get(f'/api/content/curriculum/units/{self.n4_unit.id}/materials', secure=True)

        self.assertEqual([item['title'] for item in listing.json()['items']], ['Mapped N4 pattern'])
        self.assertEqual([item['title'] for item in materials.json()['grammar']], ['Mapped N4 pattern'])
        self.assertEqual([item['word'] for item in materials.json()['vocab']], ['一つ'])
        self.assertEqual([item['character'] for item in materials.json()['kanji']], ['一'])
        self.assertEqual([item['character'] for item in materials.json()['particles']], ['まで'])

    def test_unknown_level_and_book_return_not_found(self):
        level_response = self.client.get('/api/content/curriculum/books?level=N0', secure=True)
        book_response = self.client.get('/api/content/curriculum/units?book=00000000-0000-0000-0000-000000000000', secure=True)

        self.assertEqual(level_response.status_code, 404)
        self.assertEqual(book_response.status_code, 404)

    def test_legacy_chapter_filter_remains_compatible(self):
        Grammar.objects.create(
            title='Legacy N3 pattern', structure='N3 pattern', explanation='Existing curriculum data',
            chapter=51, jlpt_level=3,
        )

        response = self.client.get('/api/content/bunpo?chapter=51', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['chapter'] for item in response.json()['items']], [51])


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
