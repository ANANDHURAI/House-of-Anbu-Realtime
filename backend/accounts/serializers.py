from rest_framework import serializers
from .models import UserAccount
from django.core.cache import cache

class RegistrationDataSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True)
    about_me = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False)

    def validate_email(self, value):
        if UserAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=4)

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        stored_otp = cache.get(email)

        if not stored_otp:
            raise serializers.ValidationError("OTP expired or not found.")
        if otp != stored_otp:
            raise serializers.ValidationError("Invalid OTP.")
        return attrs
