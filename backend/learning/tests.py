from django.test import TestCase

from content.models import CurriculumLevel, CurriculumUnit, FeatureSetting, Grammar, Particle, ReferenceBook

# Create your tests here.


class ParticlePracticeTests(TestCase):
	def test_particle_only_practice_ignores_requested_jlpt_level(self):
		Particle.objects.create(character='は', meaning='Topik', explanation='Penanda topik.', jlpt_level=5)
		Particle.objects.create(character='まで', meaning='Sampai', explanation='Penanda batas.', jlpt_level=2)

		response = self.client.get('/api/learning/practice/generate?type=particle&level=5', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertEqual({question['character'] for question in response.json()}, {'は', 'まで'})


class BunpoPracticeVisibilityTests(TestCase):
	def test_practice_excludes_disabled_bunpo_levels(self):
		FeatureSetting.objects.create(key='bunpo_visibility', value={'disabled_levels': [5]})
		Grammar.objects.create(title='N5', structure='N5', explanation='N5', jlpt_level=5)
		Grammar.objects.create(title='N4', structure='N4', explanation='N4', jlpt_level=4)

		response = self.client.get('/api/learning/practice/generate?type=grammar', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertEqual([question['character'] for question in response.json()], ['N4'])


class CurriculumPracticeTests(TestCase):
	def test_practice_questions_are_limited_to_assigned_unit(self):
		level = CurriculumLevel.objects.get(code='N4')
		book = ReferenceBook.objects.get(title='Minna no Nihongo Shokyu II')
		unit = CurriculumUnit.objects.get(jlpt_level=level, reference_book=book, original_unit_number=1)
		assigned = Grammar.objects.create(title='Assigned', structure='A', explanation='Assigned', jlpt_level=4)
		assigned.curriculum_units.add(unit)
		Grammar.objects.create(title='Unassigned', structure='B', explanation='Unassigned', jlpt_level=4)

		response = self.client.get(f'/api/learning/practice/generate?type=grammar&unit={unit.id}', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertEqual([question['character'] for question in response.json()], ['Assigned'])
