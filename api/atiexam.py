# views.py

from django.conf import settings
from django.forms.models import model_to_dict
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from .models import ATI, Question, Choice, SpecialChoice, Attempt, Bookmark, Report, HESI, HESIQuestion, HESIChoice, HESISpecialChoice, HESIAttempt, HESIBookmark
from django.shortcuts import get_object_or_404


def add_cors_headers(resp, request):
    """
    Minimal dynamic CORS header attachment — set Access-Control-Allow-Origin
    to the request's Origin if it is in settings.CORS_ALLOWED_ORIGINS.
    """
    origin = request.META.get("HTTP_ORIGIN")
    allowed = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    if origin and origin in allowed:
        resp["Access-Control-Allow-Origin"] = origin
        resp["Access-Control-Allow-Credentials"] = "true"
        # allow headers for X-CSRFToken etc
        resp["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    return resp


class CsrfTokenView(APIView):
    permission_classes = []
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, format=None):
        from django.middleware.csrf import get_token
        token = get_token(request)
        data = {"csrfToken": token}
        resp = Response(data)
        return add_cors_headers(resp, request)


class ExamDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, examname, format=None):
        # require regular user
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        
        # examname is URL-encoded in front-end; try to decode or search by name
        exam = get_object_or_404(ATI, name=examname)
        # build nested JSON
        questions = []
        for q in exam.questions.all().order_by("order"):
            qd = {
                "id": q.id,
                "order": q.order,
                "format": q.format,
                "question_html": q.question_html,
                "paragraph_html": q.paragraph_html,
                "table_html": q.table_html,
                "explanation_html": q.explanation_html,
                "image_url": q.image_url,
                "special_correct_order": q.special_correct_order or [],
            }
            qd["choices"] = []
            for c in q.choices.all().order_by("order"):
                qd["choices"].append({
                    "id": c.id,
                    "order": c.order,
                    "text_html": c.text_html,
                    "is_correct": c.is_correct,
                })
            qd["specialchoices"] = []
            for sc in q.specialchoices.all().order_by("order"):
                qd["specialchoices"].append({
                    "id": sc.id,
                    "order": sc.order,
                    "text_html": sc.text_html,
                })
            questions.append(qd)

        data = {
            "id": exam.id,
            "name": exam.name,
            "completed": exam.completed,
            "questions": questions,
            "default_time_seconds": 60 * 60,  # 1 hour default
            "total_questions": exam.questions.count(),
        }
        resp = Response(data)
        return add_cors_headers(resp, request)



class HESIExamDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, examname, format=None):
        # require regular user
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        
        # examname is URL-encoded in front-end; try to decode or search by name
        exam = get_object_or_404(HESI, name=examname)
        # build nested JSON
        questions = []
        for q in exam.questions.all().order_by("order"):
            qd = {
                "id": q.id,
                "order": q.order,
                "format": q.format,
                "question_html": q.question_html,
                "paragraph_html": q.paragraph_html,
                "table_html": q.table_html,
                "explanation_html": q.explanation_html,
                "image_url": q.image_url,
                "special_correct_order": q.special_correct_order or [],
            }
            qd["choices"] = []
            for c in q.choices.all().order_by("order"):
                qd["choices"].append({
                    "id": c.id,
                    "order": c.order,
                    "text_html": c.text_html,
                    "is_correct": c.is_correct,
                })
            qd["specialchoices"] = []
            for sc in q.specialchoices.all().order_by("order"):
                qd["specialchoices"].append({
                    "id": sc.id,
                    "order": sc.order,
                    "text_html": sc.text_html,
                })
            questions.append(qd)

        data = {
            "id": exam.id,
            "name": exam.name,
            "completed": exam.completed,
            "questions": questions,
            "default_time_seconds": 60 * 60,  # 1 hour default
            "total_questions": exam.questions.count(),
        }
        resp = Response(data)
        return add_cors_headers(resp, request)
    



class AttemptAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        exam = get_object_or_404(ATI, id=exam_id)
        try:
            attempt = Attempt.objects.get(user=request.user, exam=exam)
            # return attempt data
            data = {
                "id": attempt.id,
                "time_spent": attempt.time_spent,
                "last_question": attempt.last_question,
                "answers": attempt.answers,
                "is_completed": attempt.is_completed,
                "grade": attempt.grade,
                "points_scored": attempt.points_scored,
                "total_questions": attempt.total_questions,
                "started_at": attempt.started_at,
                "updated_at": attempt.updated_at,
            }
            resp = Response(data)
            return add_cors_headers(resp, request)
        except Attempt.DoesNotExist:
            resp = Response({}, status=status.HTTP_204_NO_CONTENT)
            return add_cors_headers(resp, request)

    def post(self, request, exam_id, format=None):
        """
        Create or update an attempt.
        Expected body (JSON):
        {
          "time_spent": int_seconds,
          "last_question": int,
          "answers": { "<question_id>": <choice_id | [specialchoice_ids]>, ... },
          "is_completed": bool,
          "grade": float (optional),
          "points_scored": int (optional),
          "total_questions": int (optional)
        }
        """
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        exam = get_object_or_404(ATI, id=exam_id)
        payload = request.data or {}
        time_spent = payload.get("time_spent", 0)
        last_question = payload.get("last_question", 1)
        answers = payload.get("answers", {})
        is_completed = payload.get("is_completed", False)
        grade = payload.get("grade", None)
        points_scored = payload.get("points_scored", None)
        total_questions = payload.get("total_questions", None)

        attempt, created = Attempt.objects.get_or_create(user=request.user, exam=exam, defaults={
            "time_spent": time_spent,
            "last_question": last_question,
            "answers": answers,
            "is_completed": is_completed,
            "grade": grade,
            "points_scored": points_scored,
            "total_questions": total_questions,
        })
        if not created:
            attempt.time_spent = time_spent
            attempt.last_question = last_question
            attempt.answers = answers
            attempt.is_completed = is_completed
            attempt.grade = grade
            attempt.points_scored = points_scored
            if total_questions:
                attempt.total_questions = total_questions
            attempt.save()

        data = {"id": attempt.id, "created": created}
        resp = Response(data, status=status.HTTP_200_OK)
        return add_cors_headers(resp, request)


class BookmarkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        if not question_id:
            return add_cors_headers(Response({"detail": "question_id required"}, status=status.HTTP_400_BAD_REQUEST), request)
        question = get_object_or_404(Question, id=question_id)
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, question=question)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        resp = Response({"id": bookmark.id, "created": created}, status=status_code)
        return add_cors_headers(resp, request)

    def delete(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        if not question_id:
            return add_cors_headers(Response({"detail": "question_id required"}, status=status.HTTP_400_BAD_REQUEST), request)
        try:
            bookmark = Bookmark.objects.get(user=request.user, question_id=question_id)
            bookmark.delete()
            resp = Response({"deleted": True}, status=status.HTTP_200_OK)
            return add_cors_headers(resp, request)
        except Bookmark.DoesNotExist:
            resp = Response({"deleted": False}, status=status.HTTP_404_NOT_FOUND)
            return add_cors_headers(resp, request)


class ReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        exam_id = request.data.get("exam_id")
        description = request.data.get("description", "")
        if not question_id or not exam_id or description.strip() == "":
            return add_cors_headers(Response({"detail": "question_id, exam_id and description are required"}, status=status.HTTP_400_BAD_REQUEST), request)
        question = get_object_or_404(Question, id=question_id)
        exam = get_object_or_404(ATI, id=exam_id)
        report = Report.objects.create(user=request.user, exam=exam, question=question, description=description)
        resp = Response({"id": report.id, "created": True}, status=status.HTTP_201_CREATED)
        return add_cors_headers(resp, request)









class HESIAttemptAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        exam = get_object_or_404(HESI, id=exam_id)
        try:
            attempt = HESIAttempt.objects.get(user=request.user, exam=exam)
            # return attempt data
            data = {
                "id": attempt.id,
                "time_spent": attempt.time_spent,
                "last_question": attempt.last_question,
                "answers": attempt.answers,
                "is_completed": attempt.is_completed,
                "grade": attempt.grade,
                "points_scored": attempt.points_scored,
                "total_questions": attempt.total_questions,
                "started_at": attempt.started_at,
                "updated_at": attempt.updated_at,
            }
            resp = Response(data)
            return add_cors_headers(resp, request)
        except HESIAttempt.DoesNotExist:
            resp = Response({}, status=status.HTTP_204_NO_CONTENT)
            return add_cors_headers(resp, request)

    def post(self, request, exam_id, format=None):
        """
        Create or update an attempt.
        Expected body (JSON):
        {
          "time_spent": int_seconds,
          "last_question": int,
          "answers": { "<question_id>": <choice_id | [specialchoice_ids]>, ... },
          "is_completed": bool,
          "grade": float (optional),
          "points_scored": int (optional),
          "total_questions": int (optional)
        }
        """
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        exam = get_object_or_404(HESI, id=exam_id)
        payload = request.data or {}
        time_spent = payload.get("time_spent", 0)
        last_question = payload.get("last_question", 1)
        answers = payload.get("answers", {})
        is_completed = payload.get("is_completed", False)
        grade = payload.get("grade", None)
        points_scored = payload.get("points_scored", None)
        total_questions = payload.get("total_questions", None)

        attempt, created = HESIAttempt.objects.get_or_create(user=request.user, exam=exam, defaults={
            "time_spent": time_spent,
            "last_question": last_question,
            "answers": answers,
            "is_completed": is_completed,
            "grade": grade,
            "points_scored": points_scored,
            "total_questions": total_questions,
        })
        if not created:
            attempt.time_spent = time_spent
            attempt.last_question = last_question
            attempt.answers = answers
            attempt.is_completed = is_completed
            attempt.grade = grade
            attempt.points_scored = points_scored
            if total_questions:
                attempt.total_questions = total_questions
            attempt.save()

        data = {"id": attempt.id, "created": created}
        resp = Response(data, status=status.HTTP_200_OK)
        return add_cors_headers(resp, request)


class HESIBookmarkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        if not question_id:
            return add_cors_headers(Response({"detail": "question_id required"}, status=status.HTTP_400_BAD_REQUEST), request)
        question = get_object_or_404(HESIQuestion, id=question_id)
        bookmark, created = HESIBookmark.objects.get_or_create(user=request.user, question=question)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        resp = Response({"id": bookmark.id, "created": created}, status=status_code)
        return add_cors_headers(resp, request)

    def delete(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        if not question_id:
            return add_cors_headers(Response({"detail": "question_id required"}, status=status.HTTP_400_BAD_REQUEST), request)
        try:
            bookmark = HESIBookmark.objects.get(user=request.user, question_id=question_id)
            bookmark.delete()
            resp = Response({"deleted": True}, status=status.HTTP_200_OK)
            return add_cors_headers(resp, request)
        except HESIBookmark.DoesNotExist:
            resp = Response({"deleted": False}, status=status.HTTP_404_NOT_FOUND)
            return add_cors_headers(resp, request)


class HESIReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        if not getattr(request.user, "is_regular_user", False):
            return add_cors_headers(Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN), request)
        question_id = request.data.get("question_id")
        exam_id = request.data.get("exam_id")
        description = request.data.get("description", "")
        if not question_id or not exam_id or description.strip() == "":
            return add_cors_headers(Response({"detail": "question_id, exam_id and description are required"}, status=status.HTTP_400_BAD_REQUEST), request)
        question = get_object_or_404(HESIQuestion, id=question_id)
        exam = get_object_or_404(HESI, id=exam_id)
        report = Report.objects.create(user=request.user, exam=exam, question=question, description=description)
        resp = Response({"id": report.id, "created": True}, status=status.HTTP_201_CREATED)
        return add_cors_headers(resp, request)
