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




#------------------ ATI EXAM CREATION----------------------------------
#----------------------------------------------------------------------------------

import json
import os
from uuid import uuid4

from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError

import cloudinary
import cloudinary.uploader

from .models import Exam, Question, Choice, create_question_with_choices

# Ensure cloudinary configured somewhere global (you provided config snippet in settings or startup)
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', settings.CLOUDINARY.get('cloud_name')),
    api_key=os.environ.get('CLOUDINARY_API_KEY', settings.CLOUDINARY.get('api_key')),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', settings.CLOUDINARY.get('api_secret')),
)


@require_http_methods(["POST"])
def create_exam_view(request):
    """
    POST JSON: { "name": "<exam name>", "total_questions": 5 }
    Rules:
      - If an incomplete exam exists, reject (must finish it before creating a new one).
      - total_questions must be >=1
    """
    try:
        payload = json.loads(request.body.decode())
        name = payload.get("name", "").strip()
        total_questions = int(payload.get("total_questions", 0))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not name:
        return JsonResponse({"error": "Exam name required"}, status=400)
    if total_questions < 1:
        return JsonResponse({"error": "total_questions must be >= 1"}, status=400)

    # Is there an active (incomplete) exam?
    if Exam.objects.filter(is_complete=False).exists():
        return JsonResponse({"error": "An incomplete exam already exists. Finish it before creating another."}, status=400)

    try:
        exam = Exam.objects.create(name=name, total_questions=total_questions)
        return JsonResponse({
            "detail": "Exam created",
            "exam": {
                "id": exam.id,
                "name": exam.name,
                "total_questions": exam.total_questions,
                "is_complete": exam.is_complete,
                "created_at": exam.created_at.isoformat(),
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def active_exam_view(request):
    """
    GET returns the current active (incomplete) exam or null.
    Response: { "exam": { id, name, total_questions, is_complete, added_questions_count } }
    """
    exam = Exam.objects.filter(is_complete=False).order_by('created_at').first()
    if not exam:
        return JsonResponse({"exam": None})
    return JsonResponse({
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "total_questions": exam.total_questions,
            "is_complete": exam.is_complete,
            "added_questions_count": exam.questions.count()
        }
    })


@require_http_methods(["POST"])
def upload_image_view(request):
    """
    POST multipart/form-data with 'file' => uploads to Cloudinary and returns { image_path: "<cloudinary_url>" }
    """
    file = request.FILES.get('file')
    if not file:
        return JsonResponse({"error": "No file provided"}, status=400)

    # You can validate file size/type here if needed.
    try:
        res = cloudinary.uploader.upload(file, folder="exams")
        url = res.get('secure_url') or res.get('url')
        return JsonResponse({"image_path": url})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["POST"])
def create_question_view(request):
    """
    POST JSON payload:
    {
      "exam_id": 1,
      "format": 1|2|3|4,
      "question_text": "...",
      "explanation": "...",
      "paragraph": "...",         # optional depending on format
      "image_path": "...",        # optional depending on format (cloudinary url)
      "choices": ["one", "two", ...],    # 2..6 strings created from individual inputs in UI
      "correct_choice_letter": "A"       # "A".."F" corresponds to 0..5
    }
    """
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    exam_id = payload.get("exam_id")
    fmt = payload.get("format")
    question_text = payload.get("question_text", "")
    explanation = payload.get("explanation", "")
    paragraph = payload.get("paragraph", "") or ''
    image_path = payload.get("image_path", "") or ''
    choices = payload.get("choices", [])
    correct_letter = payload.get("correct_choice_letter", None)

    if exam_id is None:
        return JsonResponse({"error": "exam_id required"}, status=400)
    exam = get_object_or_404(Exam, pk=exam_id)

    if exam.is_complete:
        return JsonResponse({"error": "Cannot add question to a completed exam."}, status=400)

    # Validate choices present as separate inputs (frontend will send array built from individual inputs)
    if not isinstance(choices, list) or len(choices) < 2 or len(choices) > 6:
        return JsonResponse({"error": "Provide between 2 and 6 choices as individual inputs."}, status=400)

    if not isinstance(correct_letter, str) or len(correct_letter) != 1:
        return JsonResponse({"error": "correct_choice_letter is required and must be a single character like 'A'."}, status=400)

    letter = correct_letter.upper()
    if letter < 'A' or ord(letter) >= ord('A') + len(choices):
        return JsonResponse({"error": "correct_choice_letter out of range for provided choices."}, status=400)

    correct_index = ord(letter) - ord('A')

    try:
        q = create_question_with_choices(
            exam=exam,
            fmt=int(fmt),
            question_text=question_text,
            explanation=explanation,
            choices_texts=choices,
            correct_index_zero_based=correct_index,
            paragraph=paragraph,
            image_path=image_path
        )
    except ValidationError as ve:
        return JsonResponse({"error": ve.message if hasattr(ve, 'message') else str(ve)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    # Return created question and its choices (with letters)
    choices_qs = q.choices.all().order_by('index')
    return JsonResponse({
        "detail": "Question created",
        "question": {
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": [
                {"letter": chr(ord('A') + (c.index - 1)), "text": c.text, "id": c.id}
                for c in choices_qs
            ],
            "correct_choice_letter": chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None
        },
        "exam": {
            "id": exam.id,
            "added_questions_count": exam.questions.count(),
            "total_questions": exam.total_questions
        }
    })


@require_http_methods(["POST"])
def mark_exam_complete_view(request):
    """
    POST JSON: { "exam_id": <id> }
    Marks exam complete only if number of added questions == declared total_questions.
    """
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    exam_id = payload.get("exam_id")
    if exam_id is None:
        return JsonResponse({"error": "exam_id required"}, status=400)

    exam = get_object_or_404(Exam, pk=exam_id)

    current_count = exam.questions.count()
    if current_count != exam.total_questions:
        return JsonResponse({"error": f"Cannot complete exam — added questions {current_count} != declared total {exam.total_questions}"}, status=400)

    exam.is_complete = True
    exam.save(update_fields=['is_complete'])
    return JsonResponse({"detail": "Exam marked complete", "exam_id": exam.id})


@require_http_methods(["GET"])
def exam_questions_view(request, exam_id):
    """
    GET: list questions and their choices for exam.
    """
    exam = get_object_or_404(Exam, pk=exam_id)
    data_q = []
    for q in exam.questions.all().order_by('order'):
        choices_list = [
            {"letter": chr(ord('A') + (c.index - 1)), "id": c.id, "text": c.text}
            for c in q.choices.all().order_by('index')
        ]
        data_q.append({
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": choices_list,
            "correct_choice_letter": chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None
        })
    return JsonResponse({"exam": {"id": exam.id, "name": exam.name}, "questions": data_q})




#-----------------------HESI EXAM CREATION-------------------------
#--------------------------------------------------------------------------------------

import json
import os

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError

import cloudinary
import cloudinary.uploader

from .models import (
    HesiExam,
    HesiQuestion,
    HesiChoice,
    create_hesi_question_with_choices,
)

# Cloudinary configuration (expects settings.CLOUDINARY or env vars)
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', settings.CLOUDINARY.get('cloud_name') if getattr(settings, 'CLOUDINARY', None) else None),
    api_key=os.environ.get('CLOUDINARY_API_KEY', settings.CLOUDINARY.get('api_key') if getattr(settings, 'CLOUDINARY', None) else None),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', settings.CLOUDINARY.get('api_secret') if getattr(settings, 'CLOUDINARY', None) else None),
)


@require_http_methods(["POST"])
def create_hesi_exam_view(request):
    """
    POST JSON: { "name": "<exam name>", "total_questions": 5 }
    Rules:
      - If an incomplete HesiExam exists, reject (must finish it before creating a new one).
      - total_questions must be >=1
    """
    try:
        payload = json.loads(request.body.decode())
        name = payload.get("name", "").strip()
        total_questions = int(payload.get("total_questions", 0))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not name:
        return JsonResponse({"error": "Exam name required"}, status=400)
    if total_questions < 1:
        return JsonResponse({"error": "total_questions must be >= 1"}, status=400)

    # Is there an active (incomplete) exam?
    if HesiExam.objects.filter(is_complete=False).exists():
        return JsonResponse({"error": "An incomplete exam already exists. Finish it before creating another."}, status=400)

    try:
        exam = HesiExam.objects.create(name=name, total_questions=total_questions)
        return JsonResponse({
            "detail": "Exam created",
            "exam": {
                "id": exam.id,
                "name": exam.name,
                "total_questions": exam.total_questions,
                "is_complete": exam.is_complete,
                "created_at": exam.created_at.isoformat(),
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def active_hesi_exam_view(request):
    """
    GET returns the current active (incomplete) HesiExam or null.
    Response: { "exam": { id, name, total_questions, is_complete, added_questions_count } }
    """
    exam = HesiExam.objects.filter(is_complete=False).order_by('created_at').first()
    if not exam:
        return JsonResponse({"exam": None})
    return JsonResponse({
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "total_questions": exam.total_questions,
            "is_complete": exam.is_complete,
            "added_questions_count": exam.questions.count()
        }
    })


@require_http_methods(["POST"])
def hesi_upload_image_view(request):
    """
    POST multipart/form-data with 'file' => uploads to Cloudinary and returns { image_path: "<cloudinary_url>" }
    """
    file = request.FILES.get('file')
    if not file:
        return JsonResponse({"error": "No file provided"}, status=400)

    try:
        res = cloudinary.uploader.upload(file, folder="hesi_exams")
        url = res.get('secure_url') or res.get('url')
        return JsonResponse({"image_path": url})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_http_methods(["POST"])
def create_hesi_question_view(request):
    """
    POST JSON payload:
    {
      "exam_id": 1,
      "format": 1|2|3|4,
      "question_text": "...",
      "explanation": "...",
      "paragraph": "...",         # optional depending on format
      "image_path": "...",        # optional depending on format (cloudinary url)
      "choices": ["one", "two", ...],    # 2..6 strings created from individual inputs in UI
      "correct_choice_letter": "A"       # "A".."F" corresponds to 0..5
    }
    """
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    exam_id = payload.get("exam_id")
    fmt = payload.get("format")
    question_text = payload.get("question_text", "")
    explanation = payload.get("explanation", "")
    paragraph = payload.get("paragraph", "") or ''
    image_path = payload.get("image_path", "") or ''
    choices = payload.get("choices", [])
    correct_letter = payload.get("correct_choice_letter", None)

    if exam_id is None:
        return JsonResponse({"error": "exam_id required"}, status=400)
    exam = get_object_or_404(HesiExam, pk=exam_id)

    if exam.is_complete:
        return JsonResponse({"error": "Cannot add question to a completed exam."}, status=400)

    # Validate choices present as separate inputs (frontend will send array built from individual inputs)
    if not isinstance(choices, list) or len(choices) < 2 or len(choices) > 6:
        return JsonResponse({"error": "Provide between 2 and 6 choices as individual inputs."}, status=400)

    if not isinstance(correct_letter, str) or len(correct_letter) != 1:
        return JsonResponse({"error": "correct_choice_letter is required and must be a single character like 'A'."}, status=400)

    letter = correct_letter.upper()
    if letter < 'A' or ord(letter) >= ord('A') + len(choices):
        return JsonResponse({"error": "correct_choice_letter out of range for provided choices."}, status=400)

    correct_index = ord(letter) - ord('A')

    try:
        q = create_hesi_question_with_choices(
            exam=exam,
            fmt=int(fmt),
            question_text=question_text,
            explanation=explanation,
            choices_texts=choices,
            correct_index_zero_based=correct_index,
            paragraph=paragraph,
            image_path=image_path
        )
    except ValidationError as ve:
        return JsonResponse({"error": ve.message if hasattr(ve, 'message') else str(ve)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    choices_qs = q.choices.all().order_by('index')
    return JsonResponse({
        "detail": "Question created",
        "question": {
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": [
                {"letter": chr(ord('A') + (c.index - 1)), "text": c.text, "id": c.id}
                for c in choices_qs
            ],
            "correct_choice_letter": chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None
        },
        "exam": {
            "id": exam.id,
            "added_questions_count": exam.questions.count(),
            "total_questions": exam.total_questions
        }
    })


@require_http_methods(["POST"])
def mark_hesi_exam_complete_view(request):
    """
    POST JSON: { "exam_id": <id> }
    Marks exam complete only if number of added questions == declared total_questions.
    """
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    exam_id = payload.get("exam_id")
    if exam_id is None:
        return JsonResponse({"error": "exam_id required"}, status=400)

    exam = get_object_or_404(HesiExam, pk=exam_id)

    current_count = exam.questions.count()
    if current_count != exam.total_questions:
        return JsonResponse({"error": f"Cannot complete exam — added questions {current_count} != declared total {exam.total_questions}"}, status=400)

    exam.is_complete = True
    exam.save(update_fields=['is_complete'])
    return JsonResponse({"detail": "Exam marked complete", "exam_id": exam.id})


@require_http_methods(["GET"])
def hesi_exam_questions_view(request, exam_id):
    """
    GET: list HesiQuestion and their HesiChoices for exam.
    """
    exam = get_object_or_404(HesiExam, pk=exam_id)
    data_q = []
    for q in exam.questions.all().order_by('order'):
        choices_list = [
            {"letter": chr(ord('A') + (c.index - 1)), "id": c.id, "text": c.text}
            for c in q.choices.all().order_by('index')
        ]
        data_q.append({
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": choices_list,
            "correct_choice_letter": chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None
        })
    return JsonResponse({"exam": {"id": exam.id, "name": exam.name}, "questions": data_q})






#---------------------EDIT ATI EXAM---------------------------------
#-----------------------------------------------------------------------------

from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import JsonResponse
import cloudinary.uploader
import re

# Helper: ensure admin (session) user
def _require_admin(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    if not (getattr(request.user, "is_superadmin", False) or request.user.is_superuser):
        return JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
    return None

# Helper: extract Cloudinary public_id from a Cloudinary URL (best-effort)
def _extract_cloudinary_public_id(url):
    """
    Example Cloudinary URL:
      https://res.cloudinary.com/<cloud_name>/image/upload/v1620000000/folder/name.jpg
    We will extract everything after '/upload/' then strip version 'v12345/' and extension.
    Returns something like 'folder/name' which is the public_id usable by uploader.destroy.
    Best-effort: returns None if not parseable.
    """
    if not url or not isinstance(url, str):
        return None
    try:
        # Find '/upload/' position
        m = re.search(r'/upload/(?:v\d+/)?(.+)$', url)
        if not m:
            return None
        after = m.group(1)
        # remove file extension if present (.jpg, .png, .webp, etc.)
        public_id = re.sub(r'\.[a-zA-Z0-9]+(\?.*)?$', '', after)
        return public_id
    except Exception:
        return None


# GET /api/exams/  -> list all exams (for dropdown)
@require_http_methods(["GET"])
def list_exams_view(request):
    # admin-only
    err = _require_admin(request)
    if err: 
        return err

    exams = Exam.objects.all().order_by('-created_at')
    data = []
    for e in exams:
        data.append({
            "id": e.id,
            "name": e.name,
            "is_complete": e.is_complete,
            "total_questions": e.total_questions,
            "added_questions_count": e.questions.count(),
            "created_at": e.created_at.isoformat()
        })
    resp = JsonResponse({"exams": data})
    return _attach_cors_headers(resp, request)


# GET /api/exams/<int:exam_id>/full/ -> full exam + ordered questions + choices
@require_http_methods(["GET"])
def get_exam_full_view(request, exam_id):
    err = _require_admin(request)
    if err:
        return err

    exam = get_object_or_404(Exam, pk=exam_id)
    questions = []
    for q in exam.questions.all().order_by('order'):
        choices = [
            {"letter": chr(ord('A') + (c.index - 1)), "id": c.id, "text": c.text}
            for c in q.choices.all().order_by('index')
        ]
        questions.append({
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": choices,
            "correct_choice_letter": (chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None)
        })

    resp = JsonResponse({
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "is_complete": exam.is_complete,
            "total_questions": exam.total_questions,
            "added_questions_count": exam.questions.count(),
            "created_at": exam.created_at.isoformat(),
        },
        "questions": questions
    })
    return _attach_cors_headers(resp, request)


# PUT /api/exams/<int:exam_id>/update/ -> update exam fields (name, total_questions)
@require_http_methods(["PUT"])
def update_exam_view(request, exam_id):
    err = _require_admin(request)
    if err:
        return err

    exam = get_object_or_404(Exam, pk=exam_id)
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = payload.get("name")
    total_questions = payload.get("total_questions")

    if name is not None:
        name = str(name).strip()
        if not name:
            return JsonResponse({"error": "name cannot be empty"}, status=400)
        # enforce unique exam name
        if Exam.objects.exclude(pk=exam.pk).filter(name=name).exists():
            return JsonResponse({"error": "Exam name already exists"}, status=400)
        exam.name = name

    if total_questions is not None:
        try:
            tq = int(total_questions)
            if tq < 1:
                return JsonResponse({"error": "total_questions must be >= 1"}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid total_questions"}, status=400)
        # It's allowed to change declared total_questions. If there are already more questions than tq, block.
        if exam.questions.count() > tq:
            return JsonResponse({"error": "Cannot set total_questions lower than already added questions"}, status=400)
        exam.total_questions = tq

    exam.save()
    resp = JsonResponse({"detail": "Exam updated", "exam": {
        "id": exam.id,
        "name": exam.name,
        "total_questions": exam.total_questions,
        "is_complete": exam.is_complete,
        "added_questions_count": exam.questions.count()
    }})
    return _attach_cors_headers(resp, request)


# PUT /api/questions/<int:question_id>/update/ -> update question + choices + correct choice
@require_http_methods(["PUT"])
def update_question_view(request, question_id):
    err = _require_admin(request)
    if err:
        return err

    q = get_object_or_404(Question, pk=question_id)
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Updatable fields: format, question_text, explanation, paragraph, image_path (string)
    fmt = payload.get("format")
    question_text = payload.get("question_text")
    explanation = payload.get("explanation")
    paragraph = payload.get("paragraph")
    image_path = payload.get("image_path")  # if they supply a new url string (alternatively use replace-image endpoint)
    choices = payload.get("choices")  # array of strings
    correct_letter = payload.get("correct_choice_letter")  # e.g. "A"

    # Validate basic
    if fmt is not None:
        try:
            fmt = int(fmt)
            if fmt not in (1,2,3,4):
                return JsonResponse({"error": "Invalid format"}, status=400)
            q.format = fmt
        except Exception:
            return JsonResponse({"error": "Invalid format value"}, status=400)

    if question_text is not None:
        q.question_text = question_text

    if explanation is not None:
        q.explanation = explanation

    if paragraph is not None:
        q.paragraph = paragraph

    if image_path is not None:
        q.image_path = image_path

    # Validate format-specific fields via q.full_clean() before altering choices
    try:
        q.full_clean()
    except ValidationError as ve:
        return JsonResponse({"error": ve.message_dict if hasattr(ve, 'message_dict') else str(ve)}, status=400)

    # Update choices atomically: remove old choices and create new ones
    if choices is not None:
        if not isinstance(choices, list) or len(choices) < 2 or len(choices) > 6:
            return JsonResponse({"error": "Provide between 2 and 6 choices as individual strings"}, status=400)

        # Clear any existing correct_choice to avoid PROTECT blocking deletions
        q.correct_choice = None
        q.save(update_fields=['correct_choice'])

        # Delete existing choices
        q.choices.all().delete()

        # Create new choices with indices 1..N
        new_choice_objs = []
        for idx, txt in enumerate(choices, start=1):
            c = Choice(question=q, text=txt, index=idx)
            try:
                c.full_clean()
            except ValidationError as ve:
                return JsonResponse({"error": f"Invalid choice at index {idx}: {ve}"}, status=400)
            c.save()
            new_choice_objs.append(c)

        # Set correct_choice if provided
        if correct_letter is not None:
            if not isinstance(correct_letter, str) or len(correct_letter) != 1:
                return JsonResponse({"error": "correct_choice_letter must be a single letter like 'A'."}, status=400)
            letter = correct_letter.upper()
            idx0 = ord(letter) - ord('A')
            if idx0 < 0 or idx0 >= len(new_choice_objs):
                return JsonResponse({"error": "correct_choice_letter out of range for provided choices."}, status=400)
            q.correct_choice = new_choice_objs[idx0]
        else:
            # If not provided, clear correct_choice
            q.correct_choice = None

    # Final validation & save
    try:
        q.full_clean()
        q.save()
    except ValidationError as ve:
        return JsonResponse({"error": ve.message_dict if hasattr(ve, 'message_dict') else str(ve)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    # Return updated question
    choices_qs = q.choices.all().order_by('index')
    resp = JsonResponse({
        "detail": "Question updated",
        "question": {
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": [
                {"letter": chr(ord('A') + (c.index - 1)), "text": c.text, "id": c.id}
                for c in choices_qs
            ],
            "correct_choice_letter": (chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None)
        }
    })
    return _attach_cors_headers(resp, request)


# POST /api/questions/<int:question_id>/replace-image/  -> multipart file upload: replace image in cloudinary and update question.image_path
@require_http_methods(["POST"])
def replace_question_image_view(request, question_id):
    err = _require_admin(request)
    if err:
        return err

    q = get_object_or_404(Question, pk=question_id)

    # file must be provided
    file = request.FILES.get('file')
    if not file:
        return JsonResponse({"error": "No file provided"}, status=400)

    try:
        # Upload new file
        res = cloudinary.uploader.upload(file, folder="exams")
        new_url = res.get('secure_url') or res.get('url')
        # try to destroy previous image if exists
        old_path = q.image_path
        if old_path:
            public_id = _extract_cloudinary_public_id(old_path)
            if public_id:
                try:
                    cloudinary.uploader.destroy(public_id, invalidate=True)
                except Exception:
                    # don't fail on destroy - just log; return success with note
                    pass

        # Update question path
        q.image_path = new_url
        q.save(update_fields=['image_path'])
        resp = JsonResponse({"detail": "Image replaced", "image_path": new_url})
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)




#----------------------EDIT HESI A2 EXAM-----------------------
#------------------------------------------------------------------------------

import json
import re

from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import JsonResponse
import cloudinary.uploader

from .models import HesiExam, HesiQuestion, HesiChoice

# Helper: ensure admin (session) user
def _require_admin(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    if not (getattr(request.user, "is_superadmin", False) or request.user.is_superuser):
        return JsonResponse({"error": "Forbidden: not a superadmin"}, status=403)
    return None

# Helper: extract Cloudinary public_id from a Cloudinary URL (best-effort)
def _extract_cloudinary_public_id(url):
    """
    Example Cloudinary URL:
      https://res.cloudinary.com/<cloud_name>/image/upload/v1620000000/folder/name.jpg
    We will extract everything after '/upload/' then strip version 'v12345/' and extension.
    Returns something like 'folder/name' which is the public_id usable by uploader.destroy.
    Best-effort: returns None if not parseable.
    """
    if not url or not isinstance(url, str):
        return None
    try:
        m = re.search(r'/upload/(?:v\d+/)?(.+)$', url)
        if not m:
            return None
        after = m.group(1)
        public_id = re.sub(r'\.[a-zA-Z0-9]+(\?.*)?$', '', after)
        return public_id
    except Exception:
        return None

# Helper: attach simple CORS headers if Origin present (used in your existing ATI code)
def _attach_cors_headers(response, request):
    origin = request.META.get('HTTP_ORIGIN')
    if origin:
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
    return response


# GET /hesi/examslist/  -> list all Hesi exams (admin only)
@require_http_methods(["GET"])
def hesi_list_exams_view(request):
    err = _require_admin(request)
    if err:
        return err

    exams = HesiExam.objects.all().order_by('-created_at')
    data = []
    for e in exams:
        data.append({
            "id": e.id,
            "name": e.name,
            "is_complete": e.is_complete,
            "total_questions": e.total_questions,
            "added_questions_count": e.questions.count(),
            "created_at": e.created_at.isoformat()
        })
    resp = JsonResponse({"exams": data})
    return _attach_cors_headers(resp, request)


# GET /hesi/examslist/<int:exam_id>/full/ -> full Hesi exam + ordered questions + choices (admin only)
@require_http_methods(["GET"])
def hesi_get_exam_full_view(request, exam_id):
    err = _require_admin(request)
    if err:
        return err

    exam = get_object_or_404(HesiExam, pk=exam_id)
    questions = []
    for q in exam.questions.all().order_by('order'):
        choices = [
            {"letter": chr(ord('A') + (c.index - 1)), "id": c.id, "text": c.text}
            for c in q.choices.all().order_by('index')
        ]
        questions.append({
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": choices,
            "correct_choice_letter": (chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None)
        })

    resp = JsonResponse({
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "is_complete": exam.is_complete,
            "total_questions": exam.total_questions,
            "added_questions_count": exam.questions.count(),
            "created_at": exam.created_at.isoformat(),
        },
        "questions": questions
    })
    return _attach_cors_headers(resp, request)


# PUT /hesi/examslist/<int:exam_id>/update/ -> update HesiExam fields (name, total_questions) (admin only)
@require_http_methods(["PUT"])
def hesi_update_exam_view(request, exam_id):
    err = _require_admin(request)
    if err:
        return err

    exam = get_object_or_404(HesiExam, pk=exam_id)
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = payload.get("name")
    total_questions = payload.get("total_questions")

    if name is not None:
        name = str(name).strip()
        if not name:
            return JsonResponse({"error": "name cannot be empty"}, status=400)
        # enforce unique exam name
        if HesiExam.objects.exclude(pk=exam.pk).filter(name=name).exists():
            return JsonResponse({"error": "Exam name already exists"}, status=400)
        exam.name = name

    if total_questions is not None:
        try:
            tq = int(total_questions)
            if tq < 1:
                return JsonResponse({"error": "total_questions must be >= 1"}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid total_questions"}, status=400)
        # Block if there are already more questions than the new total
        if exam.questions.count() > tq:
            return JsonResponse({"error": "Cannot set total_questions lower than already added questions"}, status=400)
        exam.total_questions = tq

    exam.save()
    resp = JsonResponse({"detail": "Exam updated", "exam": {
        "id": exam.id,
        "name": exam.name,
        "total_questions": exam.total_questions,
        "is_complete": exam.is_complete,
        "added_questions_count": exam.questions.count()
    }})
    return _attach_cors_headers(resp, request)


# PUT /hesi/questions/<int:question_id>/update/ -> update HesiQuestion + HesiChoices + correct choice (admin only)
@require_http_methods(["PUT"])
def hesi_update_question_view(request, question_id):
    err = _require_admin(request)
    if err:
        return err

    q = get_object_or_404(HesiQuestion, pk=question_id)
    try:
        payload = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    fmt = payload.get("format")
    question_text = payload.get("question_text")
    explanation = payload.get("explanation")
    paragraph = payload.get("paragraph")
    image_path = payload.get("image_path")
    choices = payload.get("choices")
    correct_letter = payload.get("correct_choice_letter")

    if fmt is not None:
        try:
            fmt = int(fmt)
            if fmt not in (1, 2, 3, 4):
                return JsonResponse({"error": "Invalid format"}, status=400)
            q.format = fmt
        except Exception:
            return JsonResponse({"error": "Invalid format value"}, status=400)

    if question_text is not None:
        q.question_text = question_text

    if explanation is not None:
        q.explanation = explanation

    if paragraph is not None:
        q.paragraph = paragraph

    if image_path is not None:
        q.image_path = image_path

    # Run format-specific validation before touching choices
    try:
        q.full_clean()
    except ValidationError as ve:
        return JsonResponse({"error": ve.message_dict if hasattr(ve, 'message_dict') else str(ve)}, status=400)

    # Update choices atomically: delete existing and create new ones
    if choices is not None:
        if not isinstance(choices, list) or len(choices) < 2 or len(choices) > 6:
            return JsonResponse({"error": "Provide between 2 and 6 choices as individual strings"}, status=400)

        q.correct_choice = None
        q.save(update_fields=['correct_choice'])

        q.choices.all().delete()

        new_choice_objs = []
        for idx, txt in enumerate(choices, start=1):
            c = HesiChoice(question=q, text=txt, index=idx)
            try:
                c.full_clean()
            except ValidationError as ve:
                return JsonResponse({"error": f"Invalid choice at index {idx}: {ve}"}, status=400)
            c.save()
            new_choice_objs.append(c)

        if correct_letter is not None:
            if not isinstance(correct_letter, str) or len(correct_letter) != 1:
                return JsonResponse({"error": "correct_choice_letter must be a single letter like 'A'."}, status=400)
            letter = correct_letter.upper()
            idx0 = ord(letter) - ord('A')
            if idx0 < 0 or idx0 >= len(new_choice_objs):
                return JsonResponse({"error": "correct_choice_letter out of range for provided choices."}, status=400)
            q.correct_choice = new_choice_objs[idx0]
        else:
            q.correct_choice = None

    # Final validation & save
    try:
        q.full_clean()
        q.save()
    except ValidationError as ve:
        return JsonResponse({"error": ve.message_dict if hasattr(ve, 'message_dict') else str(ve)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    choices_qs = q.choices.all().order_by('index')
    resp = JsonResponse({
        "detail": "Question updated",
        "question": {
            "id": q.id,
            "order": q.order,
            "format": q.format,
            "paragraph": q.paragraph,
            "image_path": q.image_path,
            "question_text": q.question_text,
            "explanation": q.explanation,
            "choices": [
                {"letter": chr(ord('A') + (c.index - 1)), "text": c.text, "id": c.id}
                for c in choices_qs
            ],
            "correct_choice_letter": (chr(ord('A') + (q.correct_choice.index - 1)) if q.correct_choice else None)
        }
    })
    return _attach_cors_headers(resp, request)


# POST /hesi/questions/<int:question_id>/replace-image/  -> multipart file upload: replace image in Cloudinary and update question.image_path (admin only)
@require_http_methods(["POST"])
def hesi_replace_question_image_view(request, question_id):
    err = _require_admin(request)
    if err:
        return err

    q = get_object_or_404(HesiQuestion, pk=question_id)

    file = request.FILES.get('file')
    if not file:
        return JsonResponse({"error": "No file provided"}, status=400)

    try:
        res = cloudinary.uploader.upload(file, folder="hesi_exams")
        new_url = res.get('secure_url') or res.get('url')

        old_path = q.image_path
        if old_path:
            public_id = _extract_cloudinary_public_id(old_path)
            if public_id:
                try:
                    cloudinary.uploader.destroy(public_id, invalidate=True)
                except Exception:
                    # don't fail on destroy
                    pass

        q.image_path = new_url
        q.save(update_fields=['image_path'])
        resp = JsonResponse({"detail": "Image replaced", "image_path": new_url})
        return _attach_cors_headers(resp, request)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)






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
