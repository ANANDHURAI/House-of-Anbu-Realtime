from django.urls import path
from .views import StartCallView,CallHistoryView,UpdateCallStatusView

urlpatterns = [
    path('start/', StartCallView.as_view(), name='start_call'),
    path('call-history/', CallHistoryView.as_view(), name='call-history'),
    path('call/<int:call_id>/update/', UpdateCallStatusView.as_view(), name='update-call-status'),
]
