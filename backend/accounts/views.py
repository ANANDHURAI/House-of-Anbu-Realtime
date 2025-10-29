# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegistrationDataSerializer, OTPVerifySerializer
from .models import UserAccount
from .utils import send_otp_to_email
from django.core.cache import cache


class RegisterAPIView(APIView):
    """
    Step 1 — Accept registration data and send OTP.
    """
    def post(self, request):
        serializer = RegistrationDataSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            send_otp_to_email(email,email_subject="Registration" )
            # Temporarily store registration details in cache
            cache.set(f"user_data_{email}", serializer.validated_data, timeout=600)
            return Response({"message": "OTP sent to your email!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VerifyOTPAPIView(APIView):
    """
    Step 2 — Verify OTP and create user.
    """
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user_data = cache.get(f"user_data_{email}")

            if not user_data:
                return Response({"error": "User data expired. Please register again."}, status=status.HTTP_400_BAD_REQUEST)

            # Create user now that OTP is verified
            user = UserAccount.objects.create_user(**user_data)
            # Cleanup cache
            cache.delete(email)
            cache.delete(f"user_data_{email}")

            return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
