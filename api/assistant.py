from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.contrib.auth import login, logout, authenticate
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import VerificationCode, User
import os
import json


@require_http_methods(["POST"])
def assistant_signin_view(request):
    """
    POST payload: { email, password, remember_me: true|false }
    On success: logs admin assistant in (creates session) and returns 200.
    """
    try:
        payload = json.loads(request.body)
        email = payload.get("email")
        password = payload.get("password")
        remember_me = bool(payload.get("remember_me", False))

        if not email or not password:
            return JsonResponse({"error": "email and password required"}, status=400)

        # authenticate - try using email kwarg and fallback to username param
        user = authenticate(request, email=email, password=password)
        if user is None:
            user = authenticate(request, username=email, password=password)

        if user is None:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        # ensure the user is an admin_assistant (or a Django superuser)
        if not (getattr(user, "is_admin_assistant", False) or user.is_superuser):
            return JsonResponse({"error": "Forbidden: not an admin assistant"}, status=403)

        # log them in
        login(request, user)

        # handle remember me: if remember_me false -> session expires when browser closes
        if remember_me:
            from django.conf import settings as djsettings
            request.session.set_expiry(getattr(djsettings, "SESSION_COOKIE_AGE", 1209600))
        else:
            request.session.set_expiry(0)

        # return some basic user info
        return JsonResponse({
            "detail": "Signed in",
            "user": {
                "email": user.email,
                "is_admin_assistant": getattr(user, "is_admin_assistant", False),
                "id": str(user.id),
            }
        })
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["POST", "GET"])
def assistant_signout_view(request):
    """
    GET or POST to sign out.
    """
    try:
        logout(request)
        return JsonResponse({"detail": "Signed out"})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["GET"])
def assistant_me_view(request):
    """
    Returns current authenticated admin assistant info.
    If not authenticated or not admin_assistant => 401 / 403 respectively.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    # Ensure user is an admin_assistant (or a Django superuser)
    if not (getattr(request.user, "is_admin_assistant", False) or request.user.is_superuser):
        return JsonResponse({"error": "Forbidden: not an admin assistant"}, status=403)

    user = request.user
    return JsonResponse({
        "email": user.email,
        "id": str(user.id),
        "is_admin_assistant": getattr(user, "is_admin_assistant", False),
        "email_verified": getattr(user, "email_verified", False),
    })
