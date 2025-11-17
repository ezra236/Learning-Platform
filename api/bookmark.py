# api/views.py
import json
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Bookmark, Question, Choice, SpecialChoice, Attempt,
    HESIBookmark, HESIQuestion, HESIChoice, HESISpecialChoice, HESIAttempt,
    ATI, HESI
)

class BookmarkedQuestionsAPIView(APIView):
    """
    Return bookmarked questions for the authenticated user from both ATI and HESI.
    Response format: list of objects with keys:
      - source: "ati" or "hesi"
      - exam_id, exam_name
      - question: serialized question fields (id, order, format, question_html, paragraph_html, table_html, image_url, explanation_html, special_correct_order)
      - choices: list of choices (id, text_html, order, is_correct)
      - specialchoices: list of specialchoices (id, text_html, order)
      - user_selected: the value from Attempt.answers for that question (Choice id int or list of specialchoice ids) or null
      - bookmark_created_at
    """
    permission_classes = [IsAuthenticated]

    def _serialize_choice(self, c):
        return {
            "id": c.id,
            "text_html": c.text_html,
            "order": c.order,
            "is_correct": c.is_correct
        }

    def _serialize_specialchoice(self, sc):
        return {
            "id": sc.id,
            "text_html": sc.text_html,
            "order": sc.order
        }

    def _get_user_answer_for_question(self, user, question):
        """
        Locate the user's attempt for the question's exam and return answer for this question.
        Returns None if no attempt or no entry.
        """
        exam = question.exam
        try:
            attempt = Attempt.objects.filter(user=user, exam=exam).first()
            if not attempt:
                return None
            answers = attempt.answers or {}
            qid = str(question.id)
            if qid in answers:
                return answers[qid]
            if question.id in answers:
                return answers[question.id]
            return None
        except Exception:
            return None

    def _get_user_answer_for_hesi_question(self, user, question):
        exam = question.exam
        try:
            attempt = HESIAttempt.objects.filter(user=user, exam=exam).first()
            if not attempt:
                return None
            answers = attempt.answers or {}
            qid = str(question.id)
            if qid in answers:
                return answers[qid]
            if question.id in answers:
                return answers[question.id]
            return None
        except Exception:
            return None

    def get(self, request, format=None):
        user = request.user
        data = []

        # ATI bookmarks
        ati_bookmarks = Bookmark.objects.filter(user=user).select_related('question', 'question__exam').order_by('-created_at')
        for bm in ati_bookmarks:
            q = bm.question
            exam = q.exam
            choices = [self._serialize_choice(c) for c in q.choices.all().order_by('order')]
            specialchoices = [self._serialize_specialchoice(sc) for sc in q.specialchoices.all().order_by('order')]
            user_selected = self._get_user_answer_for_question(user, q)
            data.append({
                "source": "ati",
                "bookmark_id": str(bm.id),
                "exam_id": str(exam.id),
                "exam_name": exam.name,
                "question": {
                    "id": q.id,
                    "order": q.order,                     # <<< added order
                    "format": q.format,
                    "question_html": q.question_html,
                    "paragraph_html": q.paragraph_html,
                    "table_html": q.table_html,
                    "image_url": q.image_url,
                    "explanation_html": q.explanation_html,
                    "special_correct_order": q.special_correct_order or []
                },
                "choices": choices,
                "specialchoices": specialchoices,
                "user_selected": user_selected,
                "bookmark_created_at": bm.created_at
            })

        # HESI bookmarks
        hesi_bookmarks = HESIBookmark.objects.filter(user=user).select_related('question', 'question__exam').order_by('-created_at')
        for bm in hesi_bookmarks:
            q = bm.question
            exam = q.exam
            choices = [ {
                "id": c.id,
                "text_html": c.text_html,
                "order": c.order,
                "is_correct": c.is_correct
            } for c in q.choices.all().order_by('order') ]
            specialchoices = [ {
                "id": sc.id,
                "text_html": sc.text_html,
                "order": sc.order
            } for sc in q.specialchoices.all().order_by('order') ]
            user_selected = self._get_user_answer_for_hesi_question(user, q)
            data.append({
                "source": "hesi",
                "bookmark_id": str(bm.id),
                "exam_id": str(exam.id),
                "exam_name": exam.name,
                "question": {
                    "id": q.id,
                    "order": q.order,                     # <<< added order
                    "format": q.format,
                    "question_html": q.question_html,
                    "paragraph_html": q.paragraph_html,
                    "table_html": q.table_html,
                    "image_url": q.image_url,
                    "explanation_html": q.explanation_html,
                    "special_correct_order": q.special_correct_order or []
                },
                "choices": choices,
                "specialchoices": specialchoices,
                "user_selected": user_selected,
                "bookmark_created_at": bm.created_at
            })

        # Sort by bookmark_created_at descending for combined list
        data_sorted = sorted(data, key=lambda x: x.get("bookmark_created_at") or "", reverse=True)
        for item in data_sorted:
            if item.get("bookmark_created_at") is not None:
                item["bookmark_created_at"] = item["bookmark_created_at"].isoformat()
        return Response(data_sorted)
