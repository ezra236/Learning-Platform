# analytics.py
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from .models import User  # your custom User model

def _attach_cors_headers(response, request):
    origin = request.META.get("HTTP_ORIGIN")
    if origin:
        response["Access-Control-Allow-Origin"] = origin
    else:
        response["Access-Control-Allow-Origin"] = getattr(settings, "CORS_ALLOW_ORIGIN", "*")
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
    return response


@login_required
@require_http_methods(["GET", "OPTIONS"])
def today_signed_in_count(request):
    """
    Returns JSON:
    {
      "count": int,
      "percent_change": float|null,   # null when not computable (e.g. yesterday == 0 and today > 0)
      "trend": "up"|"down"|"none",
      "today_start": ISO8601,
      "yesterday_start": ISO8601
    }
    """
    # Reply to preflight
    if request.method == "OPTIONS":
        response = HttpResponse()
        return _attach_cors_headers(response, request)

    now = timezone.now()
    tz = timezone.get_default_timezone()
    # define day boundaries in server default timezone
    today_start = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    # Count users with role regular_user and a last_login inside ranges
    today_count = User.objects.filter(
        role=User.Role.REGULAR_USER,
        last_login__gte=today_start,
        last_login__lte=now
    ).count()

    yesterday_count = User.objects.filter(
        role=User.Role.REGULAR_USER,
        last_login__gte=yesterday_start,
        last_login__lt=today_start
    ).count()

    # compute percent change
    percent_change = None
    trend = "none"
    if yesterday_count == 0:
        if today_count == 0:
            percent_change = 0.0
            trend = "none"
        else:
            # mathematically infinite increase; return null and set trend to "up"
            percent_change = None
            trend = "up"
    else:
        change = (Decimal(today_count) - Decimal(yesterday_count)) / Decimal(yesterday_count) * Decimal(100)
        # Cast to float for JSON; round to one decimal place
        percent_change = float(round(change, 1))
        if change > 0:
            trend = "up"
        elif change < 0:
            trend = "down"
        else:
            trend = "none"

    payload = {
        "count": today_count,
        "percent_change": percent_change,
        "trend": trend,
        "today_start": today_start.isoformat(),
        "yesterday_start": yesterday_start.isoformat(),
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)



@login_required
@require_http_methods(["GET", "OPTIONS"])
def total_registered_verified(request):
    """
    Returns JSON:
    {
      "count": int,                    # verified regular users who joined in the last 7 days
      "percent_change": float|null,    # percent change vs previous 7-day period (null when undefined)
      "trend": "up"|"down"|"none",
      "current_period_start": ISO8601,
      "previous_period_start": ISO8601
    }
    Periods:
      current = [now - 7 days, now]
      previous = [now - 14 days, now - 7 days)
    """
    # Preflight
    if request.method == "OPTIONS":
        response = HttpResponse()
        return _attach_cors_headers(response, request)

    now = timezone.now()
    current_start = now - timedelta(days=7)
    previous_start = now - timedelta(days=14)
    previous_end = current_start

    # current 7-day verified regular users (based on date_joined)
    current_count = User.objects.filter(
        role=User.Role.REGULAR_USER,
        email_verified=True,
        date_joined__gte=current_start,
        date_joined__lte=now
    ).count()

    # previous 7-day window
    previous_count = User.objects.filter(
        role=User.Role.REGULAR_USER,
        email_verified=True,
        date_joined__gte=previous_start,
        date_joined__lt=previous_end
    ).count()

    percent_change = None
    trend = "none"

    if previous_count == 0:
        if current_count == 0:
            percent_change = 0.0
            trend = "none"
        else:
            # undefined/infinite increase
            percent_change = None
            trend = "up"
    else:
        change = (Decimal(current_count) - Decimal(previous_count)) / Decimal(previous_count) * Decimal(100)
        percent_change = float(round(change, 1))
        if change > 0:
            trend = "up"
        elif change < 0:
            trend = "down"
        else:
            trend = "none"

    payload = {
        "count": current_count,
        "percent_change": percent_change,
        "trend": trend,
        "current_period_start": current_start.isoformat(),
        "previous_period_start": previous_start.isoformat(),
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)



from django.db.models import Sum, Count, Value
from django.db.models.functions import Coalesce
from .models import Subscription, User  # Subscription model is in your models file already

# reuse _attach_cors_headers defined earlier in your file

@login_required
@require_http_methods(["GET", "OPTIONS"])
def today_payments(request):
    """
    Returns JSON:
    {
      "count": int,                        # number of transactions created today
      "amount": float,                     # sum of amount for today (rounded to 2 dp)
      "count_percent_change": float|null,  # percent change vs yesterday for count
      "count_trend": "up"|"down"|"none",
      "amount_percent_change": float|null, # percent change vs yesterday for amount
      "amount_trend": "up"|"down"|"none",
      "today_start": ISO8601,
      "yesterday_start": ISO8601
    }
    """
    # Preflight
    if request.method == "OPTIONS":
        response = HttpResponse()
        return _attach_cors_headers(response, request)

    now = timezone.now()
    tz = timezone.get_default_timezone()
    today_start = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    # Transactions are represented by Subscription.created_at
    # Current day: [today_start, now]
    # Yesterday: [yesterday_start, today_start)
    current_qs = Subscription.objects.filter(created_at__gte=today_start, created_at__lte=now)
    previous_qs = Subscription.objects.filter(created_at__gte=yesterday_start, created_at__lt=today_start)

    # aggregate counts and sums (coalesce to 0 to avoid None)
    current_agg = current_qs.aggregate(
        count=Coalesce(Count("id"), Value(0)),
        amount=Coalesce(Sum("amount"), Value(Decimal("0.00"))),
    )
    previous_agg = previous_qs.aggregate(
        count=Coalesce(Count("id"), Value(0)),
        amount=Coalesce(Sum("amount"), Value(Decimal("0.00"))),
    )

    # Extract values and normalize types
    current_count = int(current_agg.get("count") or 0)
    previous_count = int(previous_agg.get("count") or 0)

    # amount may be Decimal or numeric
    current_amount = current_agg.get("amount") or Decimal("0.00")
    previous_amount = previous_agg.get("amount") or Decimal("0.00")

    # ensure Decimal
    if not isinstance(current_amount, Decimal):
        try:
            current_amount = Decimal(str(current_amount))
        except (InvalidOperation, TypeError):
            current_amount = Decimal("0.00")

    if not isinstance(previous_amount, Decimal):
        try:
            previous_amount = Decimal(str(previous_amount))
        except (InvalidOperation, TypeError):
            previous_amount = Decimal("0.00")

    # round amounts to 2 decimal places for presentation
    current_amount = current_amount.quantize(Decimal("0.01"))
    previous_amount = previous_amount.quantize(Decimal("0.01"))

    # Helper to compute percent change & trend for a pair of values
    def compute_change_and_trend(current, previous):
        percent = None
        trend = "none"
        if previous == 0:
            if current == 0:
                percent = float(Decimal("0.0"))
                trend = "none"
            else:
                percent = None  # undefined / infinite increase
                trend = "up"
        else:
            try:
                change = (Decimal(current) - Decimal(previous)) / Decimal(previous) * Decimal(100)
                percent = float(round(change, 1))
                if change > 0:
                    trend = "up"
                elif change < 0:
                    trend = "down"
                else:
                    trend = "none"
            except (InvalidOperation, ZeroDivisionError):
                percent = None
                trend = "none"
        return percent, trend

    count_percent_change, count_trend = compute_change_and_trend(current_count, previous_count)
    amount_percent_change, amount_trend = compute_change_and_trend(current_amount, previous_amount)

    payload = {
        "count": current_count,
        # return amount as float (2 dp); you can also return string if you prefer exact precision
        "amount": float(current_amount),
        "count_percent_change": count_percent_change,
        "count_trend": count_trend,
        "amount_percent_change": amount_percent_change,
        "amount_trend": amount_trend,
        "today_start": today_start.isoformat(),
        "yesterday_start": yesterday_start.isoformat(),
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)




import json
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from datetime import timedelta
from .models import PageVisitRecord

@csrf_protect
@require_http_methods(["POST", "OPTIONS"])
def record_page_visit(request):
    """
    Accepts POST JSON:
      { "page": "/home", "visits": 1 }   # visits optional, default 1

    Creates a PageVisitRecord with the provided page and visits and recorded_at=now.
    Returns: { "ok": True, "id": "<uuid>" }
    """
    # Preflight
    if request.method == "OPTIONS":
        response = HttpResponse()
        return _attach_cors_headers(response, request)

    # parse JSON body
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, TypeError):
        return _attach_cors_headers(HttpResponseBadRequest("invalid JSON"), request)

    page = (payload.get("page") or "").strip()
    if not page:
        return _attach_cors_headers(HttpResponseBadRequest("missing 'page'"), request)

    try:
        visits = int(payload.get("visits", 1) or 1)
        if visits < 0:
            visits = 1
    except (ValueError, TypeError):
        visits = 1

    now = timezone.now()
    record = PageVisitRecord.objects.create(
        page=page,
        visits=visits,
        recorded_at=now
    )

    data = {"ok": True, "id": str(record.id)}
    response = JsonResponse(data, status=201)
    return _attach_cors_headers(response, request)





# api/views.py
from datetime import timedelta
from django.http import JsonResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie, get_token
from django.db.models import Sum, Q

from .models import PageVisitRecord

@login_required
@require_http_methods(["GET"])
def page_visits_summary(request):
    """
    Returns a JSON array of pages with today's and yesterday's aggregated visits,
    percent change and trend.
    Only accessible to superadmins.
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        return HttpResponseForbidden({"detail": "superadmin required"})

    # Use local timezone-aware dates
    now = timezone.localtime()
    today = now.date()
    yesterday = today - timedelta(days=1)

    # Aggregate sums grouped by page
    qs = PageVisitRecord.objects.filter(recorded_at__date__in=[today, yesterday])

    agg = (
        qs.values("page")
        .annotate(
            today_visits=Sum("visits", filter=Q(recorded_at__date=today)),
            yesterday_visits=Sum("visits", filter=Q(recorded_at__date=yesterday)),
        )
    )

    pages = []
    for item in agg:
        page = item["page"]
        today_visits = int(item["today_visits"] or 0)
        yesterday_visits = int(item["yesterday_visits"] or 0)

        # percent change calculation
        if yesterday_visits == 0:
            if today_visits == 0:
                percent_change = 0.0
                trend = "same"
            else:
                # previous zero and now >0 — represent as 100% increase (client can treat specially)
                percent_change = 100.0
                trend = "increase"
        else:
            change = (today_visits - yesterday_visits) / float(yesterday_visits) * 100.0
            percent_change = round(change, 1)
            if percent_change > 0:
                trend = "increase"
            elif percent_change < 0:
                trend = "decrease"
            else:
                trend = "same"

        pages.append(
            {
                "page": page,
                "today_visits": today_visits,
                "yesterday_visits": yesterday_visits,
                "percent_change": percent_change,
                "trend": trend,
            }
        )

    # Sort pages by today_visits desc so UI shows biggest pages first
    pages.sort(key=lambda x: x["today_visits"], reverse=True)

    return JsonResponse({"ok": True, "generated_at": now.isoformat(), "pages": pages})






@login_required
@require_http_methods(["GET"])
def total_visitors_summary(request):
    """
    Returns aggregated totals across all pages and a month-over-month comparison.
    Only accessible to superadmin users.
    JSON:
    {
      "ok": true,
      "generated_at": "<iso>",
      "total_visits_all_time": 12345,
      "month_visits": 4567,
      "prev_month_visits": 4012,
      "percent_change": 13.9,
      "trend": "increase" | "decrease" | "same"
    }
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        return JsonResponse({"detail": "superadmin required"}, status=403)

    now = timezone.localtime()
    today = now.date()

    # current month start
    start_current_month = today.replace(day=1)

    # previous month span: compute previous month start and end
    prev_month_end = start_current_month - timedelta(days=1)
    start_prev_month = prev_month_end.replace(day=1)

    # totals
    total_all = PageVisitRecord.objects.aggregate(total=Sum("visits"))["total"] or 0

    month_agg = (
        PageVisitRecord.objects
        .filter(recorded_at__date__gte=start_current_month, recorded_at__date__lte=today)
        .aggregate(total=Sum("visits"))
    )
    month_visits = int(month_agg["total"] or 0)

    prev_agg = (
        PageVisitRecord.objects
        .filter(recorded_at__date__gte=start_prev_month, recorded_at__date__lte=prev_month_end)
        .aggregate(total=Sum("visits"))
    )
    prev_month_visits = int(prev_agg["total"] or 0)

    # percent change (prev -> current month)
    if prev_month_visits == 0:
        if month_visits == 0:
            percent_change = 0.0
            trend = "same"
        else:
            # previous zero and now >0: treat as 100% increase (client can render specially)
            percent_change = 100.0
            trend = "increase"
    else:
        change = (month_visits - prev_month_visits) / float(prev_month_visits) * 100.0
        percent_change = round(change, 1)
        if percent_change > 0:
            trend = "increase"
        elif percent_change < 0:
            trend = "decrease"
        else:
            trend = "same"

    return JsonResponse(
        {
            "ok": True,
            "generated_at": now.isoformat(),
            "total_visits_all_time": int(total_all),
            "month_visits": month_visits,
            "prev_month_visits": prev_month_visits,
            "percent_change": percent_change,
            "trend": trend,
        }
    )




# api/views.py
from datetime import timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
from django.db.models import Q

from .models import PageVisitRecord

try:
    from api.models import Subscription  # <-- adapt if your app/model differs
except Exception:
    Subscription = None  # we handle absent Subscription below



from django.views.decorators.http import require_GET

@login_required
@require_GET
def admin_stats_view(request):
    """
    Returns the dashboard stats.
    Only accessible to authenticated superadmins.
    Response JSON:
      {
        "users": 12800,
        "assistants": 156,
        "active_percent": "94%"
      }
    """
    user = request.user
    # Use your model's convenience property
    if not getattr(user, "is_superadmin", False):
        response = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(response, request)

    # Total users (all)
    total_users = User.objects.count()

    # Assistants count: users with role == ADMIN_ASSISTANT
    assistants_count = User.objects.filter(role=User.Role.ADMIN_ASSISTANT).count()

    # Active %: based on regular users with is_active == False as requested.
    total_regular = User.objects.filter(role=User.Role.REGULAR_USER).count()
    inactive_regular = User.objects.filter(role=User.Role.REGULAR_USER, is_active=False).count()

    if total_regular == 0:
        active_percent = 0
    else:
        active_percent = round(100 * (1 - (inactive_regular / total_regular)))

    # Format as "94%"
    active_percent_str = f"{active_percent}%"

    payload = {
        "users": total_users,
        "assistants": assistants_count,
        "active_percent": active_percent_str,
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)




@login_required
@require_GET
def admin_monthly_activity_view(request):
    """
    Returns counts of active regular users and admin assistants for the current month,
    the previous month, and the percentage change ((current - previous)/previous * 100).

    Requires authenticated superadmin.
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        response = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(response, request)

    now = timezone.now()

    # Start of current month (timezone-aware)
    start_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Start of previous month
    if start_current.month == 1:
        start_previous = start_current.replace(year=start_current.year - 1, month=12)
    else:
        start_previous = start_current.replace(month=start_current.month - 1)

    start_previous = start_previous.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_previous = start_current  # previous month is [start_previous, end_previous)

    def month_counts_for(role):
        """
        Count users with given role who are is_active=True and whose last_login is in the month.
        Excludes users with null last_login.
        """
        current_qs = User.objects.filter(
            role=role, is_active=True, last_login__gte=start_current
        )
        previous_qs = User.objects.filter(
            role=role, is_active=True, last_login__gte=start_previous, last_login__lt=end_previous
        )
        return current_qs.count(), previous_qs.count()

    reg_current, reg_previous = month_counts_for(User.Role.REGULAR_USER)
    asst_current, asst_previous = month_counts_for(User.Role.ADMIN_ASSISTANT)

    def pct_change(current, previous):
        if previous == 0:
            if current == 0:
                return 0.0
            return None  # indicate "no baseline" / new growth
        return round(((current - previous) / previous) * 100.0, 2)

    payload = {
        "regular": {
            "current_month_count": reg_current,
            "previous_month_count": reg_previous,
            "percent_change": pct_change(reg_current, reg_previous),  # float or null
        },
        "assistants": {
            "current_month_count": asst_current,
            "previous_month_count": asst_previous,
            "percent_change": pct_change(asst_current, asst_previous),
        },
        # include month starts so client can display what "this month" means
        "current_month_start": start_current.isoformat(),
        "previous_month_start": start_previous.isoformat(),
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)





from django.db.models import Sum, Value, DecimalField
def _start_of_month(dt):
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _add_month(dt):
    # returns first day of next month
    year = dt.year + (dt.month // 12)
    month = (dt.month % 12) + 1
    return dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)



@login_required
@require_GET
def admin_subscriptions_overview(request):
    user = request.user
    if not getattr(user, "is_superadmin", False):
        response = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(response, request)

    now = timezone.now()

    # month/year boundaries (same as before)
    start_current_month = _start_of_month(now)
    start_next_month = _add_month(start_current_month)

    if start_current_month.month == 1:
        start_previous_month = start_current_month.replace(year=start_current_month.year - 1, month=12)
    else:
        start_previous_month = start_current_month.replace(month=start_current_month.month - 1)
    start_previous_month = _start_of_month(start_previous_month)
    end_previous_month = start_current_month

    start_current_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Active subscriptions
    active_subs_qs = Subscription.objects.filter(finish_date__gte=now)
    total_active_subscriptions = active_subs_qs.count()
    unique_users_with_active_sub = active_subs_qs.values('user').distinct().count()
    total_regular_users = User.objects.filter(role=User.Role.REGULAR_USER).count()

    if total_regular_users == 0:
        subscription_rate = 0.0
    else:
        subscription_rate = round((unique_users_with_active_sub / total_regular_users) * 100.0, 2)

    # Use Value(0, output_field=DecimalField(...)) so Coalesce keeps Decimal type
    zero_decimal = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))

    # This month: created_at in [start_current_month, start_next_month)
    month_subs_qs = Subscription.objects.filter(created_at__gte=start_current_month, created_at__lt=start_next_month)
    month_sub_count = month_subs_qs.count()
    month_revenue_agg = month_subs_qs.aggregate(total=Coalesce(Sum('amount'), zero_decimal))
    month_revenue = Decimal(month_revenue_agg['total'] or 0)

    # Previous month
    prev_month_qs = Subscription.objects.filter(created_at__gte=start_previous_month, created_at__lt=end_previous_month)
    prev_month_sub_count = prev_month_qs.count()
    prev_month_revenue_agg = prev_month_qs.aggregate(total=Coalesce(Sum('amount'), zero_decimal))
    prev_month_revenue = Decimal(prev_month_revenue_agg['total'] or 0)

    # Current year revenue
    year_qs = Subscription.objects.filter(created_at__gte=start_current_year, created_at__lte=now)
    year_revenue_agg = year_qs.aggregate(total=Coalesce(Sum('amount'), zero_decimal))
    year_revenue = Decimal(year_revenue_agg['total'] or 0)

    def pct_change(current: Decimal, previous: Decimal):
        prev = Decimal(previous)
        cur = Decimal(current)
        if prev == 0:
            if cur == 0:
                return 0.0
            return None
        change = ((cur - prev) / prev) * Decimal(100)
        return float(round(change, 2))

    subs_count_pct_change = pct_change(Decimal(month_sub_count), Decimal(prev_month_sub_count))
    revenue_pct_change = pct_change(month_revenue, prev_month_revenue)

    payload = {
        "total_active_subscriptions": total_active_subscriptions,
        "unique_users_with_active_subscription": unique_users_with_active_sub,
        "total_regular_users": total_regular_users,
        "subscription_rate_percent": subscription_rate,
        "current_month": {
            "start": start_current_month.isoformat(),
            "end": start_next_month.isoformat(),
            "subscriptions_count": month_sub_count,
            "revenue": float(month_revenue),
        },
        "previous_month": {
            "start": start_previous_month.isoformat(),
            "end": end_previous_month.isoformat(),
            "subscriptions_count": prev_month_sub_count,
            "revenue": float(prev_month_revenue),
        },
        "current_year": {
            "start": start_current_year.isoformat(),
            "to": now.isoformat(),
            "revenue": float(year_revenue),
        },
        "percent_changes": {
            "subscriptions_count_percent_change": subs_count_pct_change,
            "revenue_percent_change": revenue_pct_change,
        },
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)





def _start_of_month(dt):
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _start_of_next_month(dt):
    # dt is first day of month
    year = dt.year + (dt.month // 12)
    month = (dt.month % 12) + 1
    return dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)


def _pct_change(current: int, previous: int):
    """
    Return float rounded to 2 decimals or None when previous == 0 and current > 0.
    If both zero -> 0.0
    """
    cur = Decimal(current)
    prev = Decimal(previous)
    if prev == 0:
        if cur == 0:
            return 0.0
        return None
    change = ((cur - prev) / prev) * Decimal(100)
    return float(round(change, 2))


@login_required
@require_GET
def admin_verified_users_overview(request):
    """
    Returns:
      - total_verified_count (email_verified == True)
      - verification_rate_percent (verified / total_users * 100)
      - monthly_trend_percent (verified this month vs previous month using date_joined as proxy)
      - pending_count (email_verified == False)
      - success_rate_percent (same as verification_rate_percent)
      - non_verified_rate_percent (100 - success_rate)
      - average_time_to_verify (approx in human readable form) — approximated as average(now - date_joined) for verified users
    Access: authenticated superadmin only.
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        resp = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(resp, request)

    now = timezone.now()

    # month boundaries
    start_current_month = _start_of_month(now)
    start_next_month = _start_of_next_month(start_current_month)

    # previous month boundaries
    if start_current_month.month == 1:
        prev_month_start = start_current_month.replace(year=start_current_month.year - 1, month=12)
    else:
        prev_month_start = start_current_month.replace(month=start_current_month.month - 1)
    prev_month_start = prev_month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_end = start_current_month

    # counts
    total_users = User.objects.count()
    total_verified = User.objects.filter(email_verified=True).count()
    pending_count = User.objects.filter(email_verified=False).count()

    # rates
    if total_users == 0:
        verification_rate = 0.0
    else:
        verification_rate = round((Decimal(total_verified) / Decimal(total_users)) * Decimal(100), 2)

    success_rate = verification_rate
    non_verified_rate = round(max(Decimal(0), Decimal(100) - Decimal(success_rate)), 2)

    # monthly trend (proxy): users with email_verified=True and date_joined in month
    current_month_verified = User.objects.filter(
        email_verified=True,
        date_joined__gte=start_current_month, date_joined__lt=start_next_month
    ).count()

    previous_month_verified = User.objects.filter(
        email_verified=True,
        date_joined__gte=prev_month_start, date_joined__lt=prev_month_end
    ).count()

    monthly_trend_percent = _pct_change(current_month_verified, previous_month_verified)

    # average time to verify (approximation): average of (now - date_joined) for currently verified users
    verified_qs = User.objects.filter(email_verified=True).values_list("date_joined", flat=True)
    verified_count = total_verified
    avg_time_seconds = None
    avg_time_display = None

    if verified_count > 0:
        total_seconds = 0.0
        for dj in verified_qs:
            # date_joined should be timezone-aware; ensure it's treated correctly
            diff = now - dj
            total_seconds += diff.total_seconds()
        avg_time_seconds = total_seconds / verified_count

        # present in a readable format: prefer days if >= 1 day, else hours
        days = int(avg_time_seconds // 86400)
        if days >= 1:
            avg_time_display = f"{days}d"
        else:
            hours = int(avg_time_seconds // 3600)
            if hours >= 1:
                avg_time_display = f"{hours}h"
            else:
                minutes = int(avg_time_seconds // 60)
                avg_time_display = f"{minutes}m"
    else:
        avg_time_display = None

    payload = {
        "total_verified_count": total_verified,
        "total_users": total_users,
        "verification_rate_percent": float(verification_rate),
        "monthly_trend": {
            "current_month_verified": current_month_verified,
            "previous_month_verified": previous_month_verified,
            "percent_change": monthly_trend_percent,  # float or null
            "current_month_start": start_current_month.isoformat(),
            "previous_month_start": prev_month_start.isoformat(),
        },
        "pending_count": pending_count,
        "success_rate_percent": float(success_rate),
        "non_verified_rate_percent": float(non_verified_rate),
        "average_time_display": avg_time_display,  # e.g. "48h" or "3d" or null
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)






@login_required
@require_GET
def admin_growth_pie_view(request):
    """
    Returns counts for the current calendar month for building the growth pie chart.
    Access control: authenticated superadmin only.
    Response:
    {
      "total_regular_users": 12847,
      "active_users": 11500,
      "new_signups": 320,
      "new_signins": 450,
      "inactive_email_not_verified": 1050,
      "banned_users": 297
    }
    Notes:
      - "New signups" = date_joined in current month (calendar month).
      - "New signins" = last_login in current month (calendar month).
      - "Active users" = role=regular_user and is_active=True (total active regulars).
      - "Inactive (email not verified)" = role=regular_user and email_verified=False.
      - "Banned" = role=regular_user and is_active=False.
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        resp = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(resp, request)

    now = timezone.now()
    start_current_month = _start_of_month(now)
    start_next_month = _start_of_next_month(start_current_month)

    # total regular users
    total_regular_users = User.objects.filter(role=User.Role.REGULAR_USER).count()

    # active regular users (is_active == True)
    active_users = User.objects.filter(role=User.Role.REGULAR_USER, is_active=True).count()

    # new signups: date_joined in current month
    new_signups = User.objects.filter(
        role=User.Role.REGULAR_USER,
        date_joined__gte=start_current_month,
        date_joined__lt=start_next_month
    ).count()

    # new signins: last_login in current month (exclude nulls)
    new_signins = User.objects.filter(
        role=User.Role.REGULAR_USER,
        last_login__gte=start_current_month,
        last_login__lt=start_next_month
    ).count()

    # inactive by email verification (email_verified == False)
    inactive_email_not_verified = User.objects.filter(role=User.Role.REGULAR_USER, email_verified=False).count()

    # banned users: is_active == False
    banned_users = User.objects.filter(role=User.Role.REGULAR_USER, is_active=False).count()

    payload = {
        "total_regular_users": total_regular_users,
        "active_users": active_users,
        "new_signups": new_signups,
        "new_signins": new_signins,
        "inactive_email_not_verified": inactive_email_not_verified,
        "banned_users": banned_users,
        "current_month_start": start_current_month.isoformat(),
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)








from decimal import Decimal
from datetime import timedelta
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.utils import timezone
from django.db.models import Sum, Value, DecimalField, IntegerField
from django.db.models.functions import Coalesce

# import your models
from api.models import Subscription, User, PageVisitRecord  # adjust import path as needed

# helper to get start-of-day
def _start_of_day(dt):
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(dt):
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _start_of_next_month(dt):
    year = dt.year + (dt.month // 12)
    month = (dt.month % 12) + 1
    return dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)


def _subtract_months(dt, months):
    """
    Subtract `months` months from dt (naive but handles year boundaries).
    """
    year = dt.year
    month = dt.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(dt.day, 28)  # avoid month overflow; we normalize to first day when needed
    return dt.replace(year=year, month=month, day=day, hour=0, minute=0, second=0, microsecond=0)


def _compute_prev_period(range_key, start, end, now):
    """
    Given current start/end, compute previous period's start/end for typical ranges.
    For calendar ranges (month/year) we treat previous as previous calendar period.
    """
    if range_key == "today":
        prev_start = start - timedelta(days=1)
        prev_end = start
    elif range_key in ("7d", "14d"):
        length = end - start
        prev_end = start
        prev_start = start - length
    elif range_key == "month":
        # previous calendar month
        prev_end = start
        prev_start = _start_of_month(_subtract_months(start, 1))
    elif range_key == "3m":
        prev_end = start
        prev_start = _start_of_day(_subtract_months(start, 3))
    elif range_key == "6m":
        prev_end = start
        prev_start = _start_of_day(_subtract_months(start, 6))
    elif range_key == "year":
        # previous calendar year
        prev_end = start
        prev_start = start.replace(year=start.year - 1, month=1, day=1)
    elif range_key == "last_year":
        # previous calendar year before last_year
        # If start is Jan 1 of last_year, previous is Jan 1 of (last_year -1)
        prev_end = start
        prev_start = start.replace(year=start.year - 1, month=1, day=1)
    else:
        # default to previous month
        prev_end = start
        prev_start = _start_of_month(_subtract_months(start, 1))

    return prev_start, prev_end


def _safe_percent_change(current, previous):
    """
    Return percent change as float. If previous == 0:
      - if current == 0 -> 0.0
      - if current > 0 -> 100.0 (we choose 100% to indicate growth from zero)
      - if current < 0 -> -100.0 (not likely for counts)
    """
    try:
        prev = Decimal(previous)
        cur = Decimal(current)
    except Exception:
        return None
    if prev == 0:
        if cur == 0:
            return 0.0
        # choose convention: growth from zero -> 100.0 (you can change to None if you prefer)
        return float((cur / (prev + Decimal(1))) * 100)  # (cur / 1) * 100 as a rough indicator
    else:
        pct = (cur - prev) / prev * Decimal(100)
        return float(pct)


@login_required
@require_GET
def admin_overview_bars_view(request):
    """
    GET /api/admin/overview-bars/?range=<range>
    range options: today, 7d, 14d, month, 3m, 6m, year, last_year

    Returns aggregated numbers and graph_data = [{ label, raw_current, raw_previous, percent_change }]
    """
    user = request.user
    if not getattr(user, "is_superadmin", False):
        resp = JsonResponse({"detail": "Forbidden"}, status=403)
        return _attach_cors_headers(resp, request)

    now = timezone.now()
    range_key = (request.GET.get("range") or "month").lower()

    # determine start / end (end is exclusive, except where we treat as 'now' for counts)
    if range_key == "today":
        start = _start_of_day(now)
        end = start + timedelta(days=1)
    elif range_key == "7d":
        start = now - timedelta(days=7)
        end = now
    elif range_key == "14d":
        start = now - timedelta(days=14)
        end = now
    elif range_key == "month":
        start = _start_of_month(now)
        end = now
    elif range_key == "3m":
        start = _start_of_day(_subtract_months(now, 3))
        end = now
    elif range_key == "6m":
        start = _start_of_day(_subtract_months(now, 6))
        end = now
    elif range_key == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif range_key == "last_year":
        # previous calendar year
        last_year = now.year - 1
        start = now.replace(year=last_year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1)  # start of next year
    else:
        start = _start_of_month(now)
        end = now

    prev_start, prev_end = _compute_prev_period(range_key, start, end, now)

    # use safe coalesce
    zero_decimal = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
    zero_int = Value(0, output_field=IntegerField())

    # Revenue: sum(amount) for subscriptions created in the [start, end)
    subs_current = Subscription.objects.filter(created_at__gte=start, created_at__lt=end)
    subs_prev = Subscription.objects.filter(created_at__gte=prev_start, created_at__lt=prev_end)

    revenue_current = subs_current.aggregate(total=Coalesce(Sum("amount"), zero_decimal))["total"] or Decimal(0)
    revenue_prev = subs_prev.aggregate(total=Coalesce(Sum("amount"), zero_decimal))["total"] or Decimal(0)

    # Active subscriptions: count active as of end (finish_date >= end_time)
    # For current period, count subscriptions with finish_date >= end (active at the end of period)
    active_current = Subscription.objects.filter(finish_date__gte=end).count()
    # For previous, active as of prev_end
    active_prev = Subscription.objects.filter(finish_date__gte=prev_end).count()

    # Regular users who joined in period
    regular_in_current = User.objects.filter(role=User.Role.REGULAR_USER, date_joined__gte=start, date_joined__lt=end).count()
    regular_in_prev = User.objects.filter(role=User.Role.REGULAR_USER, date_joined__gte=prev_start, date_joined__lt=prev_end).count()

    # Total regular users (all-time)
    total_regular_users = User.objects.filter(role=User.Role.REGULAR_USER).count()

    # Visitors: sum visits in period
    visitors_current = PageVisitRecord.objects.filter(recorded_at__gte=start, recorded_at__lt=end).aggregate(total=Coalesce(Sum("visits"), zero_int))["total"] or 0
    visitors_prev = PageVisitRecord.objects.filter(recorded_at__gte=prev_start, recorded_at__lt=prev_end).aggregate(total=Coalesce(Sum("visits"), zero_int))["total"] or 0

    # graph data
    graph_data = [
        {
            "label": "Revenue",
            "raw_current": float(revenue_current),
            "raw_previous": float(revenue_prev),
            "percent_change": _safe_percent_change(revenue_current, revenue_prev),
        },
        {
            "label": "Regular Users",
            "raw_current": int(regular_in_current),
            "raw_previous": int(regular_in_prev),
            "percent_change": _safe_percent_change(regular_in_current, regular_in_prev),
        },
        {
            "label": "Active Subscriptions",
            "raw_current": int(active_current),
            "raw_previous": int(active_prev),
            "percent_change": _safe_percent_change(active_current, active_prev),
        },
        {
            "label": "Visitors",
            "raw_current": int(visitors_current),
            "raw_previous": int(visitors_prev),
            "percent_change": _safe_percent_change(visitors_current, visitors_prev),
        },
    ]

    payload = {
        "range": range_key,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "revenue_current": float(revenue_current),
        "revenue_previous": float(revenue_prev),
        "total_regular_users": total_regular_users,
        "regular_users_in_period": regular_in_current,
        "regular_users_previous_period": regular_in_prev,
        "active_subscriptions_now": active_current,
        "active_subscriptions_previous_period": active_prev,
        "total_visitors": visitors_current,
        "total_visitors_previous_period": visitors_prev,
        "graph_data": graph_data,
    }

    response = JsonResponse(payload)
    return _attach_cors_headers(response, request)







from calendar import monthrange
from datetime import datetime
from django.apps import apps
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Subscription, Question, ATI, ExamType

from datetime import datetime, timezone as dt_timezone

def _month_start_and_next(year: int, month: int):
    start = datetime(year, month, 1, tzinfo=dt_timezone.utc)
    if month == 12:
        next_month = datetime(year + 1, 1, 1, tzinfo=dt_timezone.utc)
    else:
        next_month = datetime(year, month + 1, 1, tzinfo=dt_timezone.utc)
    return start, next_month


def _percent_change(current: int, previous: int) -> int:
    """
    Return percent change as integer. If previous == 0:
      - if current == 0 -> 0
      - else -> 100
    """
    if previous == 0:
        return 0 if current == 0 else 100
    return int(round((current - previous) / previous * 100))


@require_GET
def ati_teas_stats(request):
    """
    Returns JSON:
      {
        "subscribers": { "month": int, "total_all_time": int, "percent_change": int },
        "exams_completed": { "total_all_time": int, ... },
        "questions_uploaded": { "month": int, "total_all_time": int, "percent_change": int },
      }

    Notes:
    - Subscribers counts are distinct users who have subscriptions whose plan.exam_type == ExamType.ATI_TEAS_7.
    - Questions use Question.created_at for month/total.
    - ATI completions: your ATI model (in this repo) has no completion timestamp field, so only total_all_time is returned for exams_completed.
      If you add a `completed_at` DateTimeField (or equivalent), uncomment the commented section below that computes monthly counts.
    """
    now = timezone.now()

    # --- subscribers (distinct users who have subscribed to ATI TEAS) ---
    exam_type_key = ExamType.ATI_TEAS_7  # "ATI_TEAS_7"

    # distinct users total
    total_subscribers = (
        Subscription.objects.filter(plan__exam_type=exam_type_key)
        .values("user")
        .distinct()
        .count()
    )

    # this month's subscribers (by subscription.created_at)
    start_this, start_next = _month_start_and_next(now.year, now.month)
    this_month_sub_q = Subscription.objects.filter(
        plan__exam_type=exam_type_key,
        created_at__gte=start_this,
        created_at__lt=start_next,
    )
    month_subscribers = this_month_sub_q.values("user").distinct().count()

    # previous month
    prev_year = now.year if now.month > 1 else now.year - 1
    prev_month = now.month - 1 if now.month > 1 else 12
    start_prev, start_prev_next = _month_start_and_next(prev_year, prev_month)
    prev_month_subscribers = (
        Subscription.objects.filter(
            plan__exam_type=exam_type_key,
            created_at__gte=start_prev,
            created_at__lt=start_prev_next,
        )
        .values("user")
        .distinct()
        .count()
    )

    subscribers_data = {
        "month": month_subscribers,
        "total_all_time": total_subscribers,
        "percent_change": _percent_change(month_subscribers, prev_month_subscribers),
    }

    # --- questions uploaded (Question.created_at exists) ---
    total_questions = Question.objects.count()
    month_questions = Question.objects.filter(created_at__gte=start_this, created_at__lt=start_next).count()
    prev_month_questions = Question.objects.filter(created_at__gte=start_prev, created_at__lt=start_prev_next).count()

    questions_data = {
        "month": month_questions,
        "total_all_time": total_questions,
        "percent_change": _percent_change(month_questions, prev_month_questions),
    }

    # --- exams completed (ATI.completed==True) ---
    total_exams_completed = ATI.objects.filter(completed=True).count()

    exams_data = {
        "total_all_time": total_exams_completed,
        # percent_change/month omitted unless there's a completion timestamp on ATI.
    }

    # If your ATI model later contains a completion timestamp field (for example "completed_at"),
    # you can compute month & percent_change similar to how questions/subscribers are computed:
    #
    # try:
    #     if hasattr(ATI, 'completed_at'):
    #         month_completed = ATI.objects.filter(
    #             completed=True,
    #             completed_at__gte=start_this, completed_at__lt=start_next
    #         ).count()
    #         prev_month_completed = ATI.objects.filter(
    #             completed=True,
    #             completed_at__gte=start_prev, completed_at__lt=start_prev_next
    #         ).count()
    #         exams_data.update({
    #             "month": month_completed,
    #             "percent_change": _percent_change(month_completed, prev_month_completed),
    #         })
    # except Exception:
    #     pass

    payload = {
        "subscribers": subscribers_data,
        "exams_completed": exams_data,
        "questions_uploaded": questions_data,
    }
    return JsonResponse(payload)













from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Count, Q

from .models import Subscription, HESI, HESIQuestion, ExamType

def _month_start_and_next(year: int, month: int):
    start = datetime(year, month, 1, tzinfo=dt_timezone.utc)
    if month == 12:
        next_month = datetime(year + 1, 1, 1, tzinfo=dt_timezone.utc)
    else:
        next_month = datetime(year, month + 1, 1, tzinfo=dt_timezone.utc)
    return start, next_month

def _percent_change(current: int, previous: int) -> int:
    if previous == 0:
        return 0 if current == 0 else 100
    return int(round((current - previous) / previous * 100))

@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    # keep this if your frontend hits /api/csrf/ to set csrftoken (harmless duplicate if already present)
    return JsonResponse({"detail": "csrf cookie set"})

@require_GET
def hesi_a2_stats(request):
    """
    Returns:
    {
      "subscribers": {"month": int, "total_all_time": int, "percent_change": int},
      "exams_completed": {"total_all_time": int},   # month/percent omitted unless HESI has completed_at
      "questions_uploaded": {"month": int, "total_all_time": int, "percent_change": int}
    }
    """
    now = timezone.now()

    # --- subscribers: distinct users with subscriptions for HESI A2 ---
    exam_type_key = ExamType.HESI_A2  # make sure this matches your ExamType enum

    total_subscribers = (
        Subscription.objects.filter(plan__exam_type=exam_type_key)
        .values("user")
        .distinct()
        .count()
    )

    start_this, start_next = _month_start_and_next(now.year, now.month)
    # previous month boundaries
    prev_year = now.year if now.month > 1 else now.year - 1
    prev_month = now.month - 1 if now.month > 1 else 12
    start_prev, start_prev_next = _month_start_and_next(prev_year, prev_month)

    month_subscribers = (
        Subscription.objects.filter(
            plan__exam_type=exam_type_key,
            created_at__gte=start_this,
            created_at__lt=start_next,
        )
        .values("user")
        .distinct()
        .count()
    )

    prev_month_subscribers = (
        Subscription.objects.filter(
            plan__exam_type=exam_type_key,
            created_at__gte=start_prev,
            created_at__lt=start_prev_next,
        )
        .values("user")
        .distinct()
        .count()
    )

    subscribers_data = {
        "month": month_subscribers,
        "total_all_time": total_subscribers,
        "percent_change": _percent_change(month_subscribers, prev_month_subscribers),
    }

    # --- questions_uploaded: use HESIQuestion.created_at ---
    total_questions = HESIQuestion.objects.count()
    month_questions = HESIQuestion.objects.filter(created_at__gte=start_this, created_at__lt=start_next).count()
    prev_month_questions = HESIQuestion.objects.filter(created_at__gte=start_prev, created_at__lt=start_prev_next).count()

    questions_data = {
        "month": month_questions,
        "total_all_time": total_questions,
        "percent_change": _percent_change(month_questions, prev_month_questions),
    }

    # --- exams_completed: HESI.completed == True ---
    total_exams_completed = HESI.objects.filter(completed=True).count()
    exams_data = {
        "total_all_time": total_exams_completed,
        # if you add a timestamp field (e.g. completed_at), you can include month & percent_change similarly
    }

    payload = {
        "subscribers": subscribers_data,
        "exams_completed": exams_data,
        "questions_uploaded": questions_data,
    }
    return JsonResponse(payload)
