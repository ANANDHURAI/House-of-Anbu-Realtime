from unittest.mock import patch
from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import UserAccount


def create_user(email, name="TestUser", phone="9876543210", password="testpass123"):
    return UserAccount.objects.create_user(email=email, name=name, phone=phone, password=password)


# ==========================================================
# 1. REGISTER TESTS
# ==========================================================
class RegisterTest(APITestCase):
    def setUp(self):
        self.url = '/auth/register/'

    @patch('accounts.views.send_otp_to_email')
    def test_register_valid_data_sends_otp(self, mock_send_otp):
        data = {"name": "John", "email": "john@example.com", "phone": "9876543210"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_otp.assert_called_once()

    def test_register_duplicate_email_fails(self):
        create_user(email="dup@example.com")
        data = {"name": "John", "email": "dup@example.com", "phone": "9876543210"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ==========================================================
# 2. VERIFY OTP TESTS
# ==========================================================
class VerifyOTPTest(APITestCase):
    def setUp(self):
        self.url = '/auth/verify-otp/'
        self.email = "newuser@example.com"
        # Simulate what RegisterAPIView already did in step 1:
        # cached the pending registration data...
        cache.set(f"user_data_{self.email}",
                   {"name": "New", "email": self.email, "phone": "9876543210"},
                   timeout=120)
        # ...and cached the OTP itself, under the plain email key
        # (matches OTPVerifySerializer.validate -> cache.get(email))
        cache.set(self.email, "1234", timeout=120)

    def test_correct_otp_creates_user_and_returns_tokens(self):
        response = self.client.post(self.url, {"email": self.email, "otp": "1234"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertTrue(UserAccount.objects.filter(email=self.email).exists())

    def test_wrong_otp_is_rejected(self):
        response = self.client.post(self.url, {"email": self.email, "otp": "0000"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ==========================================================
# 3. LOGIN TESTS
# ==========================================================
class LoginRequestTest(APITestCase):
    def setUp(self):
        self.url = '/auth/login/'
        self.user = create_user(email="loginuser@example.com")

    @patch('accounts.views.send_otp_to_email')
    def test_registered_user_can_request_login_otp(self, mock_send_otp):
        response = self.client.post(self.url, {"email": self.user.email}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unregistered_email_is_rejected(self):
        response = self.client.post(self.url, {"email": "ghost@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ==========================================================
# 4. PROFILE TESTS
# ==========================================================
class UserProfileTest(APITestCase):
    def setUp(self):
        self.user = create_user(email="profile@example.com", name="ProfileUser")
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_get_profile_returns_current_user(self):
        response = self.client.get('/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_profile_requires_authentication(self):
        self.client.credentials()  # strip the token
        response = self.client.get('/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ==========================================================
# 5. CHAT — SEARCH USER TESTS
# ==========================================================
class SearchingViewTest(APITestCase):
    def setUp(self):
        self.user_a = create_user(email="alice@example.com", name="Alice")
        self.user_b = create_user(email="bob@example.com", name="Bob")
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_search_finds_matching_user(self):
        response = self.client.post('/chat/search-user/', {"query": "Bob"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['name'], "Bob")

    def test_search_excludes_the_requesting_user(self):
        response = self.client.post('/chat/search-user/', {"query": "Alice"}, format="json")
        self.assertEqual(response.data['results'], [])
        

# ==========================================================
# 6. CHAT — GET OR CREATE CHAT TESTS
# ==========================================================
class GetOrCreateChatTest(APITestCase):
    def setUp(self):
        self.user_a = create_user(email="a@example.com", name="UserA")
        self.user_b = create_user(email="b@example.com", name="UserB")
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_cannot_chat_with_self(self):
        response = self.client.post('/chat/get-or-create-chat/', {"user_id": self.user_a.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creates_chat_between_two_users(self):
        response = self.client.post('/chat/get-or-create-chat/', {"user_id": self.user_b.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("chat_id", response.data)

    def test_calling_twice_returns_same_chat(self):
        first = self.client.post('/chat/get-or-create-chat/', {"user_id": self.user_b.id}, format="json")
        second = self.client.post('/chat/get-or-create-chat/', {"user_id": self.user_b.id}, format="json")
        self.assertEqual(first.data["chat_id"], second.data["chat_id"])


# ==========================================================
# 7. CHAT — CHAT LIST & MESSAGES TESTS
# ==========================================================
class ChatListAndMessagesTest(APITestCase):
    def setUp(self):
        from chat.models import Chat, Message
        self.user_a = create_user(email="a2@example.com", name="UserA")
        self.user_b = create_user(email="b2@example.com", name="UserB")
        self.chat = Chat.objects.create(user1=self.user_a, user2=self.user_b)
        Message.objects.create(chat=self.chat, sender=self.user_a, content="Hello Bob")
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_chat_list_shows_users_chats(self):
        response = self.client.get('/chat/chat-list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_chat_messages_returns_sent_message(self):
        response = self.client.get(f'/chat/{self.chat.id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['content'], "Hello Bob")


# ==========================================================
# 8. CHAT — MARK AS READ TEST
# ==========================================================
class MarkMessagesAsReadTest(APITestCase):
    def setUp(self):
        from chat.models import Chat, Message
        self.user_a = create_user(email="a3@example.com", name="UserA")
        self.user_b = create_user(email="b3@example.com", name="UserB")
        self.chat = Chat.objects.create(user1=self.user_a, user2=self.user_b)
        # message sent BY user_b, so user_a reading it should flip is_read
        self.msg = Message.objects.create(chat=self.chat, sender=self.user_b, content="Hi", is_read=False)
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_marks_other_users_messages_as_read(self):
        response = self.client.post(f'/chat/{self.chat.id}/mark-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.msg.refresh_from_db()
        self.assertTrue(self.msg.is_read)


# ==========================================================
# 9. CHAT — ROOM TESTS (mocking channel_layer)
# ==========================================================
class RoomTest(APITestCase):
    def setUp(self):
        self.user_a = create_user(email="a4@example.com", name="UserA")
        self.user_b = create_user(email="b4@example.com", name="UserB")
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_create_room(self):
        response = self.client.post('/chat/create-room/', {"name": "Study Group"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_create_duplicate_room_name(self):
        self.client.post('/chat/create-room/', {"name": "Study Group"}, format="json")
        response = self.client.post('/chat/create-room/', {"name": "Study Group"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_room_list_only_shows_rooms_user_joined(self):
        self.client.post('/chat/create-room/', {"name": "My Room"}, format="json")
        response = self.client.get('/chat/rooms/')
        self.assertEqual(len(response.data), 1)

    @patch('chat.views.get_channel_layer')
    def test_add_participants_requires_membership(self, mock_channel_layer):
        self.client.post('/chat/create-room/', {"name": "Locked Room"}, format="json")
        # switch auth to user_b, who never joined the room
        refresh = RefreshToken.for_user(self.user_b)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        from chat.models import Room
        room = Room.objects.get(name="Locked Room")
        response = self.client.post(f'/chat/rooms/{room.id}/add-participants/', {"user_ids": [self.user_b.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        


# ==========================================================
# 10. VIDEOCALL — START CALL TEST
# ==========================================================
class StartCallTest(APITestCase):
    def setUp(self):
        self.caller = create_user(email="caller@example.com", name="Caller")
        self.receiver = create_user(email="receiver@example.com", name="Receiver")
        refresh = RefreshToken.for_user(self.caller)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    @patch('videocall.views.get_channel_layer')
    def test_start_call_creates_call_and_chat(self, mock_channel_layer):
        response = self.client.post('/videocall/start/', {"receiver_id": self.receiver.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("room_name", response.data)

        from videocall.models import Call
        self.assertTrue(Call.objects.filter(caller=self.caller, receiver=self.receiver).exists())

    @patch('videocall.views.get_channel_layer')
    def test_start_call_with_invalid_receiver_fails(self, mock_channel_layer):
        response = self.client.post('/videocall/start/', {"receiver_id": 9999}, format="json")
        self.assertEqual(response.status_code, 404)


# ==========================================================
# 11. VIDEOCALL — UPDATE CALL STATUS TEST
# ==========================================================
class UpdateCallStatusTest(APITestCase):
    def setUp(self):
        from videocall.models import Call
        self.caller = create_user(email="c2@example.com", name="Caller")
        self.receiver = create_user(email="r2@example.com", name="Receiver")
        self.call = Call.objects.create(caller=self.caller, receiver=self.receiver, room_name="room123", status="ringing")
        refresh = RefreshToken.for_user(self.caller)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    @patch('videocall.views.get_channel_layer')
    def test_ending_call_calculates_duration(self, mock_channel_layer):
        response = self.client.post(f'/videocall/call/{self.call.id}/update/', {"status": "ended"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.call.refresh_from_db()
        self.assertEqual(self.call.status, "ended")

    def test_non_participant_cannot_update_call(self):
        outsider = create_user(email="outsider@example.com", name="Outsider")
        refresh = RefreshToken.for_user(outsider)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        response = self.client.post(f'/videocall/call/{self.call.id}/update/', {"status": "ended"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ==========================================================
# 12. VIDEOCALL — CALL HISTORY TEST
# ==========================================================
class CallHistoryTest(APITestCase):
    def setUp(self):
        from videocall.models import Call
        self.user_a = create_user(email="ha@example.com", name="UserA")
        self.user_b = create_user(email="hb@example.com", name="UserB")
        self.user_c = create_user(email="hc@example.com", name="UserC")
        Call.objects.create(caller=self.user_a, receiver=self.user_b, room_name="r1", status="ended")
        Call.objects.create(caller=self.user_c, receiver=self.user_b, room_name="r2", status="ended")  
        refresh = RefreshToken.for_user(self.user_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_history_only_shows_own_calls(self):
        response = self.client.get('/videocall/call-history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)