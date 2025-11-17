# api/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.contrib.auth import login
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import VerificationCode, User
import os
import json
from django.contrib.auth import login, logout, authenticate

@ensure_csrf_cookie
def csrf_token_view(request):
    # ensures csrftoken cookie is set; returns a small JSON resp
    return JsonResponse({"detail": "CSRF cookie set"})


@require_http_methods(["GET"])
def superadmin_exists_view(request):
    exists = User.objects.filter(role=User.Role.SUPERADMIN).exists() or User.objects.filter(is_superuser=True).exists()
    return JsonResponse({"exists": exists})


@require_http_methods(["POST"])
def send_verification_view(request):
    # expects JSON { email: "", password: "" }
    import json
    try:
        payload = json.loads(request.body)
        email = payload.get("email")
        password = payload.get("password")
        if not email or not password:
            return JsonResponse({"error": "email and password required"}, status=400)

        # If superadmin already exists, block
        if User.objects.filter(role=User.Role.SUPERADMIN).exists() or User.objects.filter(is_superuser=True).exists():
            return JsonResponse({"error": "Superadmin already exists"}, status=400)

        # create verification code
        vc = VerificationCode.create_code(email=email, lifetime_minutes=10)

        # render email template
        html_body = render_to_string("email/verification.html", {"code": vc.code, "email": email})
        subject = "Your Rushhourcamp verification code"

        # send email - attach bv.png inline
        connection = get_connection()
        message = EmailMultiAlternatives(
            subject=subject,
            body=f"Your verification code is {vc.code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
            connection=connection,
        )
        message.attach_alternative(html_body, "text/html")

        # attach inline image if exists
        image_path = os.path.join(settings.BASE_DIR, "api", "static", "images", "bv.png")
        if os.path.exists(image_path):
            from email.mime.image import MIMEImage
            with open(image_path, "rb") as f:
                img = MIMEImage(f.read())
                img.add_header("Content-ID", "<bv_logo>")
                img.add_header("Content-Disposition", "inline", filename="bv.png")
                message.attach(img)

        message.send()

        # Temporarily store password in session for create step (we won't store plaintext in DB)
        request.session["pending_superadmin"] = {"email": email, "password": password}
        # Could also store hashed or use a temporary DB record; session is easiest for same browser flow.

        return JsonResponse({"detail": "Verification code sent"})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["POST"])
def verify_code_view(request):
    import json
    try:
        payload = json.loads(request.body)
        email = payload.get("email")
        code = payload.get("code")
        if not email or not code:
            return JsonResponse({"error": "email and code required"}, status=400)

        # find matching non-expired code
        try:
            vc = VerificationCode.objects.filter(email=email, code=code).latest("created_at")
        except VerificationCode.DoesNotExist:
            return JsonResponse({"error": "Invalid code"}, status=400)

        if vc.is_expired():
            return JsonResponse({"error": "Code expired"}, status=400)

        # pull pending password from session
        pending = request.session.get("pending_superadmin")
        if not pending or pending.get("email") != email:
            return JsonResponse({"error": "No pending signup found. Please re-submit sign up."}, status=400)

        password = pending.get("password")
        if not password:
            return JsonResponse({"error": "No password found in session"}, status=400)

        # create the superadmin
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
        else:
            user = User.objects.create_superuser(email=email, password=password)

        # mark email verified
        user.email_verified = True
        user.save()

        # login the user (this will set the session cookie)
        login(request, user)

        # cleanup
        VerificationCode.objects.filter(email=email).delete()
        if "pending_superadmin" in request.session:
            del request.session["pending_superadmin"]

        return JsonResponse({"detail": "Superadmin created and logged in"})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)






# ----------------------
# Sign in / Sign out / Me
# ----------------------

@require_http_methods(["POST"])
def superadmin_signin_view(request):
    """
    POST payload: { email, password, remember_me: true|false }
    On success: logs user in (creates session) and returns 200.
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

        # ensure the user is a superadmin
        if not getattr(user, "is_superadmin", False):
            return JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)

        # log them in
        login(request, user)

        # handle remember me: if remember_me false -> session expires when browser closes
        if remember_me:
            # Use default cookie age (django default 2 weeks) or configure SESSION_COOKIE_AGE
            # If you want a custom duration, set request.session.set_expiry(seconds)
            # For clarity use Django's SESSION_COOKIE_AGE if provided
            from django.conf import settings as djsettings
            request.session.set_expiry(getattr(djsettings, "SESSION_COOKIE_AGE", 1209600))
        else:
            # expire on browser close
            request.session.set_expiry(0)

        # return some basic user info
        return JsonResponse({
            "detail": "Signed in",
            "user": {
                "email": user.email,
                "is_superadmin": user.is_superadmin,
                "id": str(user.id),
            }
        })
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["POST", "GET"])
def superadmin_signout_view(request):
    """
    GET or POST to sign out.
    """
    try:
        logout(request)
        return JsonResponse({"detail": "Signed out"})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["GET"])
def superadmin_me_view(request):
    """
    Returns current authenticated superadmin info.
    If not authenticated or not superadmin => 401 / 403 respectively.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    # Ensure user is a superadmin
    if not getattr(request.user, "is_superadmin", False):
        return JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)

    user = request.user
    return JsonResponse({
        "email": user.email,
        "id": str(user.id),
        "is_superadmin": user.is_superadmin,
        "email_verified": user.email_verified,
    })





import os
import json
from uuid import uuid4

from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.shortcuts import get_object_or_404
import cloudinary.uploader

from .models import Evidence, MAX_UPLOAD_SIZE, ALLOWED_IMAGE_EXTENSIONS


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


def _validate_uploaded_image(fileobj):
    """
    Validate uploaded file object (Incoming UploadedFile from request.FILES).
    Raises ValueError on validation failure.
    """
    name = getattr(fileobj, "name", "") or ""
    _, ext = os.path.splitext(name.lower())
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}")

    size = getattr(fileobj, "size", None)
    if size is not None and size > MAX_UPLOAD_SIZE:
        raise ValueError(f"File too large ({size} bytes). Max allowed is {MAX_UPLOAD_SIZE} bytes.")


@require_http_methods(["OPTIONS", "POST"])
def create_evidence_view(request):
    # preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    try:
        heading = request.POST.get("heading", "").strip()
        description = request.POST.get("description", "").strip()
        role = request.POST.get("role", "").strip()
        profile_file = request.FILES.get("profile_image")
        evidence_file = request.FILES.get("evidence_image")

        if not heading or not description or not role:
            resp = JsonResponse({"error": "heading, description and role are required"}, status=400)
            return _attach_cors_headers(resp, request)

        ev = Evidence(
            heading=heading,
            description=description,
            role=role,
            created_by=request.user
        )

        profile_url = None
        evidence_url = None
        uploaded_public_ids = []  # track for cleanup on error

        # ---- Upload profile image to Cloudinary (if provided) ----
        if profile_file:
            try:
                _validate_uploaded_image(profile_file)
                res = cloudinary.uploader.upload(
                    profile_file,
                    folder="evidence/profiles",
                    public_id=f"{uuid4().hex}_{os.path.splitext(profile_file.name)[0]}",
                    resource_type="image",
                )
                if not res or "public_id" not in res:
                    raise RuntimeError("Cloudinary did not return a public_id for profile image")
                public_id = res["public_id"]
                fmt = res.get("format", "jpg")
                # Store only the path/name in the DB field (no full URL)
                ev.profile_image.name = f"{public_id}.{fmt}"
                profile_url = res.get("secure_url") or res.get("url")
                uploaded_public_ids.append(public_id)
            except ValueError as val_err:
                return _attach_cors_headers(JsonResponse({"error": "Invalid profile image", "details": str(val_err)}, status=400), request)
            except Exception as e:
                # try best-effort cleanup if partial upload happened
                try:
                    if 'public_id' in locals():
                        cloudinary.uploader.destroy(public_id, resource_type="image")
                except Exception:
                    pass
                return _attach_cors_headers(JsonResponse({"error": "Failed to upload profile image", "details": str(e)}, status=500), request)

        # ---- Upload evidence image to Cloudinary (if provided) ----
        if evidence_file:
            try:
                _validate_uploaded_image(evidence_file)
                res = cloudinary.uploader.upload(
                    evidence_file,
                    folder="evidence/images",
                    public_id=f"{uuid4().hex}_{os.path.splitext(evidence_file.name)[0]}",
                    resource_type="image",
                )
                if not res or "public_id" not in res:
                    raise RuntimeError("Cloudinary did not return a public_id for evidence image")
                public_id = res["public_id"]
                fmt = res.get("format", "jpg")
                ev.evidence_image.name = f"{public_id}.{fmt}"
                evidence_url = res.get("secure_url") or res.get("url")
                uploaded_public_ids.append(public_id)
            except ValueError as val_err:
                # cleanup previously uploaded profile image
                for pid in uploaded_public_ids:
                    try:
                        cloudinary.uploader.destroy(pid, resource_type="image")
                    except Exception:
                        pass
                return _attach_cors_headers(JsonResponse({"error": "Invalid evidence image", "details": str(val_err)}, status=400), request)
            except Exception as e:
                for pid in uploaded_public_ids:
                    try:
                        cloudinary.uploader.destroy(pid, resource_type="image")
                    except Exception:
                        pass
                return _attach_cors_headers(JsonResponse({"error": "Failed to upload evidence image", "details": str(e)}, status=500), request)

        # validate model fields BUT skip ImageField validators (they expect storage)
        try:
            ev.full_clean(exclude=["profile_image", "evidence_image"])
        except Exception as e:
            # cleanup cloudinary uploads if model validation fails
            for pid in uploaded_public_ids:
                try:
                    cloudinary.uploader.destroy(pid, resource_type="image")
                except Exception:
                    pass
            return _attach_cors_headers(JsonResponse({"error": "Validation error", "details": str(e)}, status=400), request)

        ev.save()

        return _attach_cors_headers(JsonResponse({
            "detail": "Evidence saved",
            "id": str(ev.id),
            "profile_url": profile_url,
            "evidence_url": evidence_url,
            "profile_name": getattr(ev.profile_image, "name", None),
            "evidence_name": getattr(ev.evidence_image, "name", None),
            "storage_class": "cloudinary (external)",
        }, status=201), request)

    except Exception as exc:
        # best-effort cleanup of any uploaded cloudinary resources
        try:
            for pid in uploaded_public_ids:
                cloudinary.uploader.destroy(pid, resource_type="image")
        except Exception:
            pass
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)





@require_http_methods(["GET", "OPTIONS"])
def admin_assistants_list_view(request):
    # preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    if not getattr(request.user, "is_superadmin", False):
        resp = JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
        return _attach_cors_headers(resp, request)

    qs = User.objects.filter(role=User.Role.ADMIN_ASSISTANT).order_by("-date_joined")
    assistants = []
    for u in qs:
        assistants.append({
            "id": str(u.id),
            "email": u.email,
            "is_active": bool(u.is_active),
            "date_joined": u.date_joined.isoformat(),
            "email_verified": bool(u.email_verified),
        })

    # counts
    total = qs.count()
    active = qs.filter(is_active=True).count()
    inactive = total - active

    resp = JsonResponse({
        "assistants": assistants,
        "counts": {"total": total, "active": active, "inactive": inactive}
    })
    return _attach_cors_headers(resp, request)



@require_http_methods(["POST", "OPTIONS"])
def create_admin_assistant_view(request):
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    if not getattr(request.user, "is_superadmin", False):
        resp = JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
        return _attach_cors_headers(resp, request)

    try:
        # Accept JSON or form-encoded body
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = request.POST.dict()

        email = (payload.get("email") or "").strip()
        password = (payload.get("password") or "").strip()

        if not email or not password:
            resp = JsonResponse({"error": "email and password required"}, status=400)
            return _attach_cors_headers(resp, request)

        if User.objects.filter(email=email).exists():
            resp = JsonResponse({"error": "User with this email already exists"}, status=400)
            return _attach_cors_headers(resp, request)

        # create assistant
        user = User.objects.create_admin_assistant(email=email, password=password)
        # optionally mark email_verified False/True as you prefer
        user.email_verified = True
        user.save()

        resp = JsonResponse({
            "detail": "Admin assistant created",
            "assistant": {"id": str(user.id), "email": user.email, "is_active": user.is_active}
        }, status=201)
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        resp = JsonResponse({"error": str(exc)}, status=500)
        return _attach_cors_headers(resp, request)



@require_http_methods(["POST", "OPTIONS"])
def admin_assistant_activate_view(request, uid):
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    if not getattr(request.user, "is_superadmin", False):
        resp = JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
        return _attach_cors_headers(resp, request)

    try:
        u = get_object_or_404(User, id=uid, role=User.Role.ADMIN_ASSISTANT)
        u.is_active = True
        u.save()
        resp = JsonResponse({"detail": "Activated", "id": str(u.id)})
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        resp = JsonResponse({"error": str(exc)}, status=500)
        return _attach_cors_headers(resp, request)


@require_http_methods(["POST", "OPTIONS"])
def admin_assistant_deactivate_view(request, uid):
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    if not getattr(request.user, "is_superadmin", False):
        resp = JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
        return _attach_cors_headers(resp, request)

    try:
        u = get_object_or_404(User, id=uid, role=User.Role.ADMIN_ASSISTANT)
        u.is_active = False
        u.save()
        resp = JsonResponse({"detail": "Deactivated", "id": str(u.id)})
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        resp = JsonResponse({"error": str(exc)}, status=500)
        return _attach_cors_headers(resp, request)



@require_http_methods(["DELETE", "OPTIONS"])
def admin_assistant_delete_view(request, uid):
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        resp = JsonResponse({"error": "Not authenticated"}, status=401)
        return _attach_cors_headers(resp, request)

    if not getattr(request.user, "is_superadmin", False):
        resp = JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
        return _attach_cors_headers(resp, request)

    try:
        u = get_object_or_404(User, id=uid, role=User.Role.ADMIN_ASSISTANT)
        u.delete()
        resp = JsonResponse({"detail": "Deleted", "id": uid})
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        resp = JsonResponse({"error": str(exc)}, status=500)
        return _attach_cors_headers(resp, request)




from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Review

@require_http_methods(["GET", "OPTIONS"])
def reviews_list_view(request):
    """
    GET /api/reviews/
    - Returns JSON array of reviews: [{id, text, created_at}, ...]
    - Requires authenticated session and user.is_superadmin
    - Handles OPTIONS for CORS preflight via _attach_cors_headers
    """
    # Handle preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    # Authentication
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)

    # Authorization - must be superadmin
    if not getattr(request.user, "is_superadmin", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a superadmin"}, status=403), request)

    # Fetch reviews (ordered newest first)
    reviews_qs = Review.objects.order_by("-created_at").all()

    # Serialize to simple JSON-friendly list
    data = [
        {
            "id": r.id,
            "text": r.text,
            "created_at": (r.created_at.isoformat() if r.created_at is not None else None),
        }
        for r in reviews_qs
    ]

    return _attach_cors_headers(JsonResponse(data, safe=False), request)




import json
from decimal import Decimal, InvalidOperation
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404

from .models import Plan, Feature, ExamType, DURATION_CHOICES


# Helper: canonical exam order (the order you requested)
EXAM_ORDER = [
    ExamType.ATI_TEAS_7,
    ExamType.HESI_A2,
    ExamType.NCLEX,
    ExamType.NURSING_TEST_BANK,
    ExamType.EXIT_EXAM,
]


@require_http_methods(["GET", "OPTIONS", "POST"])
def plans_list_create_view(request):
    """
    GET /api/plans/  -> returns plans grouped by exam type in the canonical order
    POST /api/plans/ -> create a new plan (requires superadmin authenticated session)
    OPTIONS -> preflight
    """
    # preflight response
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if request.method == "GET":
        # public? your requirement: only accessible to authenticated superadmin
        if not request.user.is_authenticated:
            return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
        if not getattr(request.user, "is_superadmin", False):
            return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a superadmin"}, status=403), request)

        grouped = []
        for exam in EXAM_ORDER:
            plans_qs = Plan.objects.filter(exam_type=exam).order_by("duration_days")
            plans = []
            for p in plans_qs:
                plans.append({
                    "id": p.id,
                    "title": p.title,
                    "exam_type": p.exam_type,
                    "exam_display": p.get_exam_type_display(),
                    "duration_days": p.duration_days,
                    "price": str(p.price),
                    "currency": p.currency,
                    "features": [{"id": f.id, "name": f.name} for f in p.features.all()],
                    "active": bool(p.active),
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                })
            grouped.append({
                "exam_type": exam,
                "exam_display": dict(ExamType.choices).get(exam, exam),
                "plans": plans,
            })
        return _attach_cors_headers(JsonResponse({"exam_groups": grouped}, status=200), request)

    # POST -> create plan
    # require superadmin
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_superadmin", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a superadmin"}, status=403), request)

    try:
        payload = json.loads(request.body or "{}")
        exam_type = payload.get("exam_type")
        duration_days = int(payload.get("duration_days") or 0)
        price_raw = payload.get("price")
        currency = payload.get("currency", "USD").upper().strip()
        title = payload.get("title") or f"{duration_days} Days Access"
        feature_names = payload.get("features", [])  # expect list of strings (names) or list of ids
        active = bool(payload.get("active", False))

        # validate exam_type and duration
        if exam_type not in dict(ExamType.choices):
            return _attach_cors_headers(JsonResponse({"error": "Invalid exam_type"}, status=400), request)
        if duration_days not in dict(DURATION_CHOICES):
            return _attach_cors_headers(JsonResponse({"error": "Invalid duration_days (must be 30,60,90)"}, status=400), request)

        try:
            price = Decimal(str(price_raw))
            if price < 0:
                raise InvalidOperation()
        except Exception:
            return _attach_cors_headers(JsonResponse({"error": "Invalid price"}, status=400), request)

        # enforce uniqueness (exam_type, duration_days) as model does — return 409 if exists
        if Plan.objects.filter(exam_type=exam_type, duration_days=duration_days).exists():
            return _attach_cors_headers(JsonResponse({"error": "Plan for that exam_type and duration already exists"}, status=409), request)

        plan = Plan.objects.create(
            exam_type=exam_type,
            duration_days=duration_days,
            title=title,
            price=price,
            currency=currency,
            active=active,
        )

        # attach features: feature_names can be list of ids or names
        features_to_attach = []
        for f in feature_names:
            if isinstance(f, int):
                feat = Feature.objects.filter(pk=f).first()
                if feat:
                    features_to_attach.append(feat)
            else:
                # treat as name string
                name = str(f).strip()
                if not name:
                    continue
                feat, _ = Feature.objects.get_or_create(name=name)
                features_to_attach.append(feat)

        if features_to_attach:
            plan.features.set(features_to_attach)

        plan.save()

        result = {
            "id": plan.id,
            "title": plan.title,
            "exam_type": plan.exam_type,
            "duration_days": plan.duration_days,
            "price": str(plan.price),
            "currency": plan.currency,
            "features": [{"id": f.id, "name": f.name} for f in plan.features.all()],
            "active": plan.active,
            "created_at": plan.created_at.isoformat(),
        }
        return _attach_cors_headers(JsonResponse({"detail": "Plan created", "plan": result}, status=201), request)

    except Exception as exc:
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)



@require_http_methods(["OPTIONS", "PATCH", "DELETE"])
def plan_detail_view(request, plan_id):
    """
    PATCH /api/plans/<id>/  -> partial update. Accepts {"active": true/false, "price": "12.00", "title": "...", "features": [...]}
    DELETE /api/plans/<id>/ -> delete plan
    OPTIONS -> preflight
    """
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_superadmin", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a superadmin"}, status=403), request)

    plan = get_object_or_404(Plan, pk=plan_id)

    if request.method == "DELETE":
        plan.delete()
        return _attach_cors_headers(JsonResponse({"detail": "Plan deleted"}, status=200), request)

    # PATCH -> partial update
    try:
        payload = json.loads(request.body or "{}")
        changed = False

        if "active" in payload:
            plan.active = bool(payload.get("active"))
            changed = True

        if "price" in payload:
            try:
                price = Decimal(str(payload.get("price")))
                if price < 0:
                    raise InvalidOperation()
                plan.price = price
                changed = True
            except Exception:
                return _attach_cors_headers(JsonResponse({"error": "Invalid price format"}, status=400), request)

        if "title" in payload:
            plan.title = payload.get("title") or plan.title
            changed = True

        if "currency" in payload:
            plan.currency = (payload.get("currency") or plan.currency).upper().strip()
            changed = True

        if "features" in payload:
            feature_names = payload.get("features") or []
            features_to_attach = []
            for f in feature_names:
                if isinstance(f, int):
                    feat = Feature.objects.filter(pk=f).first()
                    if feat:
                        features_to_attach.append(feat)
                else:
                    name = str(f).strip()
                    if not name:
                        continue
                    feat, _ = Feature.objects.get_or_create(name=name)
                    features_to_attach.append(feat)
            plan.features.set(features_to_attach)
            changed = True

        if changed:
            plan.save()

        return _attach_cors_headers(JsonResponse({"detail": "Plan updated", "id": plan.id}, status=200), request)
    except Exception as exc:
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)







from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_GET
from django.utils import timezone
from django.db.models import Count

from .models import Campaign, Announcement

def _user_is_superadmin(user):
    # Your custom property exists on the model
    return user.is_authenticated and getattr(user, "is_superadmin", False)

@login_required
@require_GET
def campaigns_insights_view(request):
    if not _user_is_superadmin(request.user):
        return HttpResponseForbidden(JsonResponse({"detail": "Requires superadmin"}))

    qs = Campaign.objects.all().annotate(views_count=Count("views"))
    results = []
    for c in qs:
        results.append({
            "id": str(c.id),
            "heading": c.heading,
            "description": c.description,
            "format": c.format,
            "mediapath": c.mediapath,
            "public_id": c.public_id,
            "cloud_resource_type": c.cloud_resource_type,
            "is_active": c.is_active,
            "link": c.link,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if getattr(c, "updated_at", None) else None,
            "views_count": c.views_count or 0,
        })

    return JsonResponse({"results": results}, safe=False)


@login_required
@require_GET
def announcements_insights_view(request):
    if not _user_is_superadmin(request.user):
        return HttpResponseForbidden(JsonResponse({"detail": "Requires superadmin"}))

    qs = Announcement.objects.all().annotate(views_count=Count("seen_by"))
    results = []
    for a in qs:
        results.append({
            "id": str(a.id),
            "format": a.format,
            "mediapath": a.mediapath,
            "public_id": a.public_id,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "views_count": a.views_count or 0,
        })

    return JsonResponse({"results": results}, safe=False)














from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import ATI, Question
from .serializers import ATISerializer, QuestionSerializer
import cloudinary.uploader

class ATIListCreateAPIView(generics.ListCreateAPIView):
    queryset = ATI.objects.all()
    serializer_class = ATISerializer

class ATIGetAPIView(generics.RetrieveAPIView):
    queryset = ATI.objects.all()
    serializer_class = ATISerializer

class ATIGetAPIView(generics.RetrieveUpdateAPIView):
    """
    Supports GET, PUT and PATCH for an ATI instance.
    PATCH will update partial fields (e.g., completed).
    """
    queryset = ATI.objects.all()
    serializer_class = ATISerializer

class QuestionCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        import json

        # Build a plain dict of non-file fields from request.data
        data = {}
        # request.data includes both POST fields and the parsed data for multipart
        for key, val in request.data.items():
            # skip uploaded files here (we'll take files from request.FILES)
            if key == 'image':
                continue
            data[key] = val

        # If choices / specialchoices / special_correct_order are JSON strings, parse them
        for key in ('choices', 'specialchoices', 'special_correct_order'):
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except Exception:
                    # leave as-is and let serializer validation catch it
                    pass

        # handle image upload to Cloudinary (unchanged)
        img = request.FILES.get('image')
        if img:
            try:
                upload_result = cloudinary.uploader.upload(img)
                data['image_url'] = upload_result.get('secure_url')
            except Exception as e:
                return Response({'detail': 'Cloudinary upload failed', 'error': str(e)},
                                status=status.HTTP_400_BAD_REQUEST)

        serializer = QuestionSerializer(data=data)
        if serializer.is_valid():
            question = serializer.save()
            # persist image_url if set
            if data.get('image_url'):
                question.image_url = data['image_url']
                question.save()
            out = QuestionSerializer(question)
            return Response(out.data, status=status.HTTP_201_CREATED)
        # log errors to help debugging
        print('QuestionSerializer errors:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionListAPIView(generics.ListAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer


class QuestionRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    GET / PATCH for a single question.
    Accepts multipart/form-data (image file optional) and JSON string fields for nested arrays.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def patch(self, request, *args, **kwargs):
        # Build plain dict from request.data (exclude file objects)
        data = {}
        for key, val in request.data.items():
            if key == 'image':
                continue
            data[key] = val

        # parse JSON-ish fields if they were sent as strings
        for key in ('choices', 'specialchoices', 'special_correct_order'):
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except Exception:
                    pass

        # handle image upload replacement (optional)
        img = request.FILES.get('image')
        if img:
            try:
                upload_result = cloudinary.uploader.upload(img)
                data['image_url'] = upload_result.get('secure_url')
            except Exception as e:
                return Response({'detail': 'Cloudinary upload failed', 'error': str(e)},
                                status=status.HTTP_400_BAD_REQUEST)

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # if cloudinary set image_url, persist on model too
        if data.get('image_url'):
            instance.image_url = data['image_url']
            instance.save()
        return Response(serializer.data)






from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import HESI, HESIQuestion
from .serializers import HESISerializer, HESIQuestionSerializer
import cloudinary.uploader

class HESIListCreateAPIView(generics.ListCreateAPIView):
    queryset = HESI.objects.all()
    serializer_class = HESISerializer

class HESIGetAPIView(generics.RetrieveAPIView):
    queryset = HESI.objects.all()
    serializer_class = HESISerializer

class HESIGetAPIView(generics.RetrieveUpdateAPIView):
    """
    Supports GET, PUT and PATCH for an ATI instance.
    PATCH will update partial fields (e.g., completed).
    """
    queryset = HESI.objects.all()
    serializer_class = HESISerializer

class HESIQuestionCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        import json

        # Build a plain dict of non-file fields from request.data
        data = {}
        # request.data includes both POST fields and the parsed data for multipart
        for key, val in request.data.items():
            # skip uploaded files here (we'll take files from request.FILES)
            if key == 'image':
                continue
            data[key] = val

        # If choices / specialchoices / special_correct_order are JSON strings, parse them
        for key in ('choices', 'specialchoices', 'special_correct_order'):
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except Exception:
                    # leave as-is and let serializer validation catch it
                    pass

        # handle image upload to Cloudinary (unchanged)
        img = request.FILES.get('image')
        if img:
            try:
                upload_result = cloudinary.uploader.upload(img)
                data['image_url'] = upload_result.get('secure_url')
            except Exception as e:
                return Response({'detail': 'Cloudinary upload failed', 'error': str(e)},
                                status=status.HTTP_400_BAD_REQUEST)

        serializer = HESIQuestionSerializer(data=data)
        if serializer.is_valid():
            question = serializer.save()
            # persist image_url if set
            if data.get('image_url'):
                question.image_url = data['image_url']
                question.save()
            out = HESIQuestionSerializer(question)
            return Response(out.data, status=status.HTTP_201_CREATED)
        # log errors to help debugging
        print('QuestionSerializer errors:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HESIQuestionListAPIView(generics.ListAPIView):
    queryset = HESIQuestion.objects.all()
    serializer_class = HESIQuestionSerializer


class HESIQuestionRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    GET / PATCH for a single question.
    Accepts multipart/form-data (image file optional) and JSON string fields for nested arrays.
    """
    queryset = HESIQuestion.objects.all()
    serializer_class = HESIQuestionSerializer

    def patch(self, request, *args, **kwargs):
        # Build plain dict from request.data (exclude file objects)
        data = {}
        for key, val in request.data.items():
            if key == 'image':
                continue
            data[key] = val

        # parse JSON-ish fields if they were sent as strings
        for key in ('choices', 'specialchoices', 'special_correct_order'):
            if key in data and isinstance(data.get(key), str):
                try:
                    data[key] = json.loads(data[key])
                except Exception:
                    pass

        # handle image upload replacement (optional)
        img = request.FILES.get('image')
        if img:
            try:
                upload_result = cloudinary.uploader.upload(img)
                data['image_url'] = upload_result.get('secure_url')
            except Exception as e:
                return Response({'detail': 'Cloudinary upload failed', 'error': str(e)},
                                status=status.HTTP_400_BAD_REQUEST)

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # if cloudinary set image_url, persist on model too
        if data.get('image_url'):
            instance.image_url = data['image_url']
            instance.save()
        return Response(serializer.data)








# api/views.py
import uuid
from datetime import datetime, timezone as dt_timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotAllowed, HttpResponseServerError
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt, csrf_protect
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from  django.templatetags.static import static  
from django.db import transaction

from .models import Subscription



@require_http_methods(["GET"])
def subscriptions_list(request):
    """
    Returns JSON with:
      - counts: total, active_count, expired_count
      - subscriptions: list with id, user (email, first_name, last_name), plan info, start_date, finish_date, is_active, days_remaining
    """
    now = timezone.now()
    qs = Subscription.objects.select_related("user", "plan").order_by("-created_at")
    items = []
    active_count = 0
    expired_count = 0

    for s in qs:
        is_active = s.finish_date > now
        if is_active:
            active_count += 1
        else:
            expired_count += 1

        # username prefer full name else email
        user = s.user
        username = (user.first_name + " " + user.last_name).strip() or user.email

        # days remaining (if negative -> 0)
        delta = s.finish_date - now
        days_remaining = max(delta.days, 0)

        items.append({
            "id": str(s.id),
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": username,
            },
            "plan": {
                "id": s.plan.id if hasattr(s.plan, "id") else None,
                "exam_type": s.plan.get_exam_type_display() if hasattr(s.plan, "get_exam_type_display") else getattr(s.plan, "exam_type", None),
                "title": getattr(s.plan, "title", ""),
                "duration_days": getattr(s.plan, "duration_days", None),
                "price": str(getattr(s.plan, "price", "")),
                "currency": getattr(s.plan, "currency", "USD"),
            },
            "start_date": s.start_date.isoformat(),
            "finish_date": s.finish_date.isoformat(),
            "is_active": is_active,
            "days_remaining": days_remaining,
            "created_at": s.created_at.isoformat(),
        })

    return JsonResponse({
        "total": qs.count(),
        "active_count": active_count,
        "expired_count": expired_count,
        "subscriptions": items,
    }, safe=False)


@require_http_methods(["DELETE"])
@csrf_protect
def subscription_delete(request, id):
    """
    Sends notification email to subscription user, then deletes the subscription.
    Expects CSRF token cookie/header present (frontend will call /csrf/ first).
    """
    try:
        sub = get_object_or_404(Subscription, id=id)
    except Exception:
        return HttpResponseBadRequest("Subscription not found")

    # Build absolute logo URL using static files (ensure staticfiles is configured)
    try:
        logo_relative = static("images/bv.png")
    except Exception:
        # fallback to attempt building path manually - ensure STATIC_URL is served
        logo_relative = settings.STATIC_URL + "images/bv.png"

    logo_url = request.build_absolute_uri(logo_relative)

    context = {
        "site_name": "Rushhourcamp",
        "user_first_name": sub.user.first_name or "",
        "user_last_name": sub.user.last_name or "",
        "user_email": sub.user.email,
        "plan_title": getattr(sub.plan, "title", ""),
        "plan_exam_type": getattr(sub.plan, "exam_type", ""),
        "start_date": sub.start_date,
        "finish_date": sub.finish_date,
        "logo_url": logo_url,
    }

    # Attempt to render HTML template. Template should be located at: api/templates/email/subscription_cancelled.html
    try:
        html_body = render_to_string("email/subscription_cancelled.html", context)
    except Exception as e:
        # If render fails, create a simple fallback html
        html_body = f"""
        <html>
          <body>
            <p>Dear {context['user_first_name'] or context['user_email']},</p>
            <p>Your subscription ({context['plan_title']}) has been cancelled and is no longer active.</p>
            <p>Regards,<br/>{context['site_name']}</p>
            <img src="{logo_url}" alt="{context['site_name']} logo" style="max-width:120px"/>
          </body>
        </html>
        """

    subject = f"{context['site_name']} — Subscription cancelled"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@localhost")
    to_email = [sub.user.email]

    try:
        # Use EmailMultiAlternatives to send HTML content
        message = EmailMultiAlternatives(subject=subject, body=html_body, from_email=from_email, to=to_email)
        message.attach_alternative(html_body, "text/html")
        message.send()
    except Exception as e:
        return HttpResponseServerError(f"Failed to send email: {str(e)}")

    # After email successfully sent, delete the subscription
    try:
        with transaction.atomic():
            sub.delete()
    except Exception as e:
        return HttpResponseServerError(f"Failed to delete subscription: {str(e)}")

    return JsonResponse({"detail": "Subscription deleted and user notified"})








import json
from decimal import Decimal
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt  # not used; client will send CSRF cookie
from django.shortcuts import get_object_or_404
from .models import Plan, Feature
from django.core.exceptions import ValidationError

def _serialize_plan(plan):
    return {
        "id": str(plan.id),
        "exam_type": plan.exam_type,
        "exam_display": plan.get_exam_type_display(),
        "title": plan.title,
        "price": str(plan.price),
        "currency": plan.currency,
        "duration_days": plan.duration_days,
        "active": bool(plan.active),
        "features": [{"id": f.id, "name": f.name, "slug": f.slug} for f in plan.features.all()],
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
    }

@login_required
@require_http_methods(["GET", "PATCH"])
def plan_edit_api(request, plan_id):
    """
    GET: return plan details
    PATCH: update plan fields - accepts JSON body like:
      {
        "title": "30 Days Access",
        "price": "12.50",
        "currency": "USD",
        "duration_days": 30,
        "active": true,
        "features": ["Feature A", "Feature B"]  # array of strings (names)
      }
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        return JsonResponse({"detail": "Forbidden: superadmin only."}, status=403)

    plan = get_object_or_404(Plan, pk=plan_id)

    if request.method == "GET":
        return JsonResponse(_serialize_plan(plan))

    # PATCH
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    changed = False

    # Allowed fields to update
    if "title" in body:
        plan.title = body["title"] or plan.title
        changed = True

    if "price" in body:
        try:
            plan.price = Decimal(str(body["price"]))
            changed = True
        except Exception:
            return JsonResponse({"error": "Invalid price value."}, status=400)

    if "currency" in body:
        plan.currency = (body["currency"] or plan.currency).upper()
        changed = True

    if "duration_days" in body:
        try:
            dd = int(body["duration_days"])
            plan.duration_days = dd
            changed = True
        except Exception:
            return JsonResponse({"error": "Invalid duration_days."}, status=400)

    if "active" in body:
        plan.active = bool(body["active"])
        changed = True

    # Handle features: expect array of names (strings)
    if "features" in body:
        f_list = body.get("features") or []
        if not isinstance(f_list, list):
            return JsonResponse({"error": "features must be an array of names."}, status=400)

        # Create or get features by name; keep order
        new_features = []
        for name in f_list:
            nm = (name or "").strip()
            if not nm:
                continue
            feature, _ = Feature.objects.get_or_create(name=nm)
            new_features.append(feature)

        plan.features.set(new_features)
        changed = True

    if changed:
        try:
            plan.full_clean()
            plan.save()
        except ValidationError as e:
            return JsonResponse({"error": e.message_dict}, status=400)
        return JsonResponse(_serialize_plan(plan))
    else:
        return JsonResponse({"detail": "No changes detected."})













import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import ATI, HESI

# Use this exact function as requested:
@ensure_csrf_cookie
def csrf_token_view(request):
    # ensures csrftoken cookie is set; returns a small JSON resp
    return JsonResponse({"detail": "CSRF cookie set"})


# Helper to map type string -> model
VALID_TYPES = {
    "ati": ATI,
    "hesi": HESI,
}


def _get_model_for_type(type_str):
    if not type_str:
        return None
    return VALID_TYPES.get(type_str.lower())


@require_http_methods(["GET"])
def exams_list(request):
    """
    GET /api/exams/?type=ati|hesi
    Returns list of exams for given type.
    """
    type_str = request.GET.get("type")
    Model = _get_model_for_type(type_str)
    if Model is None:
        return HttpResponseBadRequest("Invalid or missing 'type' query parameter. Use ?type=ati or ?type=hesi")

    exams = Model.objects.all().order_by('-id')
    data = [
        {"id": str(e.id), "name": e.name, "isfree": getattr(e, "isfree", False), "completed": getattr(e, "completed", False)}
        for e in exams
    ]
    return JsonResponse(data, safe=False)


@require_http_methods(["DELETE"])
def exams_delete(request, pk):
    """
    DELETE /api/exams/<uuid:pk>/?type=ati|hesi
    Deletes the exam (cascade deletes related content via models).
    """
    type_str = request.GET.get("type")
    Model = _get_model_for_type(type_str)
    if Model is None:
        return HttpResponseBadRequest("Invalid or missing 'type' query parameter. Use ?type=ati or ?type=hesi")

    exam = get_object_or_404(Model, pk=pk)
    exam.delete()
    return JsonResponse({"detail": f"{type_str.upper()} exam deleted", "id": str(pk)})


@require_http_methods(["POST"])
def exams_set_free(request, pk):
    """
    POST /api/exams/<uuid:pk>/set_free/?type=ati|hesi
    Body (optional): {"isfree": true/false} (defaults to true if omitted)
    """
    type_str = request.GET.get("type")
    Model = _get_model_for_type(type_str)
    if Model is None:
        return HttpResponseBadRequest("Invalid or missing 'type' query parameter. Use ?type=ati or ?type=hesi")

    exam = get_object_or_404(Model, pk=pk)
    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON")

    isfree = payload.get("isfree", True)
    exam.isfree = bool(isfree)
    exam.save(update_fields=["isfree"])
    return JsonResponse({"detail": f"{type_str.upper()} exam updated", "id": str(pk), "isfree": exam.isfree})
