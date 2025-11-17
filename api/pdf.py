# api/pdf.py 

import json
from decimal import Decimal, InvalidOperation
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction
from django.utils import timezone

import cloudinary
import cloudinary.uploader

from .models import Pdf

def _is_superadmin(user):
    try:
        return bool(user.is_authenticated and user.is_superadmin)
    except Exception:
        return False


@login_required
@user_passes_test(_is_superadmin)
@require_http_methods(["GET", "POST"])
def pdfs_view(request):
    """
    GET: return list of Pdf rows (JSON)
    POST: create a Pdf (requires superadmin)
    Accepts JSON (application/json) or multipart/form-data (for image upload).
    """
    # GET: return list
    if request.method == "GET":
        qs = Pdf.objects.all().select_related("uploaded_by")
        data = []
        for p in qs:
            data.append({
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "price": f"{p.price:.2f}",
                "category": p.category,
                "proof_image": p.proof_image,
                "uploaded_by": p.uploaded_by.email if p.uploaded_by else None,
                "created_at": p.created_at.isoformat(),
            })
        return JsonResponse(data, safe=False)

    # POST: handle create
    # Accept either JSON body or multipart form-data
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        # use request.POST and request.FILES
        name = (request.POST.get("name") or "").strip()
        description = (request.POST.get("description") or "").strip()
        price_raw = request.POST.get("price")
        category = (request.POST.get("category") or "").strip()
        proof_file = request.FILES.get("proof_image")
    else:
        # JSON request
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            return HttpResponseBadRequest(json.dumps({"error": "Invalid JSON"}), content_type="application/json")

        name = (payload.get("name") or "").strip()
        description = (payload.get("description") or "").strip()
        price_raw = payload.get("price")
        category = (payload.get("category") or "").strip()
        proof_file = None  # no file present in JSON

    if not name:
        return HttpResponseBadRequest(json.dumps({"error": "Name is required"}), content_type="application/json")

    if price_raw is None:
        return HttpResponseBadRequest(json.dumps({"error": "Price is required"}), content_type="application/json")

    # Validate category strictly against allowed choices
    allowed_categories = [c[0] for c in Pdf.CATEGORY_CHOICES]
    if not category:
        return HttpResponseBadRequest(json.dumps({"error": "Category is required"}), content_type="application/json")
    if category not in allowed_categories:
        return HttpResponseBadRequest(json.dumps({"error": "Invalid category"}), content_type="application/json")

    # normalize price
    try:
        price = Decimal(str(price_raw)).quantize(Decimal("0.01"))
        if price < Decimal("0.00"):
            raise InvalidOperation()
    except (InvalidOperation, ValueError):
        return HttpResponseBadRequest(json.dumps({"error": "Invalid price format"}), content_type="application/json")

    proof_image_url = None
    # If a proof image file was provided, upload to Cloudinary
    if proof_file:
        try:
            # you can set a folder or any params here
            upload_result = cloudinary.uploader.upload(proof_file, folder="pdf_proofs", resource_type="auto")
            # prefer secure_url returned by Cloudinary
            proof_image_url = upload_result.get("secure_url") or upload_result.get("url")
        except Exception as exc:
            return HttpResponseBadRequest(json.dumps({"error": f"Image upload failed: {exc}"}), content_type="application/json")

    with transaction.atomic():
        p = Pdf.objects.create(
            name=name,
            description=description,
            price=price,
            category=category,
            proof_image=proof_image_url,
            uploaded_by=request.user,
        )

    response_data = {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "price": f"{p.price:.2f}",
        "category": p.category,
        "proof_image": p.proof_image,
        "uploaded_by": p.uploaded_by.email if p.uploaded_by else None,
        "created_at": p.created_at.isoformat(),
    }
    return JsonResponse(response_data, status=201)
