# api/user.py
import os
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.templatetags.static import static
from django.contrib.auth import get_user_model, login
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import SignupSerializer
from .models import VerificationCode

User = get_user_model()


def build_logo_url(request):
    # assumes logo is at api/static/images/<your-file>
    # Adjust filename if needed (e.g. bv.png)
    logo_static_path = static("images/bv.png")
    return request.build_absolute_uri(logo_static_path)


def send_verification_email(request, to_email, code, lifetime_minutes=10):
    """
    Render and send verification email using templates/email/verification_email.html
    """
    logo_url = build_logo_url(request)
    subject = "Your RushHourCamp verification code"
    from_email = settings.DEFAULT_FROM_EMAIL
    context = {
        "code": code,
        "email": to_email,
        "expires_minutes": lifetime_minutes,
        "logo_url": logo_url,
        "support_email": from_email,
        "frontend_name": "RushHourCamp",
    }

    html_content = render_to_string("email/verification_email.html", context)
    text_content = f"Your verification code is {code}. It expires in {lifetime_minutes} minutes."

    msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """
    Simple endpoint to ensure the CSRF cookie is set (call from frontend before any POST).
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request, format=None):
        # ensure_csrf_cookie decorator sets cookie; we also return token in body optionally
        from django.middleware.csrf import get_token
        token = get_token(request)
        return Response({"csrfToken": token})


class SignupAPIView(APIView):
    """
    Creates a user if not exists (or updates the password if exists but not verified),
    creates a VerificationCode, and sends the email.
    """
    def post(self, request, format=None):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        user, created = User.objects.get_or_create(email=email)
        if created:
            # set safe defaults
            user.set_password(password)
            user.email_verified = False
            user.is_active = True
            # default role is regular_user already
            user.save()
        else:
            # user exists
            if user.email_verified:
                return Response({"detail": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            # update password
            user.set_password(password)
            user.save()

        # create a verification code (10 minute lifetime)
        vc = VerificationCode.create_code(email=email, lifetime_minutes=10)

        # send email
        try:
            send_verification_email(request, email, vc.code, lifetime_minutes=10)
        except Exception as exc:
            # on real app you might log
            return Response({"detail": "Failed to send verification email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return success — the frontend will show verification inputs next
        return Response({"detail": "Verification code sent to email."}, status=status.HTTP_200_OK)


class ResendCodeAPIView(APIView):
    """
    Resend verification code to provided email
    """
    def post(self, request, format=None):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "email required"}, status=status.HTTP_400_BAD_REQUEST)
        email = email.lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "No pending account with that email."}, status=status.HTTP_404_NOT_FOUND)

        if user.email_verified:
            return Response({"detail": "Email already verified."}, status=status.HTTP_400_BAD_REQUEST)

        vc = VerificationCode.create_code(email=email, lifetime_minutes=10)
        try:
            send_verification_email(request, email, vc.code, lifetime_minutes=10)
        except Exception:
            return Response({"detail": "Failed to send verification email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "Verification code resent."}, status=status.HTTP_200_OK)


class VerifyCodeAPIView(APIView):
    """
    Accepts email + code, verifies it, marks user.email_verified = True,
    logs the user in (creates session) and returns success. Frontend should redirect.
    """
    def post(self, request, format=None):
        email = (request.data.get("email") or "").lower()
        code = (request.data.get("code") or "").strip()

        if not email or not code:
            return Response({"detail": "email and code are required."}, status=status.HTTP_400_BAD_REQUEST)

        # find latest code for email
        try:
            vc = VerificationCode.objects.filter(email=email).order_by("-created_at").first()
        except VerificationCode.DoesNotExist:
            vc = None

        if not vc:
            return Response({"detail": "Verification code not found."}, status=status.HTTP_404_NOT_FOUND)

        if vc.is_expired():
            return Response({"detail": "Verification code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        if vc.code != code:
            return Response({"detail": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        # mark the user verified
        user = get_object_or_404(User, email=email)
        user.email_verified = True
        user.save()

        # Optionally delete codes for this email to prevent reuse
        VerificationCode.objects.filter(email=email).delete()

        # create session / log the user in
        # Note: ensure SessionMiddleware and AuthenticationMiddleware are enabled in settings.MIDDLEWARE
        login(request, user)

        # Return redirect URL in response or 200; frontend will redirect
        return Response({"detail": "verified", "redirect": "/user/dashboard/"}, status=status.HTTP_200_OK)




# api/views.py  (append or add near the other APIView classes)
from django.contrib.auth import authenticate, login

class SigninAPIView(APIView):
    """
    Sign-in endpoint.
    Accepts POST { email, password }.
    On success: logs the user in (creates session) and returns redirect '/user/dashboard/'.
    """
    def post(self, request, format=None):
        email = (request.data.get("email") or "").lower().strip()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response({"detail": "email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # authenticate - using email as username (your custom user model uses email as USERNAME_FIELD)
        user = authenticate(request, username=email, password=password)
        if user is None:
            # Could be wrong credentials or inactive user
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({"detail": "Account disabled."}, status=status.HTTP_400_BAD_REQUEST)

        if not getattr(user, "email_verified", False):
            return Response({"detail": "Email not verified. Please verify your email first."}, status=status.HTTP_400_BAD_REQUEST)

        # create session / log the user in
        login(request, user)

        return Response({"detail": "signed_in", "redirect": "/user/dashboard/"}, status=status.HTTP_200_OK)





from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import logout

class AuthSessionAPIView(APIView):
    permission_classes = []  # allow anonymous, we handle checks inside

    def get(self, request, format=None):
        user = getattr(request, "user", None)

        if not (user and user.is_authenticated and user.is_active):
            return Response({"authenticated": False, "redirect": "/user/signin/"}, status=status.HTTP_401_UNAUTHORIZED)

        # Defensive: ensure session's stored user id matches loaded user
        session_uid = request.session.get("_auth_user_id")
        if session_uid is None or str(session_uid) != str(user.pk):
            # mismatch -> clear session and require re-login
            try:
                logout(request)
            except Exception:
                pass
            return Response({"authenticated": False, "detail": "Session mismatch."}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure the current user is a regular user
        if not getattr(user, "is_regular_user", False):
            return Response({"authenticated": False, "detail": "Forbidden: not a regular user."}, status=status.HTTP_403_FORBIDDEN)

        # optional email_verified check
        if not getattr(user, "email_verified", True):
            return Response({"authenticated": False, "redirect": "/user/signin/", "detail": "Email not verified."},
                            status=status.HTTP_401_UNAUTHORIZED)

        user_info = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": getattr(user, "role", None),
        }

        return Response({"authenticated": True, "user": user_info}, status=status.HTTP_200_OK)





import json
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from decimal import Decimal, InvalidOperation

from .models import Plan, Feature, IntendedPlan, ExamType, DURATION_CHOICES

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


EXAM_ORDER = [
    ExamType.ATI_TEAS_7,
    ExamType.HESI_A2,
    ExamType.NCLEX,
    ExamType.NURSING_TEST_BANK,
    ExamType.EXIT_EXAM,
]


@require_http_methods(["GET", "OPTIONS"])
def plans_public_view(request):
    """
    GET /api/plans/public/
    Returns plans grouped by exam_type in canonical EXAM_ORDER.
    Only accessible to authenticated regular users (session auth).
    Only returns plans where active=True.
    """
    # Preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    # Auth checks
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    grouped = []
    for exam in EXAM_ORDER:
        # NOTE: Only active plans are returned
        plans_qs = Plan.objects.filter(exam_type=exam, active=True).order_by("duration_days").prefetch_related("features")
        plans = []
        for p in plans_qs:
            plans.append({
                "id": str(p.id) if hasattr(p, "id") else p.pk,
                "title": p.title,
                "exam_type": p.exam_type,
                "exam_display": p.get_exam_type_display(),
                "duration_days": p.duration_days,
                "price": str(p.price),
                "currency": p.currency,
                "features": [{"id": f.id, "name": f.name} for f in p.features.all()],
                "active": True,
            })
        grouped.append({
            "exam_type": exam,
            "exam_display": dict(ExamType.choices).get(exam, exam),
            "plans": plans,
        })

    return _attach_cors_headers(JsonResponse({"exam_groups": grouped}, status=200), request)



@require_http_methods(["GET", "POST", "OPTIONS"])
def intended_plans_view(request):
    """
    GET  /api/intended-plans/  -> list current user's intended plans
    POST /api/intended-plans/  -> create slip { plan_id: "<uuid or int>" }
    Requires authenticated regular user.
    """
    # OPTIONS -> preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    if request.method == "GET":
        slips = IntendedPlan.objects.filter(user=request.user).select_related("plan").order_by("-created_at")
        data = [
            {
                "id": str(s.id),
                "plan": {
                    "id": str(s.plan.id) if hasattr(s.plan, "id") else s.plan.pk,
                    "title": s.plan.title,
                    "exam_type": s.plan.exam_type,
                    "duration_days": s.plan.duration_days,
                    "price": str(s.plan.price),
                    "currency": s.plan.currency,
                    "features": [{"id": f.id, "name": f.name} for f in s.plan.features.all()],
                },
                "created_at": s.created_at.isoformat(),
            }
            for s in slips
        ]
        return _attach_cors_headers(JsonResponse({"intended": data}, status=200), request)

    # POST -> create
    try:
        payload = json.loads(request.body or "{}")
        plan_id = payload.get("plan_id")
        if not plan_id:
            return _attach_cors_headers(JsonResponse({"error": "plan_id is required"}, status=400), request)

        # find plan
        try:
            plan = Plan.objects.get(pk=plan_id)
        except Plan.DoesNotExist:
            return _attach_cors_headers(JsonResponse({"error": "Plan not found"}, status=404), request)

        # CHECK: do not allow adding if the user already has an active subscription for this plan
        now = timezone.now()
        active_exists = Subscription.objects.filter(user=request.user, plan=plan, finish_date__gte=now).exists()
        if active_exists:
            return _attach_cors_headers(
                JsonResponse(
                    {"error": "You already have an active subscription for this plan. You cannot add it again until it expires."},
                    status=400
                ),
                request
            )

        # prevent duplicates because of unique_together in model
        slip, created = IntendedPlan.objects.get_or_create(user=request.user, plan=plan)
        if not created:
            return _attach_cors_headers(JsonResponse({"detail": "Already added"}, status=200), request)

        result = {
            "id": str(slip.id),
            "plan_id": str(plan.id),
            "created_at": slip.created_at.isoformat(),
        }
        return _attach_cors_headers(JsonResponse({"detail": "Added", "slip": result}, status=201), request)

    except Exception as exc:
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)



@require_http_methods(["DELETE", "OPTIONS"])
def intended_plan_detail_view(request, slip_id):
    """
    DELETE /api/intended-plans/<uuid:slip_id>/
    Only the owner may delete their slip.
    """
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    slip = get_object_or_404(IntendedPlan, pk=slip_id)

    if slip.user_id != request.user.id:
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not owner"}, status=403), request)

    slip.delete()
    return _attach_cors_headers(JsonResponse({"detail": "Removed"}, status=200), request)





# api/views.py (add)
import json
from decimal import Decimal
from collections import defaultdict
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods

from .models import IntendedPlan

@require_http_methods(["GET", "OPTIONS"])
def intended_plans_total_view(request):
    """
    GET /api/intended-plans/total/
    Returns totals grouped by currency and count of intended plans for the current user.
    Requires authenticated regular user session.
    """
    # preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    # auth checks
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    slips = IntendedPlan.objects.filter(user=request.user).select_related("plan")

    totals = defaultdict(Decimal)
    count = 0
    for s in slips:
        count += 1
        plan = s.plan
        # plan.price is Decimal (DecimalField); plan.currency might be None
        currency = (plan.currency or "USD").upper()
        # ensure Decimal addition
        totals[currency] = totals[currency] + (plan.price or Decimal("0.00"))

    # convert Decimal to string for JSON
    totals_out = {cur: str(tot) for cur, tot in totals.items()}

    payload = {
        "count": count,
        "totals": totals_out,   # e.g. { "USD": "129.97" }
    }
    return _attach_cors_headers(JsonResponse(payload, status=200), request)









# api/views.py (or api/payments.py)

import os
import json
import requests
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404

from .models import IntendedPlan, Subscription, Plan, ExamType

# choose PayPal base depending on mode
def _paypal_api_base():
    mode = getattr(settings, "PAYPAL_MODE", "sandbox")
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def _get_paypal_token():
    """
    Get OAuth token from PayPal (client credentials flow).
    """
    base = _paypal_api_base()
    client_id = getattr(settings, "PAYPAL_CLIENT_ID", None)
    secret = getattr(settings, "PAYPAL_SECRET", None)
    if not client_id or not secret:
        raise RuntimeError("PayPal credentials not configured")

    r = requests.post(
        f"{base}/v1/oauth2/token",
        auth=(client_id, secret),
        data={"grant_type": "client_credentials"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json().get("access_token")


@require_http_methods(["POST"])
def paypal_create_order_view(request):
    """
    POST /api/paypal/create-order/
    Creates a PayPal order for the current user's IntendedPlans total.
    Requires authenticated regular user. Returns {"orderID": "...", "currency": "USD", "amount": "12.34"}
    """
    # preflight / csrf handling is done by calling view with ensure_csrf on frontend
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    # load intended plans
    slips = IntendedPlan.objects.filter(user=request.user).select_related("plan")
    if not slips.exists():
        return _attach_cors_headers(JsonResponse({"error": "No intended plans to pay for"}, status=400), request)

    # compute totals and ensure single currency
    totals = {}
    total_amount = Decimal("0.00")
    for s in slips:
        p = s.plan
        cur = (p.currency or "USD").upper()
        totals.setdefault(cur, Decimal("0.00"))
        totals[cur] += p.price or Decimal("0.00")

    if len(totals) > 1:
        # require single-currency checkout for simplicity
        return _attach_cors_headers(JsonResponse({"error": "Multiple currencies found in cart. Please ensure all plans use same currency."}, status=400), request)

    currency = next(iter(totals.keys()))
    total_amount = totals[currency]

    # validate none of the plans already have an active subscription for this user
    now = timezone.now()
    conflicts = []
    for s in slips:
        # if user already has a subscription for this plan that hasn't expired -> conflict
        if s.user.subscriptions.filter(plan=s.plan, finish_date__gte=now).exists():
            conflicts.append({"plan_id": str(s.plan.id), "title": s.plan.title})
    if conflicts:
        return _attach_cors_headers(JsonResponse({"error": "Some plans already have active subscriptions", "conflicts": conflicts}, status=400), request)

    # Create PayPal order
    try:
        token = _get_paypal_token()
        base = _paypal_api_base()
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": f"{total_amount:.2f}"
                    },
                    "description": f"RushHourCamp purchase: {len(slips)} plan(s)"
                }
            ],
            "application_context": {
                "brand_name": getattr(settings, "PAYPAL_BRAND_NAME", "RushHourCamp"),
                "shipping_preference": "NO_SHIPPING",
                # "return_url" and "cancel_url" not required for JS integration
            }
        }
        resp = requests.post(
            f"{base}/v2/checkout/orders",
            json=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        order_id = data.get("id")
        return _attach_cors_headers(JsonResponse({"orderID": order_id, "currency": currency, "amount": str(total_amount)}), request)
    except requests.HTTPError as e:
        msg = str(e)
        return _attach_cors_headers(JsonResponse({"error": "PayPal create order failed", "details": msg}, status=500), request)
    except Exception as exc:
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)


@require_http_methods(["POST"])
def paypal_capture_order_view(request):
    """
    POST /api/paypal/capture-order/
    Body: { orderID: "<paypal-order-id>" }
    Captures the order, records Subscriptions for each IntendedPlan, deletes IntendedPlans.
    """
    if not request.user.is_authenticated:
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated"}, status=401), request)
    if not getattr(request.user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    body = {}
    try:
        body = json.loads(request.body or "{}")
    except Exception:
        pass

    order_id = body.get("orderID")
    if not order_id:
        return _attach_cors_headers(JsonResponse({"error": "orderID is required"}, status=400), request)

    # Re-check intended plans
    slips = IntendedPlan.objects.filter(user=request.user).select_related("plan")
    if not slips.exists():
        return _attach_cors_headers(JsonResponse({"error": "No intended plans to capture"}, status=400), request)

    # compute single-currency total again and validate no active subs
    totals = {}
    for s in slips:
        p = s.plan
        cur = (p.currency or "USD").upper()
        totals.setdefault(cur, Decimal("0.00"))
        totals[cur] += p.price or Decimal("0.00")
    if len(totals) != 1:
        return _attach_cors_headers(JsonResponse({"error": "Multiple currencies found in cart"}, status=400), request)
    currency = next(iter(totals.keys()))
    total_amount = totals[currency]

    now = timezone.now()
    conflicts = []
    for s in slips:
        if s.user.subscriptions.filter(plan=s.plan, finish_date__gte=now).exists():
            conflicts.append({"plan_id": str(s.plan.id), "title": s.plan.title})
    if conflicts:
        return _attach_cors_headers(JsonResponse({"error": "Some plans already have active subscriptions", "conflicts": conflicts}, status=400), request)

    # Capture via PayPal API
    try:
        token = _get_paypal_token()
        base = _paypal_api_base()
        resp = requests.post(
            f"{base}/v2/checkout/orders/{order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        # Inspect capture result - ensure status was completed
        status_val = data.get("status", "").upper()
        # extract capture id and amount from purchase_units -> payments -> captures
        capture_id = None
        captured_value = None
        captured_currency = None
        try:
            pus = data.get("purchase_units", [])
            if pus and "payments" in pus[0]:
                payments = pus[0]["payments"]
                if "captures" in payments and payments["captures"]:
                    c = payments["captures"][0]
                    capture_id = c.get("id")
                    if "amount" in c:
                        captured_value = c["amount"].get("value")
                        captured_currency = c["amount"].get("currency_code")
        except Exception:
            pass

        if status_val not in ("COMPLETED", "APPROVED"):
            return _attach_cors_headers(JsonResponse({"error": "PayPal capture did not complete", "details": data}, status=400), request)

        # Create subscriptions for each intended plan
        created_subs = []
        for s in slips:
            plan = s.plan
            # double-check again for safety
            if request.user.subscriptions.filter(plan=plan, finish_date__gte=now).exists():
                # skip, but this should have been caught earlier
                continue

            start = timezone.now()
            finish = start + timezone.timedelta(days=int(plan.duration_days))

            sub = Subscription.objects.create(
                user=request.user,
                plan=plan,
                start_date=start,
                finish_date=finish,
                paypal_order_id=order_id,
                paypal_capture_id=capture_id,
                amount=plan.price,
                currency=plan.currency or captured_currency or currency,
            )
            created_subs.append({
                "id": str(sub.id),
                "plan_id": str(plan.id),
                "title": plan.title,
                "start_date": sub.start_date.isoformat(),
                "finish_date": sub.finish_date.isoformat(),
            })

        # delete the intended plans after successful subscriptions
        slips.delete()

        return _attach_cors_headers(JsonResponse({"detail": "Payment captured and subscriptions created", "subscriptions": created_subs}, status=200), request)
    except requests.HTTPError as e:
        return _attach_cors_headers(JsonResponse({"error": "PayPal capture failed", "details": str(e)}, status=500), request)
    except Exception as exc:
        return _attach_cors_headers(JsonResponse({"error": str(exc)}, status=500), request)





# add near other imports in api/views.py
from django.db.models import Q
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from .models import Subscription, Plan

# GET /api/subscriptions/
@require_http_methods(["GET", "OPTIONS"])
def subscriptions_view(request):
    """
    Returns all subscriptions for the currently-authenticated regular user
    that look like they were paid for (amount or paypal ids present).
    Does NOT include Plan.features.
    """
    # Preflight
    if request.method == "OPTIONS":
        return _attach_cors_headers(HttpResponse(), request)

    # Auth checks
    user = getattr(request, "user", None)
    if not (user and user.is_authenticated and user.is_active):
        return _attach_cors_headers(JsonResponse({"error": "Not authenticated", "redirect": "/user/signin/"},
                                                status=401), request)

    if not getattr(user, "is_regular_user", False):
        return _attach_cors_headers(JsonResponse({"error": "Forbidden: not a regular user"}, status=403), request)

    # Consider a subscription "paid" if any of these fields are present.
    paid_q = Q(amount__isnull=False) | Q(paypal_capture_id__isnull=False) | Q(paypal_order_id__isnull=False)

    now = timezone.now()
    qs = Subscription.objects.filter(user=user).filter(paid_q).select_related("plan").order_by("-created_at")

    subs = []
    for s in qs:
        plan = s.plan
        is_active = (s.finish_date and s.finish_date > now)
        seconds_left = max(0, int((s.finish_date - now).total_seconds())) if s.finish_date else None

        subs.append({
            "id": str(s.id),
            "start_date": s.start_date.isoformat() if s.start_date else None,
            "finish_date": s.finish_date.isoformat() if s.finish_date else None,
            "amount": str(s.amount) if s.amount is not None else None,
            "currency": s.currency,
            "paypal_order_id": s.paypal_order_id,
            "paypal_capture_id": s.paypal_capture_id,
            "is_active": is_active,
            "seconds_left": seconds_left,   # convenient for client-side countdown
            # plan details (no features)
            "plan": {
                "id": str(plan.id),
                "title": plan.title,
                "exam_type": plan.exam_type,
                "exam_display": plan.get_exam_type_display(),
                "duration_days": plan.duration_days,
                "price": str(plan.price),
                "currency": plan.currency,
                "active": plan.active,
            }
        })

    return _attach_cors_headers(JsonResponse({"subscriptions": subs}, status=200), request)






#----------------------------------------------------------------------------------------------------------------------------------
# EXAMS FOR USERS START HERE
# ---------------------------------------------------------------------------------------------------------------------------------

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import logout


from .models import Subscription, Exam, HesiExam 


class SubscriptionStatusAPIView(APIView):
    """
    GET /api/subscription/status/
    Returns whether the current session user has an active subscription.
    If user has ATI_TEAS_7 subscription, returns exams list with total_questions.
    If user has HESI_A2 subscription, returns Hesi exams list with total_questions.
    Other exam types are returned with an empty exams list for now (pass).
    """
    permission_classes = []  # session-based auth handled inside

    def get(self, request, format=None):
        user = getattr(request, "user", None)
        now = timezone.now()

        # Not authenticated -> 401 with redirect hint
        if not (user and user.is_authenticated and user.is_active):
            return Response(
                {"authenticated": False, "redirect": "/user/signin/"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Defensive session check (copying pattern used elsewhere)
        session_uid = request.session.get("_auth_user_id")
        if session_uid is None or str(session_uid) != str(user.pk):
            try:
                logout(request)
            except Exception:
                pass
            return Response({"authenticated": False, "detail": "Session mismatch."}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure user is regular user
        if not getattr(user, "is_regular_user", False):
            return Response({"authenticated": False, "detail": "Forbidden: not a regular user."}, status=status.HTTP_403_FORBIDDEN)

        # Find active subscriptions (where now is between start_date and finish_date)
        active_subs = Subscription.objects.filter(user=user, start_date__lte=now, finish_date__gt=now)

        if not active_subs.exists():
            return Response({"has_subscription": False}, status=status.HTTP_200_OK)

        # Collect exam types and prepare details
        exam_type_map = {}
        for s in active_subs.select_related("plan"):
            exam_type = getattr(s.plan, "exam_type", None)
            if not exam_type:
                continue
            if exam_type not in exam_type_map:
                exam_type_map[exam_type] = {"exam_type": exam_type, "exams": []}

        # For ATI_TEAS_7, return Exam rows + question counts
        if "ATI_TEAS_7" in exam_type_map:
            exams = Exam.objects.filter(is_complete=True).order_by("name")
            exam_list = []
            for e in exams:
                try:
                    total_q = e.recalc_current_question_count()
                except Exception:
                    total_q = e.questions.count()
                exam_list.append({
                    "id": str(e.pk),
                    "name": e.name,
                    "total_questions": total_q,
                })
            exam_type_map["ATI_TEAS_7"]["exams"] = exam_list

        # For HESI_A2, return HesiExam rows + question counts
        if "HESI_A2" in exam_type_map:
            hesi_exams = HesiExam.objects.filter(is_complete=True).order_by("name")
            hesi_list = []
            for he in hesi_exams:
                try:
                    total_q = he.recalc_current_question_count()
                except Exception:
                    total_q = he.questions.count()
                hesi_list.append({
                    "id": str(he.pk),
                    "name": he.name,
                    "total_questions": total_q,
                })
            exam_type_map["HESI_A2"]["exams"] = hesi_list

        # For other exam types: leave pass (empty list) for now
        for et in list(exam_type_map.keys()):
            if et not in ("ATI_TEAS_7", "HESI_A2"):
                exam_type_map[et]["exams"] = []
                exam_type_map[et]["pass"] = True

        # Build response
        resp = {
            "has_subscription": True,
            "exam_types": list(exam_type_map.keys()),
            "details": list(exam_type_map.values()),
        }

        return Response(resp, status=status.HTTP_200_OK)
