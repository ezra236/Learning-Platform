# api/progress.py
import math
from statistics import mean
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import Attempt, HESIAttempt, ATI, HESI, Question, HESIQuestion

# helper
def percent_from_points(points, total_questions):
    if total_questions and total_questions > 0:
        return (points / total_questions) * 100
    return None

def grade_letter_from_percent(pct):
    if pct is None:
        return None
    if pct >= 90:
        return "A"
    if pct >= 80:
        return "B"
    if pct >= 70:
        return "C"
    if pct >= 60:
        return "D"
    return "F"


class ProgressATIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        attempts = Attempt.objects.filter(user=user).select_related('exam').order_by('started_at')
        exams = []
        total_time_spent = 0
        total_questions_attempted = 0
        points_list = []

        for a in attempts:
            exam = a.exam
            total_questions = a.total_questions or exam.questions.count()
            answers = a.answers or {}
            questions_attempted = len(answers)
            total_questions_attempted += questions_attempted
            time_spent = a.time_spent or 0
            total_time_spent += time_spent

            points = a.points_scored if a.points_scored is not None else None
            pct = None
            if points is not None:
                pct = percent_from_points(points, total_questions)
                points_list.append(pct)
            elif a.grade is not None:
                pct = a.grade  # assume grade field is percent-like
                points_list.append(pct)

            grade_letter = grade_letter_from_percent(pct)

            progress_percent = None
            if total_questions:
                progress_percent = (questions_attempted / total_questions) * 100

            exams.append({
                "exam_id": str(exam.id),
                "name": exam.name,
                "completed": bool(a.is_completed),
                "grade_percent": None if pct is None else round(pct, 2),
                "grade_letter": grade_letter,
                "points_scored": points,
                "time_spent_seconds": time_spent,
                "questions_attempted": questions_attempted,
                "total_questions": total_questions,
                "progress_percent": None if progress_percent is None else round(progress_percent, 2),
                "started_at": a.started_at,
                "updated_at": a.updated_at,
            })

        # overall counts
        exams_done = sum(1 for e in exams if e["completed"])
        # percentage change heuristic:
        # split attempts into older half and newer half, compare average percent if available
        perc_change = None
        perc_old = None
        perc_new = None
        pct_values = [e["grade_percent"] for e in exams if e["grade_percent"] is not None]
        if len(pct_values) >= 2:
            half = len(pct_values) // 2
            old = pct_values[:half]
            new = pct_values[half:]
            if old and new:
                perc_old = mean(old)
                perc_new = mean(new)
                if perc_old == 0:
                    perc_change = None
                else:
                    perc_change = ((perc_new - perc_old) / perc_old) * 100

        # needs improvement: examine exams with progress < 50 or grade D/F or missing grade
        needs_improvement = []
        for e in exams:
            if (e["grade_percent"] is not None and e["grade_percent"] < 70) or (e["progress_percent"] is not None and e["progress_percent"] < 50) or e["grade_percent"] is None:
                needs_improvement.append({
                    "exam_id": e["exam_id"],
                    "name": e["name"],
                    "reason": ("low_grade" if (e["grade_percent"] is not None and e["grade_percent"] < 70) else ("low_progress" if (e["progress_percent"] is not None and e["progress_percent"] < 50) else "no_grade"))
                })

        # prepare chart-friendly aggregates: grade distribution (A,B,C,D,F)
        distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0, "Unknown": 0}
        for e in exams:
            if e["grade_letter"]:
                distribution[e["grade_letter"]] = distribution.get(e["grade_letter"], 0) + 1
            else:
                distribution["Unknown"] += 1

        response = {
            "exams": exams,
            "aggregate": {
                "exams_count": len(exams),
                "exams_completed": exams_done,
                "total_time_spent_seconds": total_time_spent,
                "total_questions_attempted": total_questions_attempted,
                "average_score_percent": None if not points_list else round(mean(points_list), 2),
                "percentage_change_over_time": None if perc_change is None else round(perc_change, 2),
                "grade_distribution": distribution,
                "needs_improvement": needs_improvement,
            }
        }
        return Response(response)


class ProgressHESIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        attempts = HESIAttempt.objects.filter(user=user).select_related('exam').order_by('started_at')
        exams = []
        total_time_spent = 0
        total_questions_attempted = 0
        points_list = []

        for a in attempts:
            exam = a.exam
            total_questions = a.total_questions or exam.questions.count()
            answers = a.answers or {}
            questions_attempted = len(answers)
            total_questions_attempted += questions_attempted
            time_spent = a.time_spent or 0
            total_time_spent += time_spent

            points = a.points_scored if a.points_scored is not None else None
            pct = None
            if points is not None:
                pct = percent_from_points(points, total_questions)
                points_list.append(pct)
            elif a.grade is not None:
                pct = a.grade
                points_list.append(pct)

            grade_letter = grade_letter_from_percent(pct)

            progress_percent = None
            if total_questions:
                progress_percent = (questions_attempted / total_questions) * 100

            exams.append({
                "exam_id": str(exam.id),
                "name": exam.name,
                "completed": bool(a.is_completed),
                "grade_percent": None if pct is None else round(pct, 2),
                "grade_letter": grade_letter,
                "points_scored": points,
                "time_spent_seconds": time_spent,
                "questions_attempted": questions_attempted,
                "total_questions": total_questions,
                "progress_percent": None if progress_percent is None else round(progress_percent, 2),
                "started_at": a.started_at,
                "updated_at": a.updated_at,
            })

        exams_done = sum(1 for e in exams if e["completed"])

        # percent change heuristic similar to ATI
        perc_change = None
        pct_values = [e["grade_percent"] for e in exams if e["grade_percent"] is not None]
        if len(pct_values) >= 2:
            half = len(pct_values) // 2
            old = pct_values[:half]
            new = pct_values[half:]
            if old and new:
                perc_old = mean(old)
                perc_new = mean(new)
                if perc_old != 0:
                    perc_change = ((perc_new - perc_old) / perc_old) * 100

        needs_improvement = []
        for e in exams:
            if (e["grade_percent"] is not None and e["grade_percent"] < 70) or (e["progress_percent"] is not None and e["progress_percent"] < 50) or e["grade_percent"] is None:
                needs_improvement.append({
                    "exam_id": e["exam_id"],
                    "name": e["name"],
                    "reason": ("low_grade" if (e["grade_percent"] is not None and e["grade_percent"] < 70) else ("low_progress" if (e["progress_percent"] is not None and e["progress_percent"] < 50) else "no_grade"))
                })

        distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0, "Unknown": 0}
        for e in exams:
            if e["grade_letter"]:
                distribution[e["grade_letter"]] = distribution.get(e["grade_letter"], 0) + 1
            else:
                distribution["Unknown"] += 1

        response = {
            "exams": exams,
            "aggregate": {
                "exams_count": len(exams),
                "exams_completed": exams_done,
                "total_time_spent_seconds": total_time_spent,
                "total_questions_attempted": total_questions_attempted,
                "average_score_percent": None if not points_list else round(mean(points_list), 2),
                "percentage_change_over_time": None if perc_change is None else round(perc_change, 2),
                "grade_distribution": distribution,
                "needs_improvement": needs_improvement,
            }
        }
        return Response(response)
