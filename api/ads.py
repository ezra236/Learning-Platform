# public.py
from decimal import Decimal
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone

from .models import Plan  # adjust import path if needed


def _attach_cors_headers(response, request):
    """
    CORS helper for public, unauthenticated GET endpoints.
    - Allows any origin by default (Access-Control-Allow-Origin: *).
    - Does NOT set Access-Control-Allow-Credentials.
    """
    origin = request.META.get("HTTP_ORIGIN")
    # If you want to echo allowed origin instead, you can check a whitelist here.
    if origin:
        # Echo the origin (useful if you restrict origins via settings)
        response["Access-Control-Allow-Origin"] = origin
        # Vary tells caches/origin proxies that response varies by Origin header
        response["Vary"] = "Origin"
    else:
        # Public fallback
        response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    # allow common headers for GET requests
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@require_GET
def plans_all(request):
    """
    Public API: return all *paid* plans (exclude free / trial plans) with features.
    GET /api/plans/
    """
    # only include plans with a positive price (exclude free/trial plans)
    qs = (
        Plan.objects
        .prefetch_related("features")
        .filter(price__gt=Decimal("0.00"))
        .order_by("exam_type", "duration_days")
    )

    data = []
    for p in qs:
        price_str = str(p.price) if p.price is not None else None

        feature_list = []
        for f in p.features.all():
            feature_list.append({
                "id": f.id,
                "name": f.name,
                "slug": f.slug,
                "description": f.description,
            })

        data.append({
            "id": p.id,
            "exam_type": p.exam_type,
            "exam_type_display": p.get_exam_type_display(),
            "duration_days": p.duration_days,
            "title": p.title,
            "price": price_str,
            "currency": p.currency,
            "features": feature_list,
            "active": p.active,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })

    response = JsonResponse(data, safe=False)
    return _attach_cors_headers(response, request)



import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import NewsletterSubscriber


@csrf_protect
def subscribe_newsletter(request):
    """
    POST JSON: { "email": "user@example.com" }
    Requires CSRF token (X-CSRFToken header). Returns JSON success or error.
    """
    # Handle preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(JsonResponse({"detail": "OK"}), request)

    if request.method != "POST":
        return _attach_cors_headers(JsonResponse({"detail": "Method not allowed"}, status=405), request)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return _attach_cors_headers(JsonResponse({"detail": "Invalid JSON"}, status=400), request)

    email = (payload.get("email") or "").strip()
    if not email:
        return _attach_cors_headers(JsonResponse({"detail": "Email is required"}, status=400), request)

    try:
        validate_email(email)
    except ValidationError:
        return _attach_cors_headers(JsonResponse({"detail": "Invalid email address"}, status=400), request)

    # Create or return existing
    obj, created = NewsletterSubscriber.objects.get_or_create(email__iexact=email, defaults={"email": email})
    # Note: get_or_create doesn't support case-insensitive lookup with email__iexact in the lookup portion,
    # so we implement a tolerant flow:
    if not created:
        # If object already exists, return non-error response
        return _attach_cors_headers(JsonResponse({"success": True, "message": "Email is already subscribed."}, status=200), request)

    return _attach_cors_headers(JsonResponse({"success": True, "message": "Subscription successful."}, status=201), request)
