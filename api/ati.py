# your_app/views.py
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from .models import ATI, Attempt, Question

User = get_user_model()

class AtiDashboardView(APIView):
    """
    Returns:
    {
      user: { first_name, last_name, email },
      totals: {...},  # global totals across all exams
      groups: {
        start: [ { id, name, total_questions, questions_attempted, progress }, ... ],
        attempted: [ ... ],
        completed: [ ... ]
      }
    }
    Query params:
      - q (optional): search term to filter exam name (applies within each group)
    """
    permission_classes = []

    def get(self, request, format=None):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not getattr(user, "is_regular_user", False):
            return Response({"detail": "Only regular users can access this endpoint."},
                            status=status.HTTP_403_FORBIDDEN)

        q = request.query_params.get('q', '').strip()

        # All exams (used for totals)
        all_exams_qs = ATI.objects.all()

        # Build base queryset for grouping (apply search if provided)
        if q:
            base_qs = ATI.objects.filter(name__icontains=q)
        else:
            base_qs = ATI.objects.all()

        # Start: exams with no attempt by this user
        start_qs = base_qs.exclude(attempts__user=user)

        # Attempted: exams with attempt by user but not completed
        attempted_qs = base_qs.filter(attempts__user=user, attempts__is_completed=False)

        # Completed: exams with attempt by user and completed
        completed_qs = base_qs.filter(attempts__user=user, attempts__is_completed=True)

        def serialize_exam(exam):
            tq = exam.questions.count()
            try:
                attempt = Attempt.objects.get(user=user, exam=exam)
            except Attempt.DoesNotExist:
                attempt = None

            if attempt:
                answers = attempt.answers or {}
                qa = len(answers.keys())
            else:
                qa = 0

            if tq > 0:
                progress = round((qa / tq) * 100)
            else:
                progress = 0

            return {
                "id": str(exam.id),
                "name": exam.name,
                "total_questions": tq,
                "questions_attempted": qa,
                "progress": progress,
            }

        start_list = [serialize_exam(e) for e in start_qs.order_by('name')]
        attempted_list = [serialize_exam(e) for e in attempted_qs.order_by('name')]
        completed_list = [serialize_exam(e) for e in completed_qs.order_by('name')]

        # Totals (global across all exams)
        total_questions = 0
        total_questions_attempted = 0

        for exam in all_exams_qs:
            tq = exam.questions.count()
            total_questions += tq
            try:
                attempt = Attempt.objects.get(user=user, exam=exam)
            except Attempt.DoesNotExist:
                attempt = None

            if attempt:
                total_questions_attempted += len((attempt.answers or {}).keys())

        totals = {
            "total_exams": all_exams_qs.count(),
            "total_exams_attempted": Attempt.objects.filter(user=user).count(),
            "total_exams_completed": Attempt.objects.filter(user=user, is_completed=True).count(),
            "total_questions": total_questions,
            "total_questions_attempted": total_questions_attempted,
        }

        user_info = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }

        return Response({
            "user": user_info,
            "totals": totals,
            "groups": {
                "start": start_list,
                "attempted": attempted_list,
                "completed": completed_list
            }
        }, status=status.HTTP_200_OK)
