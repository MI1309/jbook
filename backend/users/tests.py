import json
from io import StringIO

from django.core import mail
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from users.privacy import email_lookup_digest


@override_settings(EMAIL_ENCRYPTION_KEY="test-email-encryption-key")
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


@override_settings(
	EMAIL_ENCRYPTION_KEY="test-email-encryption-key",
	EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
	EMAIL_HOST_USER="sender@example.com",
	EMAIL_HOST_PASSWORD="test-password",
)
class PrivateEmailTests(TestCase):
	def setUp(self):
		self.email = "private@example.com"
		self.user = get_user_model().objects.create_user(
			username="private-email-user",
			email=self.email,
			password="test-password-123",
		)

	def test_database_stores_ciphertext_and_random_alias(self):
		User = get_user_model()
		stored = User.objects.values("email", "email_ciphertext", "email_lookup_hash").get(pk=self.user.pk)

		self.assertNotEqual(stored["email"], self.email)
		self.assertTrue(stored["email"].endswith("@privacy.invalid"))
		self.assertNotIn(self.email, stored["email_ciphertext"])
		self.assertEqual(stored["email_lookup_hash"], email_lookup_digest(self.email))
		self.assertEqual(self.user.get_private_email(), self.email)

	def test_email_storage_audit_passes_for_protected_record(self):
		output = StringIO()

		call_command("audit_email_storage", stdout=output)

		self.assertIn("Protected and verified: 1", output.getvalue())
		self.assertIn("Email storage audit passed.", output.getvalue())
		self.assertNotIn(self.email, output.getvalue())

	def test_email_storage_audit_fails_for_plaintext_without_exposing_it(self):
		User = get_user_model()
		User.objects.filter(pk=self.user.pk).update(email=self.email)
		output = StringIO()

		with self.assertRaises(CommandError):
			call_command("audit_email_storage", stdout=output)

		self.assertIn("Plaintext or invalid records: 1", output.getvalue())
		self.assertNotIn(self.email, output.getvalue())

	def test_login_accepts_real_email_but_returns_masked_email(self):
		response = self.client.post(
			"/api/auth/login",
			data=json.dumps({"identifier": self.email, "password": "test-password-123"}),
			content_type="application/json",
			secure=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["user"]["email"], "p***@example.com")
		self.assertNotIn(self.email, response.content.decode())

	def test_email_lookup_is_case_insensitive(self):
		self.assertEqual(
			email_lookup_digest("PRIVATE@EXAMPLE.COM"),
			email_lookup_digest(self.email),
		)

	def test_me_endpoint_returns_masked_email(self):
		access_token = str(RefreshToken.for_user(self.user).access_token)
		response = self.client.get(
			"/api/auth/me",
			HTTP_AUTHORIZATION=f"Bearer {access_token}",
			secure=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["email"], "p***@example.com")
		self.assertNotIn(self.email, response.content.decode())

	def test_password_reset_sends_to_decrypted_address_without_returning_it(self):
		response = self.client.post(
			"/api/auth/password-reset",
			data=json.dumps({"email": self.email}),
			content_type="application/json",
			secure=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertNotIn(self.email, response.content.decode())
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, [self.email])
