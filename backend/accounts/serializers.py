from rest_framework import serializers
from .models import UserAccount
from django.core.cache import cache

class RegistrationDataSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)

    def validate_email(self, value):
        if UserAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value


    

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=4)

    def validate(self, attrs):
        email = attrs.get('email').lower().strip()
        otp = str(attrs.get('otp')).strip()
      
        stored_otp = cache.get(email)

        if not stored_otp:
            raise serializers.ValidationError({"error": "OTP expired or not found."})
            
        if otp != str(stored_otp).strip():
            raise serializers.ValidationError({"error": "Invalid OTP."})
            
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not UserAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email not registered.")
        return value