import json

from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken


class ProfileImageApiTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="profile-user",
			email="profile@example.com",
			password="test-password-123",
		)
		access_token = str(RefreshToken.for_user(self.user).access_token)
		self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

	def test_user_can_update_own_profile_image(self):
		response = self.client.patch(
			"/api/auth/me/profile",
			data=json.dumps({"profile_image": "https://example.com/avatar.webp"}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["profile_image"], "https://example.com/avatar.webp")
		self.user.refresh_from_db()
		self.assertEqual(self.user.profile_image, "https://example.com/avatar.webp")

	def test_profile_image_must_use_https(self):
		response = self.client.patch(
			"/api/auth/me/profile",
			data=json.dumps({"profile_image": "http://example.com/avatar.webp"}),
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(response.status_code, 422)

	def test_tts_points_are_added_once_for_each_session(self):
		session_id = "8a1d7d7f-b240-4293-a137-571f854ec171"
		payload = json.dumps({"session_id": session_id, "points": 35})

		first_response = self.client.post(
			"/api/auth/me/tts-points",
			data=payload,
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)
		second_response = self.client.post(
			"/api/auth/me/tts-points",
			data=payload,
			content_type="application/json",
			secure=True,
			**self.auth_headers,
		)

		self.assertEqual(first_response.status_code, 200)
		self.assertEqual(second_response.status_code, 200)
		self.assertEqual(second_response.json()["tts_points"], 35)
		self.user.refresh_from_db()
		self.assertEqual(self.user.tts_points, 35)
