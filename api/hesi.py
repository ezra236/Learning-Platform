# your_app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import HESI, HESIAttempt

User = get_user_model()


class HesiDashboardView(APIView):
    """
    GET /api/user/hesi-dashboard/?q=optional_search_term

    Returns:
    {
      "user": { first_name, last_name, email },
      "totals": { total_exams, total_exams_attempted, total_exams_completed, total_questions, total_questions_attempted },
      "groups": {
         "start": [ ... ],
         "attempted": [ ... ],
         "completed": [ ... ]
      }
    }
    """
    permission_classes = []  # manual checks inside

    def get(self, request, format=None):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not getattr(user, "is_regular_user", False):
            return Response({"detail": "Only regular users can access this endpoint."},
                            status=status.HTTP_403_FORBIDDEN)

        q = request.query_params.get("q", "").strip()

        # Use search if provided
        if q:
            base_qs = HESI.objects.filter(name__icontains=q)
        else:
            base_qs = HESI.objects.all()

        # grouping using related_name on HESIAttempt; your model uses related_name='hesi_attempts' on HESIAttempt
        # Start: no attempt by this user
        start_qs = base_qs.exclude(hesi_attempts__user=user)

        # Attempted: has attempt by user but not completed
        attempted_qs = base_qs.filter(hesi_attempts__user=user, hesi_attempts__is_completed=False)

        # Completed: has attempt by user and is_completed=True
        completed_qs = base_qs.filter(hesi_attempts__user=user, hesi_attempts__is_completed=True)

        def serialize_exam(exam):
            tq = exam.questions.count()  # HESIQuestion related_name is 'questions'
            try:
                attempt = HESIAttempt.objects.get(user=user, exam=exam)
            except HESIAttempt.DoesNotExist:
                attempt = None

            if attempt:
                answers = attempt.answers or {}
                # count keys (question IDs) as attempted questions
                qa = len(answers.keys())
            else:
                qa = 0

            progress = round((qa / tq) * 100) if tq > 0 else 0

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

        # Totals computed globally across all HESI exams (not filtered by q)
        all_exams = HESI.objects.all()
        total_questions = 0
        total_questions_attempted = 0

        for exam in all_exams:
            tq = exam.questions.count()
            total_questions += tq
            try:
                a = HESIAttempt.objects.get(user=user, exam=exam)
            except HESIAttempt.DoesNotExist:
                a = None
            if a:
                total_questions_attempted += len((a.answers or {}).keys())

        totals = {
            "total_exams": all_exams.count(),
            "total_exams_attempted": HESIAttempt.objects.filter(user=user).count(),
            "total_exams_completed": HESIAttempt.objects.filter(user=user, is_completed=True).count(),
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
                "completed": completed_list,
            }
        }, status=status.HTTP_200_OK)
