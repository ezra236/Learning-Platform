import os
import json
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.shortcuts import get_object_or_404

import cloudinary
from cloudinary.utils import cloudinary_url

from .models import Evidence

def _attach_cors_headers_public(response, request):
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



def _cloudinary_url_from_field_name(field_name, **cloudinary_opts):
    """
    Given a stored Django ImageField name like "evidence/profiles/abcd1234.jpg",
    return a secure Cloudinary URL using cloudinary.utils.cloudinary_url.

    Returns None if field_name is falsy.
    """
    if not field_name:
        return None

    # split extension
    public_id, ext = os.path.splitext(field_name)
    fmt = ext.lstrip(".").lower() if ext else None

    # cloudinary_url expects public_id without the extension
    try:
        url, options = cloudinary_url(public_id, format=fmt, secure=True, **cloudinary_opts)
        return url
    except Exception:
        # best-effort fallback: if Cloudinary isn't configured or public_id invalid
        return None



def _cloudinary_url_from_field_name(field_name, **cloudinary_opts):
    """
    Given a stored Django ImageField name like "evidence/profiles/abcd1234.jpg",
    return a secure Cloudinary URL using cloudinary.utils.cloudinary_url.

    Returns None if field_name is falsy.
    """
    if not field_name:
        return None

    # split extension
    public_id, ext = os.path.splitext(field_name)
    fmt = ext.lstrip(".").lower() if ext else None

    # cloudinary_url expects public_id without the extension
    try:
        url, options = cloudinary_url(public_id, format=fmt, secure=True, **cloudinary_opts)
        return url
    except Exception:
        # best-effort fallback: if Cloudinary isn't configured or public_id invalid
        return None



@require_http_methods(["GET", "OPTIONS"])
def public_evidences_list_view(request):
    # handle preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers_public(HttpResponse(), request)

    # Optional: pagination params (page, page_size)
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))
    offset = (max(page, 1) - 1) * page_size
    limit = offset + page_size

    qs = Evidence.objects.all().order_by("-created_at")
    total = qs.count()
    items = qs[offset:limit]

    results = []
    for ev in items:
        results.append({
            "id": str(ev.id),
            "heading": ev.heading,
            "description": ev.description,
            "role": ev.role,
            "created_by": str(ev.created_by.id) if ev.created_by else None,
            "created_at": ev.created_at.isoformat(),
            "profile_url": _cloudinary_url_from_field_name(getattr(ev.profile_image, "name", None)),
            "evidence_url": _cloudinary_url_from_field_name(getattr(ev.evidence_image, "name", None)),
        })

    resp = JsonResponse({
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": results
    })
    # cache public images on CDN/browser for a short while (adjust TTL as needed)
    resp["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return _attach_cors_headers_public(resp, request)



@require_http_methods(["GET", "OPTIONS"])
def public_evidence_detail_view(request, uid):
    if request.method == "OPTIONS":
        return _attach_cors_headers_public(HttpResponse(), request)

    ev = get_object_or_404(Evidence, id=uid)

    data = {
        "id": str(ev.id),
        "heading": ev.heading,
        "description": ev.description,
        "role": ev.role,
        "created_by": str(ev.created_by.id) if ev.created_by else None,
        "created_at": ev.created_at.isoformat(),
        "profile_url": _cloudinary_url_from_field_name(getattr(ev.profile_image, "name", None)),
        "evidence_url": _cloudinary_url_from_field_name(getattr(ev.evidence_image, "name", None)),
    }

    resp = JsonResponse(data)
    resp["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return _attach_cors_headers_public(resp, request)






from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .models import Review
import json


def _attach_cors_headers(response, request):
    origin = request.META.get("HTTP_ORIGIN")
    if origin:
        response["Access-Control-Allow-Origin"] = origin
    else:
        response["Access-Control-Allow-Origin"] = getattr(settings, "CORS_ALLOW_ORIGIN", "*")
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
    return response


@ensure_csrf_cookie
def get_csrf_token(request):
    """Public endpoint to set a CSRF cookie for external clients like Next.js"""
    response = JsonResponse({"detail": "CSRF cookie set"})
    return _attach_cors_headers(response, request)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def submit_review(request):
    if request.method == "OPTIONS":
        # Preflight CORS
        response = JsonResponse({"detail": "CORS preflight"})
        return _attach_cors_headers(response, request)

    try:
        data = json.loads(request.body.decode("utf-8"))
        review_text = data.get("text", "").strip()

        if not review_text:
            response = JsonResponse({"error": "Review text required"}, status=400)
        else:
            Review.objects.create(text=review_text)
            response = JsonResponse({"success": True, "message": "Review submitted successfully"})

    except Exception as e:
        response = JsonResponse({"error": str(e)}, status=500)

    return _attach_cors_headers(response, request)





from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Plan, ExamType  # adjust import path if needed

@require_GET
def plans_for_ati_teas_7(request):
    """
    Public API: return paid plans for ATI TEAS 7 only (exclude free/trial plans).
    """
    qs = Plan.objects.filter(
        exam_type=ExamType.ATI_TEAS_7,
        price__gt=Decimal("0.00"),
    )
    data = []
    for p in qs:
        data.append({
            "id": p.id,
            "exam_type": p.exam_type,
            "duration_days": p.duration_days,
            "title": p.title,
            "price": str(p.price),          # Decimal -> string for JSON
            "currency": p.currency,
            "features": [{"id": f.id, "name": f.name, "slug": f.slug} for f in p.features.all()],
            "active": p.active,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })
    return JsonResponse(data, safe=False)


@require_GET
def plans_for_hesia2(request):
    """
    Public API: return paid plans for HESI A2 only (exclude free/trial plans).
    """
    qs = Plan.objects.filter(
        exam_type=ExamType.HESI_A2,
        price__gt=Decimal("0.00"),
    )
    data = []
    for p in qs:
        data.append({
            "id": p.id,
            "exam_type": p.exam_type,
            "duration_days": p.duration_days,
            "title": p.title,
            "price": str(p.price),          # Decimal -> string for JSON
            "currency": p.currency,
            "features": [{"id": f.id, "name": f.name, "slug": f.slug} for f in p.features.all()],
            "active": p.active,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })
    return JsonResponse(data, safe=False)
