from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegistrationDataSerializer, OTPVerifySerializer, LoginSerializer
from .models import UserAccount
from .utils import send_otp_to_email
from django.core.cache import cache
from rest_framework.permissions import AllowAny,IsAuthenticated


class RegisterAPIView(APIView):
    """
    Step 1 — Accept registration data and send OTP.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationDataSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            send_otp_to_email(email, email_subject="Registration")
            # Temporarily store registration details in cache
            cache.set(f"user_data_{email}", serializer.validated_data, timeout=120)
            return Response({"message": "OTP sent to your email!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPAPIView(APIView):
    """
    Step 2 — Verify OTP and create user.
    """

    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user_data = cache.get(f"user_data_{email}")

            if not user_data:
                return Response({"error": "User data expired. Please register again."}, status=status.HTTP_400_BAD_REQUEST)

            # Create user now that OTP is verified
            user = UserAccount.objects.create_user(**user_data)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Cleanup cache
            cache.delete(email)
            cache.delete(f"user_data_{email}")

            return Response({
                "message": "User created successfully!",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "email": user.email,
                    "name": user.name,
                    "phone": user.phone
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginRequestAPIView(APIView):
    """
    Step 1 of Login — Send OTP to registered email
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Check if user exists
            try:
                user = UserAccount.objects.get(email=email)
            except UserAccount.DoesNotExist:
                return Response({"error": "User not found. Please register first."}, status=status.HTTP_404_NOT_FOUND)
            
            # Send OTP
            send_otp_to_email(email, email_subject="Login")
            
            return Response({"message": "OTP sent to your email!"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginVerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]

    """
    Step 2 of Login — Verify OTP and return tokens
    """
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = UserAccount.objects.get(email=email)
            except UserAccount.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Cleanup OTP from cache
            cache.delete(email)
            
            return Response({
                "message": "Login successful!",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "email": user.email,
                    "name": user.name,
                    "phone": user.phone
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileAPIView(APIView):
    """
    Get current user profile (protected route)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "about_me": user.about_me,
            "profile_image": user.profile_image.url if user.profile_image else None
        }, status=status.HTTP_200_OK)
