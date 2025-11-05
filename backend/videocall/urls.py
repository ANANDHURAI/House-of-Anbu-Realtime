from django.urls import path
from .views import StartCallView

urlpatterns = [
    path('start/', StartCallView.as_view(), name='start_call'),
]
