from django.test import TestCase

from content.models import Particle

# Create your tests here.


class ParticlePracticeTests(TestCase):
	def test_particle_only_practice_ignores_requested_jlpt_level(self):
		Particle.objects.create(character='は', meaning='Topik', explanation='Penanda topik.', jlpt_level=5)
		Particle.objects.create(character='まで', meaning='Sampai', explanation='Penanda batas.', jlpt_level=2)

		response = self.client.get('/api/learning/practice/generate?type=particle&level=5', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertEqual({question['character'] for question in response.json()}, {'は', 'まで'})
