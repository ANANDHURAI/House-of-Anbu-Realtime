from django.urls import path
from .views import SearchingView


urlpatterns = [
    path('search-user/',SearchingView.as_view() , name='search-user' ),
]
