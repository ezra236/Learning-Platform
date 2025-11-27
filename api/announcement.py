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
