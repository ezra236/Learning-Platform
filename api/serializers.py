# api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        # Basic duplication logic:
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            return value

        # If user exists and already verified -> can't register again
        if user.email_verified:
            raise serializers.ValidationError(_("A user with this email already exists."))
        # else allow password update for unverified user
        return value



