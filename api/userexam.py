from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.utils import timezone
from django.db.models import Q

from .models import Subscription, Plan, ExamType, ATI, HESI, Attempt

@require_GET
def user_exams_dashboard(request):
    """
    Returns:
    {
      "exam_types": ["ATI_TEAS_7", "HESI_A2"],
      "ati_exams": [
        {
          "name": "ATI Exam 1",
          "total_questions": 170,
          "user_progress": 45
        }
      ],
      "hesi_exams": [
        {
          "name": "HESI Exam 1",
          "total_questions": 150,
          "user_progress": 0
        }
      ],
      "total_questions_count": 320
    }
    Notes:
      - Only exams marked isfree=True are returned for an exam type when the user's
        only active subscription for that exam type has amount == 0.
      - If the user has a paid subscription (amount > 0) for the exam type, all completed exams
        are returned (free and non-free).
    """
    user = request.user
    now = timezone.now()

    if not user.is_authenticated:
        return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)

    # Only allow regular users per your requirement
    if not getattr(user, "is_regular_user", False):
        return JsonResponse({"detail": "Forbidden. Only regular users may access this endpoint."}, status=403)

    # Get active subscriptions for this user (finish_date in the future)
    subs = Subscription.objects.filter(user=user, finish_date__gte=now).select_related("plan")

    # Build sets: which exam types have free subscriptions and which have paid subscriptions
    free_exam_types = set()
    paid_exam_types = set()
    for s in subs:
        et = s.plan.exam_type
        try:
            amount = float(getattr(s, "amount", 0) or 0)
        except (TypeError, ValueError):
            amount = 0
        if amount == 0:
            free_exam_types.add(et)
        elif amount > 0:
            paid_exam_types.add(et)

    # Combined exam types user has access to (as strings for JSON safety)
    exam_types_set = {s.plan.exam_type for s in subs}
    # Convert to JSON-serializable strings (handle enum-like objects)
    def _et_to_str(et):
        if et is None:
            return ""
        if isinstance(et, str):
            return et
        return getattr(et, "name", getattr(et, "value", str(et)))

    exam_types = [_et_to_str(et) for et in exam_types_set]

    response = {
        "exam_types": exam_types,
        "ati_exams": [],
        "hesi_exams": [],
        "total_questions_count": 0
    }

    total_questions = 0

    # Helper to calculate user progress for an exam and attempt
    def _calc_progress(user, exam, attempt_qs_name="answers"):
        user_progress = 0
        attempt = Attempt.objects.filter(user=user, exam=exam).first()
        if attempt:
            # attempt.answers may be a list/JSONField/related structure; keep existing behavior
            answered_count = len(getattr(attempt, attempt_qs_name, [])) if getattr(attempt, attempt_qs_name, None) else 0
            total_qs = exam.questions.count()
            if total_qs > 0:
                user_progress = min(100, int((answered_count / total_qs) * 100))
        return user_progress

    # If user has ATI subscription, include ATI exam data
    # We check whether user's subscriptions for ATI are free-only or include paid
    ati_et = ExamType.ATI_TEAS_7
    if ati_et in exam_types_set or _et_to_str(ati_et) in exam_types:
        # Determine which queryset to use:
        # - If user has any paid subscription for ATI -> include all completed ATI exams
        # - Else if user has free subscription for ATI (and no paid) -> include only isfree=True
        if ati_et in paid_exam_types:
            ati_qs = ATI.objects.filter(completed=True).order_by("name")
        elif ati_et in free_exam_types:
            # free-only
            ati_qs = ATI.objects.filter(completed=True, isfree=True).order_by("name")
        else:
            # No active subscription for ATI (shouldn't happen because we checked exam_types_set),
            # but handle defensively.
            ati_qs = ATI.objects.none()

        ati_exams = []
        for exam in ati_qs:
            total_questions_exam = exam.questions.count()
            total_questions += total_questions_exam

            user_progress = _calc_progress(user, exam, "answers")
            ati_exams.append({
                "name": exam.name,
                "total_questions": total_questions_exam,
                "user_progress": user_progress
            })

        response["ati_exams"] = ati_exams

    # If user has HESI subscription, include HESI exam data
    hesi_et = ExamType.HESI_A2
    if hesi_et in exam_types_set or _et_to_str(hesi_et) in exam_types:
        if hesi_et in paid_exam_types:
            hesi_qs = HESI.objects.filter(completed=True).order_by("name")
        elif hesi_et in free_exam_types:
            hesi_qs = HESI.objects.filter(completed=True, isfree=True).order_by("name")
        else:
            hesi_qs = HESI.objects.none()

        hesi_exams = []
        for exam in hesi_qs:
            total_questions_exam = exam.questions.count()
            total_questions += total_questions_exam

            # For HESI, existing behavior was to set progress to 0 until attempts are implemented.
            # If you have Attempt entries for HESI, you can reuse _calc_progress similarly.
            user_progress = 0
            # Optionally uncomment to calculate if Attempt model supports HESI attempts:
            # user_progress = _calc_progress(user, exam, "answers")

            hesi_exams.append({
                "name": exam.name,
                "total_questions": total_questions_exam,
                "user_progress": user_progress
            })

        response["hesi_exams"] = hesi_exams

    response["total_questions_count"] = total_questions

    return JsonResponse(response, status=200, safe=False)
