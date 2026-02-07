from django.urls import path
from .views import (
    RegisterAPIView, 
    VerifyOTPAPIView, 
    LoginRequestAPIView,
    LoginVerifyOTPAPIView,
    UserProfileAPIView,
    UserProfileUpdateAPIView
)
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    # Registration
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp'),
    
    # Login
    path('login/', LoginRequestAPIView.as_view(), name='login-request'),
    path('login/verify-otp/', LoginVerifyOTPAPIView.as_view(), name='login-verify'),
    
    # Token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Protected routes
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),
    path("profile/update/", UserProfileUpdateAPIView.as_view(), name="user-profile-update"),
]