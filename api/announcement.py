import re
import json
import cloudinary.uploader
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST, require_http_methods
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Announcement

User = get_user_model()

def _serialize_announcement(a: Announcement):
    return {
        "id": str(a.id),
        "format": a.format,
        "mediapath": a.mediapath,
        "is_active": a.is_active,
        "created_at": a.created_at.isoformat(),
        # optional: include public_id if you want frontend to know
        # "public_id": a.public_id,
    }

@csrf_protect
@require_POST
def upload_announcement(request):
    """
    Accepts a file (image/video) as 'file' in request.FILES and 'format' in request.POST
    Uploads to Cloudinary via cloudinary.uploader and creates Announcement.
    """
    upload_file = request.FILES.get("file")
    fmt = request.POST.get("format", "").lower()
    if not upload_file or fmt not in ("image", "video"):
        return JsonResponse({"detail": "file and format (image|video) required"}, status=400)

    resource_type = "video" if fmt == "video" else "image"
    try:
        result = cloudinary.uploader.upload(upload_file, resource_type=resource_type)
        media_url = result.get("secure_url") or result.get("url")
        public_id = result.get("public_id")
        announcement = Announcement.objects.create(format=fmt, mediapath=media_url, public_id=public_id)
        return JsonResponse({
            "id": str(announcement.id),
            "mediapath": media_url,
            "format": fmt,
        }, status=201)
    except Exception as exc:
        return JsonResponse({"detail": "upload failed", "error": str(exc)}, status=500)


@require_http_methods(["GET"])
def announcements_list(request):
    """
    GET /api/announcements/
    Returns list of announcements (most recent first).
    """
    qs = Announcement.objects.all().order_by("-created_at")
    data = [_serialize_announcement(a) for a in qs]
    return JsonResponse(data, safe=False, status=200)


def _extract_public_id_from_url(url: str) -> str:
    """
    Try to extract Cloudinary public_id from a typical Cloudinary URL.
    - Expects /upload/.../v12345/<public_id>.<ext> or similar.
    - Returns public_id without extension, or None.
    """
    try:
        # split after /upload/
        parts = url.split("/upload/")
        if len(parts) < 2:
            return None
        path = parts[1]
        # remove version segment if present: v12345/
        path = re.sub(r"^v\d+/", "", path)
        # drop transformation segments if any (they often come before version)
        # remove query params
        path = path.split("?")[0]
        # remove extension
        public_id = path.rsplit(".", 1)[0]
        return public_id
    except Exception:
        return None


@csrf_protect
@require_http_methods(["GET", "PATCH", "DELETE"])
def announcement_detail(request, pk):
    """
    GET /api/announcements/<uuid:pk>/  -> returns single announcement
    PATCH /api/announcements/<uuid:pk>/ -> partial update allowed (e.g. {"is_active": true})
    DELETE -> deletes the announcement row and removes the Cloudinary media
    Requires authentication for PATCH and DELETE (activating/deactivating/deleting).
    """
    announcement = get_object_or_404(Announcement, pk=pk)

    if request.method == "GET":
        return JsonResponse(_serialize_announcement(announcement), status=200)

    # For PATCH and DELETE require authentication
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Example permission: only staff users can PATCH/DELETE. Adjust as needed.
    if not getattr(request.user, "is_staff", False):
        return JsonResponse({"detail": "Permission denied"}, status=403)

    if request.method == "PATCH":
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        allowed_fields = {"is_active"}  # keep it tight for now
        changed = False

        for key in allowed_fields:
            if key in body:
                val = body.get(key)
                # Basic validation
                if key == "is_active":
                    if not isinstance(val, bool):
                        return JsonResponse({"detail": "is_active must be boolean"}, status=400)
                    announcement.is_active = val
                    changed = True

        if changed:
            announcement.save()
            return JsonResponse(_serialize_announcement(announcement), status=200)

        return JsonResponse({"detail": "Nothing to update"}, status=400)

    # DELETE
    if request.method == "DELETE":
        # First attempt to delete media from Cloudinary if we can
        public_id = announcement.public_id
        resource_type = "video" if announcement.format == "video" else "image"

        if not public_id and announcement.mediapath:
            public_id = _extract_public_id_from_url(announcement.mediapath)

        deletion_error = None
        if public_id:
            try:
                # attempt to destroy the asset (invalidate caches)
                cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
            except Exception as exc:
                # don't stop deletion of DB row necessarily, but report error
                deletion_error = str(exc)

        # Now delete DB row
        try:
            announcement.delete()
        except Exception as exc:
            return JsonResponse({"detail": "Failed to delete announcement record", "error": str(exc)}, status=500)

        if deletion_error:
            return JsonResponse({"detail": "Announcement record deleted, but Cloudinary deletion failed", "error": deletion_error}, status=207)

        return JsonResponse({"detail": "Announcement deleted"}, status=200)




# announcement/views.py
import logging
import cloudinary
import cloudinary.uploader
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from .models import Campaign
from api.serializers import CampaignSerializer

logger = logging.getLogger(__name__)

# read Cloudinary config from settings
_cloud_cfg = getattr(settings, "CLOUDINARY", {}) or {}
_cloud_name = _cloud_cfg.get("cloud_name")
_api_key = _cloud_cfg.get("api_key")
_api_secret = _cloud_cfg.get("api_secret")

if not (_cloud_name and _api_key and _api_secret):
    msg = "Cloudinary configuration missing. Make sure CLOUDINARY dict is set in settings.py"
    logger.warning(msg)
    # Optionally raise when you want fail-fast:
    # raise ImproperlyConfigured(msg)

cloudinary.config(
    cloud_name=_cloud_name,
    api_key=_api_key,
    api_secret=_api_secret,
)

class CampaignListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # adjust if needed
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, format=None):
        campaigns = Campaign.objects.all()
        serializer = CampaignSerializer(campaigns, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        heading = request.data.get("heading")
        description = request.data.get("description", "")
        fmt = request.data.get("format", Campaign.FORMAT_NONE)
        link = request.data.get("link", "")

        if not heading:
            return Response({"detail": "heading is required."}, status=status.HTTP_400_BAD_REQUEST)

        mediapath_url = ""
        public_id = ""
        cloud_resource_type = ""
        upload_file = request.FILES.get("file")
        if upload_file:
            content_type = upload_file.content_type or ""
            if content_type.startswith("video"):
                resource_type = "video"
            else:
                resource_type = "image"

            try:
                upload_opts = {"resource_type": resource_type}
                # you can set folder or transformation options from settings if needed
                resp = cloudinary.uploader.upload(upload_file, **upload_opts)
                mediapath_url = resp.get("secure_url", "")
                public_id = resp.get("public_id", "") or resp.get("asset_id", "")
                cloud_resource_type = resource_type
                # infer format if not provided
                if not fmt or fmt == Campaign.FORMAT_NONE:
                    fmt = Campaign.FORMAT_VIDEO if resource_type == "video" else Campaign.FORMAT_IMAGE
            except Exception as e:
                logger.exception("Cloudinary upload failed")
                return Response(
                    {"detail": "Cloudinary upload failed", "error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        campaign = Campaign.objects.create(
            heading=heading,
            description=description,
            format=fmt if fmt else Campaign.FORMAT_NONE,
            mediapath=mediapath_url,
            public_id=public_id,
            cloud_resource_type=cloud_resource_type,
            link=link,
            created_by=request.user if request.user.is_authenticated else None,
            is_active=False,
        )

        serializer = CampaignSerializer(campaign)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CampaignRetrieveUpdateDeleteView(APIView):
    """
    GET: return campaign details
    PATCH: partial update campaign (used to toggle is_active)
    DELETE: delete campaign row and delete media from Cloudinary if present
    """
    permission_classes = [permissions.IsAuthenticated]  # adjust as needed
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self, pk):
        return get_object_or_404(Campaign, pk=pk)

    def get(self, request, pk, format=None):
        campaign = self.get_object(pk)
        serializer = CampaignSerializer(campaign)
        return Response(serializer.data)

    def patch(self, request, pk, format=None):
        campaign = self.get_object(pk)
        serializer = CampaignSerializer(campaign, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        campaign = self.get_object(pk)

        # Attempt to delete media from Cloudinary if public_id present
        if campaign.public_id:
            try:
                # resource_type must match 'image' or 'video'; default to 'image' if blank
                rtype = campaign.cloud_resource_type if campaign.cloud_resource_type else "image"
                cloudinary.uploader.destroy(campaign.public_id, resource_type=rtype)
            except Exception as e:
                # Log but do not block deletion of DB row (depending on your policy you may prefer to block)
                logger.exception("Failed to destroy Cloudinary resource: %s", str(e))

        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
