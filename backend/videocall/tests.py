"""
Test Suite for House of Anbu - Full Stack Django + React Project
Covers: User Registration, Authentication, Chat, Video Call, WebSockets
Run with: python manage.py test
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
import json

User = get_user_model()


# ─────────────────────────────────────────────
# HELPER: create a user + get JWT token easily
# ─────────────────────────────────────────────
def create_user(email="test@example.com", name="TestUser", password="Test@1234"):
    return User.objects.create_user(email=email, name=name, password=password)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


# ══════════════════════════════════════════════
# 1. USER REGISTRATION TESTS
# ══════════════════════════════════════════════
class UserRegistrationTest(APITestCase):
    """
    Tests for /api/register/ endpoint.
    Checks valid registration, duplicate email, missing fields, weak password.
    """

    def setUp(self):
        self.register_url = "/api/register/"  
        self.valid_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "Strong@123",
        }

    # ✅ Test 1: Successful registration
    def test_register_success(self):
        response = self.client.post(self.register_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())

    # ❌ Test 2: Duplicate email should fail
    def test_register_duplicate_email(self):
        create_user(email="newuser@example.com")
        response = self.client.post(self.register_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ❌ Test 3: Missing email field
    def test_register_missing_email(self):
        data = {"name": "No Email", "password": "Strong@123"}
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ❌ Test 4: Missing password field
    def test_register_missing_password(self):
        data = {"email": "test@example.com", "name": "No Pass"}
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ❌ Test 5: Invalid email format
    def test_register_invalid_email_format(self):
        data = {**self.valid_data, "email": "not-an-email"}
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ❌ Test 6: Empty request body
    def test_register_empty_body(self):
        response = self.client.post(self.register_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════
# 2. USER LOGIN / JWT AUTHENTICATION TESTS
# ══════════════════════════════════════════════
class UserLoginTest(APITestCase):
    """
    Tests for /api/login/ (JWT token endpoint).
    Checks valid login, wrong password, non-existent user.
    """

    def setUp(self):
        self.login_url = "/api/login/"  
        self.user = create_user(email="login@example.com", password="Test@1234")

    # ✅ Test 7: Successful login returns access + refresh tokens
    def test_login_success(self):
        response = self.client.post(
            self.login_url,
            {"email": "login@example.com", "password": "Test@1234"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    # ❌ Test 8: Wrong password
    def test_login_wrong_password(self):
        response = self.client.post(
            self.login_url,
            {"email": "login@example.com", "password": "WrongPass"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ❌ Test 9: Non-existent user
    def test_login_nonexistent_user(self):
        response = self.client.post(
            self.login_url,
            {"email": "ghost@example.com", "password": "Test@1234"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ❌ Test 10: Missing password in request
    def test_login_missing_password(self):
        response = self.client.post(
            self.login_url,
            {"email": "login@example.com"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════
# 3. JWT TOKEN REFRESH TESTS
# ══════════════════════════════════════════════
class TokenRefreshTest(APITestCase):
    """
    Tests for /api/token/refresh/.
    Checks valid refresh token, invalid token, missing token.
    """

    def setUp(self):
        self.refresh_url = "/api/token/refresh/"
        self.user = create_user()
        self.refresh_token = str(RefreshToken.for_user(self.user))

    # ✅ Test 11: Valid refresh token returns new access token
    def test_token_refresh_success(self):
        response = self.client.post(
            self.refresh_url,
            {"refresh": self.refresh_token},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # ❌ Test 12: Invalid/tampered refresh token
    def test_token_refresh_invalid(self):
        response = self.client.post(
            self.refresh_url,
            {"refresh": "this.is.invalid"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ❌ Test 13: Missing refresh token
    def test_token_refresh_missing(self):
        response = self.client.post(self.refresh_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════
# 4. PROTECTED ENDPOINT / AUTH GUARD TESTS
# ══════════════════════════════════════════════
class AuthProtectionTest(APITestCase):
    """
    Tests that protected endpoints reject unauthenticated requests
    and accept valid JWT tokens.
    """

    def setUp(self):
        self.user = create_user()
        self.token = get_tokens_for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    # ✅ Test 14: Authenticated user can access protected endpoint
    def test_authenticated_access(self):
        # Using call-history as a sample protected endpoint
        response = self.client.get("/videocall/call-history/")
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ❌ Test 15: Unauthenticated request is rejected
    def test_unauthenticated_access_rejected(self):
        self.client.credentials()  # clear token
        response = self.client.get("/videocall/call-history/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ❌ Test 16: Fake token is rejected
    def test_fake_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer faketoken123")
        response = self.client.get("/videocall/call-history/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ══════════════════════════════════════════════
# 5. VIDEO CALL - START CALL TESTS
# ══════════════════════════════════════════════
class StartCallTest(APITestCase):
    """
    Tests for POST /videocall/start/
    Checks call creation, invalid receiver, self-call prevention.
    """

    def setUp(self):
        self.caller = create_user(email="caller@example.com", name="Caller")
        self.receiver = create_user(email="receiver@example.com", name="Receiver")
        self.token = get_tokens_for_user(self.caller)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.url = "/videocall/start/"

    # ✅ Test 17: Start call successfully
    @patch("videocall.views.get_channel_layer")
    def test_start_call_success(self, mock_layer):
        mock_layer.return_value.group_send = MagicMock()
        response = self.client.post(
            self.url,
            {"receiver_id": self.receiver.id},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("room_name", response.data)
        self.assertIn("call_id", response.data)

    # ❌ Test 18: Receiver does not exist
    def test_start_call_invalid_receiver(self):
        response = self.client.post(
            self.url,
            {"receiver_id": 99999},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ❌ Test 19: Missing receiver_id in request
    def test_start_call_missing_receiver(self):
        response = self.client.post(self.url, {}, format="json")
        # Should return an error — either 400 or 404
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])

    # ❌ Test 20: Unauthenticated user cannot start call
    def test_start_call_unauthenticated(self):
        self.client.credentials()
        response = self.client.post(
            self.url,
            {"receiver_id": self.receiver.id},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ══════════════════════════════════════════════
# 6. VIDEO CALL - UPDATE STATUS TESTS
# ══════════════════════════════════════════════
class UpdateCallStatusTest(APITestCase):
    """
    Tests for POST /videocall/call/<id>/update/
    Covers: rejected, cancelled, ended statuses.
    """

    def setUp(self):
        from videocall.models import Call
        from chat.models import Chat

        self.caller = create_user(email="caller2@example.com", name="Caller2")
        self.receiver = create_user(email="receiver2@example.com", name="Receiver2")

        self.chat = Chat.objects.create(user1=self.caller, user2=self.receiver)
        self.call = Call.objects.create(
            caller=self.caller,
            receiver=self.receiver,
            room_name="testroom123",
            chat=self.chat,
            status="ringing"
        )

    def _auth(self, user):
        token = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _update_url(self):
        return f"/videocall/call/{self.call.id}/update/"

    # ✅ Test 21: Receiver rejects call → status becomes rejected, is_missed=True
    @patch("videocall.views.get_channel_layer")
    def test_receiver_rejects_call(self, mock_layer):
        mock_layer.return_value.group_send = MagicMock()
        self._auth(self.receiver)
        response = self.client.post(self._update_url(), {"status": "rejected"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.call.refresh_from_db()
        self.assertEqual(self.call.status, "rejected")
        self.assertTrue(self.call.is_missed)

    # ✅ Test 22: Caller cancels call → status becomes cancelled, is_missed=True
    @patch("videocall.views.get_channel_layer")
    def test_caller_cancels_call(self, mock_layer):
        mock_layer.return_value.group_send = MagicMock()
        self._auth(self.caller)
        response = self.client.post(self._update_url(), {"status": "cancelled"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.call.refresh_from_db()
        self.assertEqual(self.call.status, "cancelled")
        self.assertTrue(self.call.is_missed)

    # ✅ Test 23: Call ended → duration is calculated
    @patch("videocall.views.get_channel_layer")
    def test_call_ended_calculates_duration(self, mock_layer):
        from django.utils import timezone
        mock_layer.return_value.group_send = MagicMock()
        self.call.started_at = timezone.now()
        self.call.save()
        self._auth(self.caller)
        response = self.client.post(self._update_url(), {"status": "ended"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.call.refresh_from_db()
        self.assertEqual(self.call.status, "ended")
        self.assertGreaterEqual(self.call.duration, 0)

    # ❌ Test 24: Unauthenticated update is rejected
    def test_update_call_unauthenticated(self):
        self.client.credentials()
        response = self.client.post(self._update_url(), {"status": "ended"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ══════════════════════════════════════════════
# 7. CALL HISTORY TESTS
# ══════════════════════════════════════════════
class CallHistoryTest(APITestCase):
    """
    Tests for GET /videocall/call-history/
    Checks that only the current user's calls are returned.
    """

    def setUp(self):
        from videocall.models import Call
        from chat.models import Chat

        self.user_a = create_user(email="a@example.com", name="UserA")
        self.user_b = create_user(email="b@example.com", name="UserB")
        self.user_c = create_user(email="c@example.com", name="UserC")

        chat_ab = Chat.objects.create(user1=self.user_a, user2=self.user_b)
        chat_bc = Chat.objects.create(user1=self.user_b, user2=self.user_c)

        # Call between A and B
        Call.objects.create(caller=self.user_a, receiver=self.user_b,
                            room_name="room_ab", chat=chat_ab, status="ended")
        # Call between B and C (unrelated to A)
        Call.objects.create(caller=self.user_b, receiver=self.user_c,
                            room_name="room_bc", chat=chat_bc, status="ended")

        self.token = get_tokens_for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    # ✅ Test 25: User A only sees their own calls
    def test_call_history_only_own_calls(self):
        response = self.client.get("/videocall/call-history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # only the A↔B call

    # ✅ Test 26: Response contains expected fields
    def test_call_history_response_fields(self):
        response = self.client.get("/videocall/call-history/")
        call = response.data[0]
        self.assertIn("caller_name", call)
        self.assertIn("receiver_name", call)
        self.assertIn("status", call)
        self.assertIn("is_missed", call)
        self.assertIn("duration", call)

    # ❌ Test 27: Unauthenticated request is rejected
    def test_call_history_unauthenticated(self):
        self.client.credentials()
        response = self.client.get("/videocall/call-history/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ══════════════════════════════════════════════
# 8. CHAT MODEL TESTS
# ══════════════════════════════════════════════
class ChatModelTest(TestCase):
    """
    Tests for Chat and Message models.
    Checks creation, uniqueness, and message linking.
    """

    def setUp(self):
        from chat.models import Chat, Message
        self.Chat = Chat
        self.Message = Message
        self.user1 = create_user(email="u1@example.com", name="User1")
        self.user2 = create_user(email="u2@example.com", name="User2")

    # ✅ Test 28: Chat can be created between two users
    def test_chat_creation(self):
        chat = self.Chat.objects.create(user1=self.user1, user2=self.user2)
        self.assertIsNotNone(chat.id)

    # ✅ Test 29: Message can be created inside a chat
    def test_message_creation(self):
        chat = self.Chat.objects.create(user1=self.user1, user2=self.user2)
        msg = self.Message.objects.create(
            chat=chat,
            sender=self.user1,
            content="Hello!",
            message_type="text"
        )
        self.assertEqual(msg.content, "Hello!")
        self.assertEqual(msg.chat, chat)

    # ✅ Test 30: Message is_read defaults to False
    def test_message_unread_by_default(self):
        chat = self.Chat.objects.create(user1=self.user1, user2=self.user2)
        msg = self.Message.objects.create(
            chat=chat, sender=self.user1,
            content="Unread msg", message_type="text"
        )
        self.assertFalse(msg.is_read)

    # ✅ Test 31: Call-type message links to call object
    def test_call_message_links_call(self):
        from videocall.models import Call
        chat = self.Chat.objects.create(user1=self.user1, user2=self.user2)
        call = Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="linkroom", chat=chat, status="ended"
        )
        msg = self.Message.objects.create(
            chat=chat, sender=self.user1,
            content="", message_type="call", call=call
        )
        self.assertEqual(msg.call, call)


# ══════════════════════════════════════════════
# 9. USER MODEL TESTS
# ══════════════════════════════════════════════
class UserModelTest(TestCase):
    """
    Tests for the custom User model.
    """

    # ✅ Test 32: User is created successfully
    def test_create_user(self):
        user = create_user(email="model@example.com", name="ModelUser")
        self.assertEqual(user.email, "model@example.com")
        self.assertEqual(user.name, "ModelUser")

    # ✅ Test 33: Password is hashed (not stored as plain text)
    def test_password_is_hashed(self):
        user = create_user(email="hash@example.com", password="plainpassword")
        self.assertNotEqual(user.password, "plainpassword")
        self.assertTrue(user.check_password("plainpassword"))

    # ✅ Test 34: User str representation is readable
    def test_user_str(self):
        user = create_user(email="str@example.com", name="StrUser")
        # Should not raise an error
        self.assertIsInstance(str(user), str)

    # ❌ Test 35: Two users cannot share the same email
    def test_duplicate_email_raises_error(self):
        from django.db import IntegrityError
        create_user(email="dup@example.com")
        with self.assertRaises(Exception):
            create_user(email="dup@example.com")


# ══════════════════════════════════════════════
# 10. CALL MODEL TESTS
# ══════════════════════════════════════════════
class CallModelTest(TestCase):
    """
    Tests for the Call model fields and defaults.
    """

    def setUp(self):
        from videocall.models import Call
        from chat.models import Chat
        self.Call = Call
        self.user1 = create_user(email="cm1@example.com", name="CM1")
        self.user2 = create_user(email="cm2@example.com", name="CM2")
        self.chat = Chat.objects.create(user1=self.user1, user2=self.user2)

    # ✅ Test 36: Call is created with default status
    def test_call_default_status(self):
        call = self.Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="defaultroom", chat=self.chat
        )
        self.assertEqual(call.status, "pending")

    # ✅ Test 37: is_missed defaults to False
    def test_call_is_missed_default(self):
        call = self.Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="misseddefault", chat=self.chat
        )
        self.assertFalse(call.is_missed)

    # ✅ Test 38: duration defaults to 0
    def test_call_duration_default(self):
        call = self.Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="durationdefault", chat=self.chat
        )
        self.assertEqual(call.duration, 0)

    # ✅ Test 39: room_name must be unique
    def test_call_room_name_unique(self):
        self.Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="uniqueroom", chat=self.chat
        )
        with self.assertRaises(Exception):
            self.Call.objects.create(
                caller=self.user1, receiver=self.user2,
                room_name="uniqueroom", chat=self.chat
            )

    # ✅ Test 40: __str__ returns readable string
    def test_call_str(self):
        call = self.Call.objects.create(
            caller=self.user1, receiver=self.user2,
            room_name="strroom", chat=self.chat
        )
        self.assertIn("CM1", str(call))
        self.assertIn("CM2", str(call))