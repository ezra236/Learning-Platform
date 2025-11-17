# api/purchasepdf.py
import json
import requests
from requests.auth import HTTPBasicAuth
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseServerError
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt  # don't csrf_exempt the endpoints below
from django.views.decorators.csrf import csrf_protect
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Pdf, PurchaseSession, PdfPurchase


# ---- PayPal helpers ----
def _paypal_base():
    mode = getattr(settings, "PAYPAL_MODE", "sandbox")
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def _get_paypal_access_token():
    """
    Obtain OAuth access token from PayPal.
    """
    client_id = getattr(settings, "PAYPAL_CLIENT_ID", None)
    secret = getattr(settings, "PAYPAL_SECRET", None)
    if not client_id or not secret:
        raise RuntimeError("PayPal credentials not configured in settings.")

    token_url = f"{_paypal_base()}/v1/oauth2/token"
    resp = requests.post(
        token_url,
        auth=HTTPBasicAuth(client_id, secret),
        data={"grant_type": "client_credentials"},
        headers={"Accept": "application/json"},
        timeout=15,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to obtain PayPal token: {resp.status_code} {resp.text}")
    data = resp.json()
    return data["access_token"]


def _create_paypal_order_on_server(amount, currency="USD", return_url=None, cancel_url=None):
    """
    Create an order in PayPal and return order id and the raw response.
    """
    access_token = _get_paypal_access_token()
    url = f"{_paypal_base()}/v2/checkout/orders"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": currency,
                    "value": f"{Decimal(amount):.2f}",
                }
            }
        ],
    }
    # optionally application_context with return/cancel URL (not required for client integration)
    if return_url or cancel_url:
        payload["application_context"] = {}
        if return_url:
            payload["application_context"]["return_url"] = return_url
        if cancel_url:
            payload["application_context"]["cancel_url"] = cancel_url

    resp = requests.post(url, json=payload, headers=headers, timeout=15)
    if resp.status_code not in (201, 200):
        raise RuntimeError(f"Failed to create PayPal order: {resp.status_code} {resp.text}")
    return resp.json()


def _get_paypal_order(order_id):
    access_token = _get_paypal_access_token()
    url = f"{_paypal_base()}/v2/checkout/orders/{order_id}"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to fetch PayPal order: {resp.status_code} {resp.text}")
    return resp.json()


# ---- Public endpoints (no authentication required) ----

@require_http_methods(["GET"])
def public_pdfs_list(request):
    """
    Public list of PDFs (used by frontend to display purchase options).
    Returns category and proof_image along with other fields.
    """
    qs = Pdf.objects.all().order_by("-created_at")
    out = []
    for p in qs:
        out.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "price": f"{p.price:.2f}",
            "category": p.category,
            "proof_image": p.proof_image,        # Cloudinary URL or null
            "created_at": p.created_at.isoformat(),
        })
    return JsonResponse(out, safe=False)



@require_http_methods(["POST"])
def create_purchase_session(request):
    """
    Create a short-lived PurchaseSession when user clicks Buy Now.
    Expects JSON: { "pdf_id": "<uuid>" }
    Returns: { "session_id": "<uuid>", "pdf": {...} }
    CSRF-protected — frontend should fetch CSRF cookie first and send X-CSRFToken.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return HttpResponseBadRequest(json.dumps({"error": "Invalid JSON"}), content_type="application/json")

    pdf_id = payload.get("pdf_id")
    if not pdf_id:
        return HttpResponseBadRequest(json.dumps({"error": "pdf_id is required"}), content_type="application/json")

    try:
        pdf = Pdf.objects.get(pk=pdf_id)
    except Pdf.DoesNotExist:
        return HttpResponseNotFound(json.dumps({"error": "pdf not found"}), content_type="application/json")

    session = PurchaseSession.objects.create(pdf=pdf)
    resp = {
        "session_id": str(session.id),
        "pdf": {
            "id": str(pdf.id),
            "name": pdf.name,
            "description": pdf.description,
            "price": f"{pdf.price:.2f}",
        },
    }
    return JsonResponse(resp, status=201)


@require_http_methods(["POST"])
def set_session_email(request, session_id):
    """
    Set buyer email on a session.
    POST JSON: { "buyer_email": "someone@example.com" }
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return HttpResponseBadRequest(json.dumps({"error": "Invalid JSON"}), content_type="application/json")

    buyer_email = payload.get("buyer_email")
    if not buyer_email:
        return HttpResponseBadRequest(json.dumps({"error": "buyer_email is required"}), content_type="application/json")

    try:
        session = PurchaseSession.objects.get(pk=session_id)
    except PurchaseSession.DoesNotExist:
        return HttpResponseNotFound(json.dumps({"error": "session not found"}), content_type="application/json")

    session.buyer_email = buyer_email
    session.save(update_fields=["buyer_email"])
    return JsonResponse({"session_id": str(session.id), "buyer_email": session.buyer_email})


@require_http_methods(["POST"])
def create_paypal_order(request):
    """
    Create PayPal order on the server for a given session.
    POST JSON: { "session_id": "<uuid>" , optional "currency": "USD"}
    Response: full PayPal order JSON (including "id") — we return the id to the client.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return HttpResponseBadRequest(json.dumps({"error": "Invalid JSON"}), content_type="application/json")

    session_id = payload.get("session_id")
    if not session_id:
        return HttpResponseBadRequest(json.dumps({"error": "session_id is required"}), content_type="application/json")

    currency = payload.get("currency") or getattr(settings, "NEXT_PUBLIC_PAYPAL_CURRENCY", "USD")

    try:
        session = PurchaseSession.objects.select_related("pdf").get(pk=session_id)
    except PurchaseSession.DoesNotExist:
        return HttpResponseNotFound(json.dumps({"error": "session not found"}), content_type="application/json")

    pdf = session.pdf
    try:
        order_json = _create_paypal_order_on_server(amount=str(pdf.price), currency=currency)
    except Exception as exc:
        return HttpResponseServerError(json.dumps({"error": str(exc)}), content_type="application/json")

    # return the order id to the client
    return JsonResponse({"orderID": order_json.get("id"), "raw": order_json})


@require_http_methods(["POST"])
def complete_order(request):
    """
    Called by frontend after PayPal capture (or by the frontend after actions.order.capture()).
    POST JSON: { "session_id": "...", "orderID": "..." }
    This endpoint validates the order with PayPal, records a PdfPurchase, sends email,
    and deletes the PurchaseSession.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return HttpResponseBadRequest(json.dumps({"error": "Invalid JSON"}), content_type="application/json")

    session_id = payload.get("session_id")
    order_id = payload.get("orderID")
    if not session_id or not order_id:
        return HttpResponseBadRequest(json.dumps({"error": "session_id and orderID are required"}), content_type="application/json")

    try:
        session = PurchaseSession.objects.select_related("pdf").get(pk=session_id)
    except PurchaseSession.DoesNotExist:
        return HttpResponseNotFound(json.dumps({"error": "session not found"}), content_type="application/json")

    # fetch order from PayPal to verify status
    try:
        order = _get_paypal_order(order_id)
    except Exception as exc:
        return HttpResponseServerError(json.dumps({"error": f"Failed verifying order with PayPal: {exc}"}), content_type="application/json")

    status = order.get("status")
    # PayPal completed capture typically shows status 'COMPLETED'
    if status != "COMPLETED":
        return HttpResponseBadRequest(json.dumps({"error": f"Order not completed. PayPal status: {status}"}), content_type="application/json")

    # parse amount and currency from PayPal response (take first purchase_unit)
    try:
        pu = order.get("purchase_units", [])[0]
        amt_obj = pu.get("amount", {})
        value = amt_obj.get("value")
        currency_code = amt_obj.get("currency_code", "USD")
        amount_decimal = Decimal(str(value))
    except Exception:
        amount_decimal = session.pdf.price
        currency_code = getattr(settings, "NEXT_PUBLIC_PAYPAL_CURRENCY", "USD")

    buyer_email = session.buyer_email
    if not buyer_email:
        # Try to extract payer email from order (if available)
        payer = order.get("payer", {})
        buyer_email = payer.get("email_address") or buyer_email

    # If still no buyer email, continue but record as empty (you might require this)
    if not buyer_email:
        buyer_email = ""

    # Create purchase record
    purchase = PdfPurchase.objects.create(
        pdf=session.pdf,
        buyer_email=buyer_email,
        amount=amount_decimal,
        paypal_order_id=order_id,
    )

    # Send notification email to brian@gmail.com
    try:
        # Build context for templates
        context = {
            "purchase": purchase,
            "pdf": session.pdf,
            "buyer_email": buyer_email,
            "amount": f"{amount_decimal:.2f}",
            "order_id": order_id,
            "timestamp": timezone.localtime(purchase.created_at),
        }

        subject = f"New order placed for {session.pdf.name}"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "brian@rushhourcamp.com")
        to_email = ["briankipngeno27@gmail.com"]

        # load templates from api/templates/email/
        text_body = render_to_string("email/order_notification.txt", context)
        html_body = render_to_string("email/order_notification.html", context)

        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=to_email)
        if html_body:
            msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
    except Exception as exc:
        # sending mail failed — we still proceed (but report)
        # log or return error if you want (here we continue)
        # Optionally you can set a flag on purchase
        pass

    # Delete the temporary session as requested
    session.delete()

    return JsonResponse({"status": "ok", "purchase_id": str(purchase.id)})
