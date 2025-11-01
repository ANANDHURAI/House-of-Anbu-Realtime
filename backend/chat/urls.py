from django.urls import path
from .views import SearchingView,GetOrCreateChatView,ChatMessagesView,ChatListView


urlpatterns = [
    path('search-user/',SearchingView.as_view() , name='search-user' ),
    path('get-or-create-chat/', GetOrCreateChatView.as_view(), name='get_or_create_chat'),
    path('<int:chat_id>/messages/', ChatMessagesView.as_view(), name='chat_messages'),
    path('chat-list/', ChatListView.as_view(), name='chat-list'),
]
