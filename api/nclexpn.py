import cloudinary.uploader
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

from .models import PrepExam, PrepQuestion
from .serializers import PrepExamSerializer, PrepQuestionSerializer

# Exams
class PrepExamListCreateAPIView(generics.ListCreateAPIView):
    queryset = PrepExam.objects.all().order_by('-created_at')
    serializer_class = PrepExamSerializer

class PrepExamRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = PrepExam.objects.all()
    serializer_class = PrepExamSerializer


# Questions
class PrepQuestionListAPIView(generics.ListAPIView):
    serializer_class = PrepQuestionSerializer

    def get_queryset(self):
        exam_id = self.request.query_params.get('exam_id')
        qs = PrepQuestion.objects.all().order_by('order', 'id')
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        return qs


class PrepQuestionCreateAPIView(generics.CreateAPIView):
    serializer_class = PrepQuestionSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update({'creating': True})
        return ctx


class PrepQuestionRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = PrepQuestion.objects.all()
    serializer_class = PrepQuestionSerializer


# Cloudinary image upload endpoint
class PrepUploadImageAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"detail": "No file provided in 'file' field."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Force resource_type=image and return secure_url. You can also pass folder or other options.
            result = cloudinary.uploader.upload(
                file_obj,
                resource_type='image',
                use_filename=True,
                unique_filename=True,
                folder='prep'
            )
            url = result.get('secure_url') or result.get('url')
            if not url:
                return Response({"detail": "Upload succeeded but Cloudinary returned no URL.", "raw": result}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"url": url})
        except Exception as e:
            # Provide extra context for debugging
            return Response({"detail": "Cloudinary upload failed.", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
