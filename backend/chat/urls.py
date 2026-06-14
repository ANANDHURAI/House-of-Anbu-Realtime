from django.urls import path
from .views import (
    SearchingView,      
    GetOrCreateChatView,
    ChatMessagesView,
    ChatListView,
    MarkMessagesAsReadView,
    ChatDetailView, 
    CreateRoomView,
    RoomListView,
    RoomMessagesView,
    AddRoomParticipantsView
)


urlpatterns = [
    path('search-user/',SearchingView.as_view() , name='search-user' ),
    path('get-or-create-chat/', GetOrCreateChatView.as_view(), name='get_or_create_chat'),
    path('<int:chat_id>/messages/', ChatMessagesView.as_view(), name='chat_messages'),
    path('chat-list/', ChatListView.as_view(), name='chat-list'),
    path('<int:chat_id>/mark-read/', MarkMessagesAsReadView.as_view(), name='mark_messages_read'),
    path('chat-details/<int:chat_id>/', ChatDetailView.as_view(), name='chat-detail'),
    path('create-room/', CreateRoomView.as_view(), name='create-room'),
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<int:room_id>/messages/', RoomMessagesView.as_view(), name='room_messages'),
    path('rooms/<int:room_id>/add-participants/', AddRoomParticipantsView.as_view(), name='add_room_participants'),
]

