import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from ninja_jwt.tokens import RefreshToken

from content.models import CurriculumLevel, CurriculumUnit, FeatureSetting, Grammar, Particle, ReferenceBook, Vocab
from users.models import TTSPointSession
from .models import LearningPathStage, StudyLog, UserStageProgress, UserVocabulary

# Create your tests here.


class ParticlePracticeTests(TestCase):
	def test_particle_only_practice_is_temporarily_disabled(self):
		Particle.objects.create(character='は', meaning='Topik', explanation='Penanda topik.', jlpt_level=5)
		Particle.objects.create(character='まで', meaning='Sampai', explanation='Penanda batas.', jlpt_level=2)

		response = self.client.get('/api/learning/practice/generate?type=particle&level=5', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), [])

	def test_disabled_particle_type_is_excluded_from_mixed_practice(self):
		for character, level in [('は', 5), ('が', 4), ('を', 3), ('に', 2), ('で', 1), ('へ', 5)]:
			Particle.objects.create(character=character, meaning=f'Makna {character}', explanation=f'Penjelasan {character}', jlpt_level=level)

		response = self.client.get('/api/learning/practice/generate?type=kana,particle&limit=10&level=5', secure=True)

		self.assertEqual(response.status_code, 200)
		questions = response.json()
		self.assertEqual(len(questions), 10)
		self.assertEqual({question['type'] for question in questions}, {'kana'})

	def test_kana_practice_has_four_unique_choices_and_no_level(self):
		response = self.client.get('/api/learning/practice/generate?type=kana&limit=10', secure=True)

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.json())
		for question in response.json():
			choice_texts = [option['text'] for option in question['options']]
			self.assertEqual(len(choice_texts), 4)
			self.assertEqual(len(set(choice_texts)), 4)
			self.assertIsNone(question['level'])


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


@override_settings(EMAIL_ENCRYPTION_KEY="test-email-encryption-key")
class VocabularySrsApiTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="srs-user",
			email="srs@example.com",
			password="test-password-123",
		)
		self.other_user = get_user_model().objects.create_user(
			username="other-srs-user",
			email="other-srs@example.com",
			password="test-password-123",
		)
		access_token = str(RefreshToken.for_user(self.user).access_token)
		self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}
		self.vocabulary = Vocab.objects.create(
			word="食べる",
			reading="たべる",
			meaning="makan",
			jlpt_level=5,
			examples=[{"sentence": "ご飯を食べる", "meaning": "Makan nasi"}],
		)

	def test_vocabulary_search_filters_by_level_and_term(self):
		Vocab.objects.create(word="水", reading="みず", meaning="air", jlpt_level=4)
		response = self.client.get(
			"/api/learning/vocabulary?jlpt_level=5&search=食べる",
			secure=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual([item["word"] for item in response.json()], ["食べる"])

	def test_user_can_add_review_and_view_own_vocabulary(self):
		add_response = self.client.post(
			"/api/learning/my-vocabulary",
			data=json.dumps({"vocabulary_id": str(self.vocabulary.id)}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(add_response.status_code, 200)
		entry_id = add_response.json()["id"]
		self.assertEqual(add_response.json()["vocabulary"]["word"], "食べる")
		self.assertEqual(add_response.json()["status"], UserVocabulary.Status.NEW)

		review_response = self.client.post(
			f"/api/learning/my-vocabulary/{entry_id}/review",
			data=json.dumps({"correct": True}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)
		self.assertEqual(review_response.status_code, 200)
		self.assertEqual(review_response.json()["box_level"], 1)
		self.assertEqual(review_response.json()["times_reviewed"], 1)
		self.assertEqual(
			review_response.json()["next_review_date"],
			(timezone.localdate() + timedelta(days=1)).isoformat(),
		)

		list_response = self.client.get(
			"/api/learning/my-vocabulary",
			secure=True,
			**self.auth_headers,
		)
		self.assertEqual(list_response.status_code, 200)
		self.assertEqual(len(list_response.json()), 1)
		self.assertEqual(StudyLog.objects.filter(user=self.user).count(), 2)

	def test_roadmap_returns_seeded_stages_and_beta_status(self):
		response = self.client.get(
			"/api/learning/roadmap",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 200)
		stages = response.json()
		self.assertEqual([stage["code"] for stage in stages], ["hiragana", "katakana", "n5", "n4", "n3", "n2", "n1"])
		self.assertEqual([stage["code"] for stage in stages if stage["availability"] == "beta"], ["n3", "n2", "n1"])

	def test_user_can_update_only_own_roadmap_progress(self):
		stage = LearningPathStage.objects.get(code="n5")
		response = self.client.put(
			f"/api/learning/roadmap/{stage.id}/progress",
			data=json.dumps({"completion_percent": 100}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["completion_percent"], 100)
		self.assertTrue(UserStageProgress.objects.get(user=self.user, stage=stage).completed_at)
		self.assertFalse(UserStageProgress.objects.filter(user=self.other_user, stage=stage).exists())

	def test_collection_and_dashboard_require_authentication(self):
		collection_response = self.client.get("/api/learning/my-vocabulary", secure=True)
		stats_response = self.client.get("/api/learning/dashboard/stats", secure=True)

		self.assertEqual(collection_response.status_code, 401)
		self.assertEqual(stats_response.status_code, 401)

	def test_user_cannot_read_or_update_another_users_collection_entry(self):
		entry = UserVocabulary.objects.create(user=self.other_user, vocabulary=self.vocabulary)
		response = self.client.patch(
			f"/api/learning/my-vocabulary/{entry.id}",
			data=json.dumps({"status": "mastered"}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 404)
		entry.refresh_from_db()
		self.assertEqual(entry.status, UserVocabulary.Status.NEW)

	def test_dashboard_returns_user_scoped_totals_and_thirty_day_activity(self):
		UserVocabulary.objects.create(user=self.user, vocabulary=self.vocabulary)
		StudyLog.objects.create(
			user=self.user,
			activity_type=StudyLog.ActivityType.VOCABULARY_REVIEW,
			items_studied=3,
		)
		other_vocab = Vocab.objects.create(
			word="水", reading="みず", meaning="air", jlpt_level=5
		)
		UserVocabulary.objects.create(
			user=self.other_user,
			vocabulary=other_vocab,
			status=UserVocabulary.Status.MASTERED,
		)
		self.user.profile.total_tts_points = 120
		self.user.profile.save(update_fields=["total_tts_points", "updated_at"])
		TTSPointSession.objects.create(user=self.user, points=20)

		response = self.client.get(
			"/api/learning/dashboard/stats",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["total_saved"], 1)
		self.assertEqual(response.json()["mastered"], 0)
		self.assertEqual(response.json()["username"], self.user.username)
		self.assertEqual(response.json()["total_tts_points"], 120)
		self.assertEqual(response.json()["tts_games_played"], 1)
		self.assertEqual(response.json()["roadmap"][0]["stage_code"], "hiragana")
		self.assertIn("completion_percentage", response.json()["roadmap"][0])
		self.assertEqual(len(response.json()["daily_activity"]), 30)
		self.assertEqual(response.json()["daily_activity"][-1]["items_studied"], 3)
