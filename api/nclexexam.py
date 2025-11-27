# api/nclexexam.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.http import Http404
from rest_framework.exceptions import NotFound
from rest_framework import serializers

from .models import NCLEXExam, NCLEXQuestion, NclexrnAttempt, NclexrnReport, NclexrnBookmark
from .serializers import NclexrnExamSerializer, NclexrnQuestionSerializer, NclexrnAttemptSerializer, NclexrnReportSerializer, NclexrnBookmarkSerializer
from .permissions import IsRegularUser  # see note below for adding this helper

# Endpoint: /api/nclex/exams/by-name/?name=...
class NCLEXExamByNameAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = NclexrnExamSerializer

    def get_object(self):
        name = self.request.query_params.get('name')
        if not name:
            raise Http404
        return get_object_or_404(NCLEXExam, name=name)


# Check if an attempt exists for this user & exam
# GET /api/nclex/attempts/check/<int:exam_id>/
from rest_framework.views import APIView

class NclexrnCheckAttemptAPIView(APIView):
    permission_classes = [IsAuthenticated, IsRegularUser]

    def get(self, request, exam_id):
        attempt = NclexrnAttempt.objects.filter(user=request.user, exam_id=exam_id).first()
        if not attempt:
            return Response({"exists": False}, status=status.HTTP_200_OK)
        return Response({"exists": True, "attempt": NclexrnAttemptSerializer(attempt).data}, status=status.HTTP_200_OK)


class NclexrnAttemptCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = NclexrnAttemptSerializer

    def perform_create(self, serializer):
        # Ensure uniqueness: if an attempt exists, return it instead (avoid duplicates)
        exam = serializer.validated_data.get('exam')
        existing = NclexrnAttempt.objects.filter(user=self.request.user, exam=exam).first()
        if existing:
            raise serializers.ValidationError({"detail": "Attempt already exists."})
        serializer.save(user=self.request.user, started_at=timezone.now())


class NclexrnAttemptDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = NclexrnAttemptSerializer
    queryset = NclexrnAttempt.objects.all()

    def get_queryset(self):
        return NclexrnAttempt.objects.filter(user=self.request.user)


class NclexrnSubmitAttemptAPIView(APIView):
    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request, pk):
        attempt = get_object_or_404(NclexrnAttempt, pk=pk, user=request.user)
        payload = request.data.get('selected_choices', {})  # mapping
        time_taken = request.data.get('time_taken_seconds', None)

        exam = attempt.exam
        total = 0
        score = 0

        # grading per question: basic exact-match grader (adapt as needed)
        for q in exam.questions.all():
            total += 1
            qid_str = str(q.id)
            user_ans = payload.get(qid_str)
            # format-based scoring
            if q.format in {1,4,6,7}:  # choice-based single/multiple
                correct_ids = list(q.choices.filter(is_correct=True).values_list('id', flat=True))
                selected_ids = []
                if user_ans:
                    selected_ids = user_ans.get('selected_choices') or user_ans
                if isinstance(selected_ids, list) and set(selected_ids) == set(correct_ids):
                    score += 1
            elif q.format == 2:
                # single blank text exact match (case-insensitive trim)
                if user_ans and user_ans.get('blanks'):
                    text = user_ans['blanks'].get('0', '')
                    if text and q.blank_answer and text.strip().lower() == q.blank_answer.strip().lower():
                        score += 1
            elif q.format == 3:
                # multiple blanks filled with choice ids
                correct_choices = list(q.choices.filter(is_correct=True).values_list('id', flat=True))
                # user_ans.blanks like {"0": choiceId, "1": choiceId2,...}
                if user_ans and user_ans.get('blanks'):
                    user_ids = list(user_ans['blanks'].values())
                    if set(user_ids) == set(correct_choices):
                        score += 1
            elif q.format == 5:
                # rows mapping: user must have marked correct/wrong correctly
                if user_ans and user_ans.get('rows'):
                    ok = True
                    for ch in q.choices.all():
                        expected = 'correct' if ch.is_correct else 'wrong'
                        got = user_ans['rows'].get(str(ch.id))
                        if got != expected:
                            ok = False
                            break
                    if ok:
                        score += 1
            elif q.format == 8:
                # ordered list: compare to correct_order positions
                if user_ans and user_ans.get('ordered'):
                    ordered_ids = user_ans['ordered']
                    # build correct order from choices
                    correct_order = [c.id for c in q.choices.all().order_by('correct_order') if c.correct_order is not None]
                    if ordered_ids == correct_order:
                        score += 1
            else:
                # default fallback: no score
                pass

        grade = (score / total) * 100 if total else 0
        attempt.selected_choices = payload
        attempt.time_taken_seconds = time_taken
        attempt.grade = round(grade, 2)
        attempt.is_completed = True
        attempt.completed_at = timezone.now()
        attempt.save()
        return Response({
            "success": True,
            "grade": attempt.grade,
            "score": score,
            "total": total,
            "attempt": NclexrnAttemptSerializer(attempt).data
        }, status=status.HTTP_200_OK)


class NclexrnReportCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = NclexrnReportSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NclexrnBookmarkCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = NclexrnBookmarkSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
