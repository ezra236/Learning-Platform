# api/models.py
import uuid
import random
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import (
    AbstractBaseUser, PermissionsMixin, BaseUserManager
)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, role, **extra_fields):
        if not email:
            raise ValueError("The given email must be set")
        email = self.normalize_email(email)
        if role not in {User.Role.SUPERADMIN, User.Role.ADMIN_ASSISTANT, User.Role.REGULAR_USER}:
            raise ValueError("Invalid role")
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, role='regular_user', **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, role, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, User.Role.SUPERADMIN, **extra_fields)

    def create_admin_assistant(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, User.Role.ADMIN_ASSISTANT, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role:
        SUPERADMIN = "superadmin"
        ADMIN_ASSISTANT = "admin_assistant"
        REGULAR_USER = "regular_user"

        CHOICES = [
            (SUPERADMIN, "Superadmin"),
            (ADMIN_ASSISTANT, "Admin Assistant"),
            (REGULAR_USER, "Regular User"),
        ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField("email address", unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    email_verified = models.BooleanField(default=False)

    role = models.CharField(max_length=32, choices=Role.CHOICES, default=Role.REGULAR_USER)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    EMAIL_FIELD = "email"
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"
        ordering = ("-date_joined",)
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return self.email

    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN or self.is_superuser

    @property
    def is_admin_assistant(self):
        return self.role == self.Role.ADMIN_ASSISTANT

    @property
    def is_regular_user(self):
        return self.role == self.Role.REGULAR_USER
    


class VerificationCode(models.Model):
    """
    Stores short-lived verification codes for signup flow.
    Use VerificationCode.create_code(email, lifetime_minutes=10) to create a new code.
    """
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]

    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_code(cls, email, lifetime_minutes=10):
        """
        Create and persist a 6-digit verification code for `email`.
        Returns the created VerificationCode instance.
        """
        code = f"{random.randint(0, 999999):06d}"
        now = timezone.now()
        expires = now + timedelta(minutes=lifetime_minutes)
        vc = cls.objects.create(email=email, code=code, expires_at=expires)
        return vc




import uuid
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class PasswordResetCode(models.Model):
    """
    Stores a short numeric verification code emailed to the user.
    After verification a reset_token (uuid) is issued to allow setting a new password.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_reset_codes")
    code = models.CharField(max_length=6)  # numeric code as string (e.g. 123456)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    reset_token = models.UUIDField(null=True, blank=True)  # issued after successful code verification

    class Meta:
        db_table = "accounts_password_reset_code"
        indexes = [
            models.Index(fields=["user", "code"]),
            models.Index(fields=["reset_token"]),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_user(cls, user, expiry_minutes=10):
        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        return cls.objects.create(user=user, code=code, expires_at=expires_at)



import uuid
from django.db import models
from django.utils import timezone


class PageVisitRecord(models.Model):
    """
    Stores the number of visits to a specific page at a specific time.
    Each record represents a snapshot (e.g., per day, per hour, etc.).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.CharField(max_length=255, db_index=True)
    visits = models.PositiveIntegerField(default=0)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "Page Visit Record"
        verbose_name_plural = "Page Visit Records"
        ordering = ("-recorded_at", "page")
        indexes = [
            models.Index(fields=["page", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.page} — {self.visits} visits @ {self.recorded_at:%Y-%m-%d %H:%M:%S}"



import uuid
import os

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


# ---- config ----
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _validate_image_file(value):
    """
    Validate uploaded image:
      - file extension allowed
      - size under MAX_UPLOAD_SIZE
    This validator will be invoked for ImageField/FileField inputs.
    """
    # file name extension
    name = value.name or ""
    _, ext = os.path.splitext(name.lower())
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            _("Unsupported file extension %(ext)s. Allowed: %(allowed)s"),
            params={"ext": ext, "allowed": ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))},
        )

    # file size (InMemoryUploadedFile / TemporaryUploadedFile have size attr)
    file_size = getattr(value, "size", None)
    if file_size is not None and file_size > MAX_UPLOAD_SIZE:
        raise ValidationError(
            _("File too large (%(size)d bytes). Max allowed is %(limit)d bytes."),
            params={"size": file_size, "limit": MAX_UPLOAD_SIZE},
        )


class Evidence(models.Model):
    """
    Evidence submitted by a user.

    Fields:
      - id: UUID primary key
      - heading, description, role: form fields
      - profile_image, evidence_image: optional image uploads
      - created_by: FK to user who submitted
      - created_at, updated_at
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    heading = models.CharField(max_length=255)
    description = models.TextField()
    role = models.CharField(max_length=128)

    # File fields: adjust upload_to path to your preference.
    # If you're using Cloudinary or custom storage, you can pass `storage=...` to ImageField.
    profile_image = models.ImageField(
        upload_to="evidence/profiles/",
        null=True,
        blank=True,
        validators=[_validate_image_file],
        help_text=_("Profile image (PNG/JPG, max 5MB)")
    )
    evidence_image = models.ImageField(
        upload_to="evidence/images/",
        null=True,
        blank=True,
        validators=[_validate_image_file],
        help_text=_("Evidence image (PNG/JPG, max 5MB)")
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="evidences"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Evidence")
        verbose_name_plural = _("Evidences")

    def __str__(self):
        return f"{self.heading} — {self.role} ({self.created_at:%Y-%m-%d})"

    def clean(self):
        """
        Extra model-level validation (optional).
        Called by ModelForm and full_clean(). Keeps validations centralized.
        """
        super().clean()
        if not self.heading:
            raise ValidationError({"heading": _("Heading is required.")})
        if not self.description:
            raise ValidationError({"description": _("Description is required.")})
        if not self.role:
            raise ValidationError({"role": _("Role is required.")})

    def save(self, *args, **kwargs):
        # you can add processing here (resize images, strip EXIF, etc.)
        super().save(*args, **kwargs)

    def get_profile_image_url(self):
        return self.profile_image.url if self.profile_image else None

    def get_evidence_image_url(self):
        return self.evidence_image.url if self.evidence_image else None




from django.db import models

class Review(models.Model):
    text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review #{self.id} ({self.created_at:%Y-%m-%d %H:%M})"




import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

class Subscription(models.Model):
    """
    A recorded purchase for a Plan by a user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey("Plan", on_delete=models.PROTECT, related_name="subscriptions")
    start_date = models.DateTimeField()
    finish_date = models.DateTimeField()
    paypal_order_id = models.CharField(max_length=128, blank=True, null=True)
    paypal_capture_id = models.CharField(max_length=128, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    currency = models.CharField(max_length=8, default="USD", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Subscription({self.user}, {self.plan}, {self.start_date.isoformat()} → {self.finish_date.isoformat()})"




import uuid
from django.conf import settings

class IntendedPlan(models.Model):
    """
    A slip indicating a regular user intends to purchase/use a plan.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="intended_plans")
    plan = models.ForeignKey("Plan", on_delete=models.CASCADE, related_name="intended_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "plan")  # prevent duplicate slips for same (user,plan)
        ordering = ("-created_at",)

    def __str__(self):
        return f"IntendedPlan({self.user}, {self.plan}, {self.created_at.isoformat()})"




from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class ExamType(models.TextChoices):
    ATI_TEAS_7 = "ATI_TEAS_7", "ATI TEAS 7"
    HESI_A2 = "HESI_A2", "HESI A2"
    NCLEX = "NCLEX", "NCLEX"
    NURSING_TEST_BANK = "NURSING_TEST_BANK", "Nursing Test Bank"
    EXIT_EXAM = "EXIT_EXAM", "Exit Exam"


DURATION_CHOICES = (
    (30, "30 Days Access"),
    (60, "60 Days Access"),
    (90, "90 Days Access"),
)


class Feature(models.Model):
    """
    A re-usable feature that can be attached to many plans.
    """
    name = models.CharField(max_length=140, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:160]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Plan(models.Model):
    """
    A plan for an exam type. Unique per (exam_type, duration_days).
    """
    exam_type = models.CharField(max_length=32, choices=ExamType.choices)
    duration_days = models.PositiveSmallIntegerField(choices=DURATION_CHOICES)
    title = models.CharField(max_length=180, help_text="Human friendly plan title (e.g. '30 Days Access')")
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Price in smallest currency unit (e.g. dollars)."
    )
    currency = models.CharField(max_length=8, default="USD", help_text="ISO currency code")
    features = models.ManyToManyField(Feature, blank=True, related_name="plans")
    active = models.BooleanField(default=False)   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("exam_type", "duration_days")
        ordering = ["exam_type", "duration_days"]

    def __str__(self):
        return f"{self.get_exam_type_display()} — {self.duration_days} days ({self.currency} {self.price})"

    def save(self, *args, **kwargs):
        # ensure reasonable default title if omitted
        if not self.title:
            self.title = f"{self.duration_days} Days Access"
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_trial(cls, exam_type: str, days: int = 7, currency: str = "USD"):
        """
        Find or create a trial Plan for a given exam_type and duration (days).
        Price defaults to 0.00 and the plan is marked active=True.

        NOTE: duration_days normally uses DURATION_CHOICES (30/60/90). Creating a 7-day
        plan bypasses those choices (choices are a form-level validation), which is OK for
        trial purposes. If you prefer to restrict to existing choices, adjust accordingly.
        """
        # Use transaction to avoid races
        with transaction.atomic():
            defaults = {
                "price": Decimal("0.00"),
                "currency": currency,
                "active": True,
                "title": f"{days} Days Trial",
            }
            plan, created = cls.objects.get_or_create(
                exam_type=exam_type,
                duration_days=days,
                defaults=defaults,
            )
            # If plan existed but wasn't active or priced correctly, ensure trial-friendly values
            changed = False
            if not plan.active:
                plan.active = True
                changed = True
            if plan.price != defaults["price"]:
                plan.price = defaults["price"]
                changed = True
            if plan.currency != defaults["currency"]:
                plan.currency = defaults["currency"]
                changed = True
            if changed:
                plan.save()
            return plan
        


# -------------------------
# FreeTrial model (NEW)
# -------------------------
class FreeTrial(models.Model):
    """
    Records emails that have received a free trial so that users cannot receive more than one.
    Stores email (unique) and optional FK to user (if available).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("email address", db_index=True, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="free_trials")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "free trial"
        verbose_name_plural = "free trials"

    def __str__(self):
        return f"FreeTrial({self.email}, created_at={self.created_at.isoformat()})"




import uuid
from django.conf import settings
from django.db import models

class Announcement(models.Model):
    class FormatChoices:
        IMAGE = "image"
        VIDEO = "video"
        CHOICES = [
            (IMAGE, "Image"),
            (VIDEO, "Video"),
        ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    format = models.CharField(max_length=16, choices=FormatChoices.CHOICES)
    mediapath = models.URLField(max_length=1024)   # cloudinary secure_url
    public_id = models.CharField(max_length=1024, blank=True, null=True)  # stored Cloudinary public_id
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "announcements"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.format} - {self.mediapath}"


class AnnouncementSeen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seen_announcements")
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name="seen_by")
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "announcement_seen"
        unique_together = ("user", "announcement")
        ordering = ("-seen_at",)

    def __str__(self):
        return f"{self.user} saw {self.announcement.id}"






import uuid
from django.db import models
from django.conf import settings

class Campaign(models.Model):
    FORMAT_NONE = "none"
    FORMAT_IMAGE = "image"
    FORMAT_VIDEO = "video"

    FORMAT_CHOICES = [
        (FORMAT_NONE, "None"),
        (FORMAT_IMAGE, "Image"),
        (FORMAT_VIDEO, "Video"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    heading = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    format = models.CharField(max_length=16, choices=FORMAT_CHOICES, default=FORMAT_NONE)
    mediapath = models.URLField(blank=True)  # Cloudinary secure_url
    public_id = models.CharField(max_length=500, blank=True)  # Cloudinary public_id
    cloud_resource_type = models.CharField(max_length=16, blank=True)  # 'image' or 'video'
    is_active = models.BooleanField(default=False)
    link = models.URLField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "marketing_campaign"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.heading} ({self.id})"



class CampaignView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="views")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="campaign_views")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    seen_at = models.DateTimeField(auto_now_add=True)
    # NEW: next time this campaign may be shown to this user
    next_time_to_show = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "marketing_campaign_view"
        ordering = ["-seen_at"]
        # optional unique together so we keep one record per user+campaign when user is not null
        unique_together = ("campaign", "user")

    def __str__(self):
        return f"View {self.id} -> {self.campaign_id}"









from django.db import models
from django.contrib.postgres.fields import ArrayField  # optional, JSONField is fine
from django.core.validators import MinValueValidator
from django.db.models import JSONField

FORMAT_CHOICES = [(i, f'Format {i}') for i in range(1, 11)]

class ATI(models.Model):
    name = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    isfree = models.BooleanField(default=False)

    duration_seconds = models.PositiveIntegerField(
        default=3600,  # 1 hour in seconds
        null=True, blank=True,
        help_text="Exam duration in seconds (default = 1 hour)"
    )

    def __str__(self):
        return f"{self.name} ({'Completed' if self.completed else 'Draft'})"

class Question(models.Model):
    exam = models.ForeignKey(ATI, related_name='questions', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=1)
    format = models.PositiveSmallIntegerField(choices=FORMAT_CHOICES)
    # rich text fields (TinyMCE HTML)
    question_html = models.TextField(blank=True)   # used for formats that have a question
    paragraph_html = models.TextField(blank=True)  # used for formats with a paragraph
    table_html = models.TextField(blank=True)      # you can store table HTML from TinyMCE
    explanation_html = models.TextField(blank=True)
    # image url from Cloudinary
    image_url = models.URLField(blank=True)
    # For regular choices (is_correct flag). For multiple correct answers, multiple Choice.is_correct=True
    # For specialchoices we use a separate SpecialChoice model and store the correct order below
    # Save the correct order as a list of SpecialChoice ids (integers)
    special_correct_order = JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order} (Format {self.format}) - Exam: {self.exam.name}"

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text_html = models.TextField()   # styled with TinyMCE
    order = models.PositiveIntegerField(default=0)
    is_correct = models.BooleanField(default=False)  # for regular multiple choice answers

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Choice {self.order} for Q{self.question.order}"

class SpecialChoice(models.Model):
    question = models.ForeignKey(Question, related_name='specialchoices', on_delete=models.CASCADE)
    text_html = models.TextField()
    order = models.PositiveIntegerField(default=0)  # display order

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"SpecialChoice {self.order} for Q{self.question.order}"






from django.db import models
from django.contrib.postgres.fields import ArrayField  # optional, JSONField is fine
from django.core.validators import MinValueValidator
from django.db.models import JSONField

FORMAT_CHOICES_HESI = [(i, f'Format {i}') for i in range(1, 11)]

class HESI(models.Model):
    name = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    isfree = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({'Completed' if self.completed else 'Draft'})"

class HESIQuestion(models.Model):
    exam = models.ForeignKey(HESI, related_name='questions', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=1)
    format = models.PositiveSmallIntegerField(choices=FORMAT_CHOICES)
    # rich text fields (TinyMCE HTML)
    question_html = models.TextField(blank=True)   # used for formats that have a question
    paragraph_html = models.TextField(blank=True)  # used for formats with a paragraph
    table_html = models.TextField(blank=True)      # you can store table HTML from TinyMCE
    explanation_html = models.TextField(blank=True)
    # image url from Cloudinary
    image_url = models.URLField(blank=True)
    # For regular choices (is_correct flag). For multiple correct answers, multiple Choice.is_correct=True
    # For specialchoices we use a separate SpecialChoice model and store the correct order below
    # Save the correct order as a list of SpecialChoice ids (integers)
    special_correct_order = JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order} (Format {self.format}) - Exam: {self.exam.name}"

class HESIChoice(models.Model):
    question = models.ForeignKey(HESIQuestion, related_name='choices', on_delete=models.CASCADE)
    text_html = models.TextField()   # styled with TinyMCE
    order = models.PositiveIntegerField(default=0)
    is_correct = models.BooleanField(default=False)  # for regular multiple choice answers

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Choice {self.order} for Q{self.question.order}"

class HESISpecialChoice(models.Model):
    question = models.ForeignKey(HESIQuestion, related_name='specialchoices', on_delete=models.CASCADE)
    text_html = models.TextField()
    order = models.PositiveIntegerField(default=0)  # display order

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"SpecialChoice {self.order} for Q{self.question.order}"




# models.py (append after existing models)

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import JSONField

User = get_user_model()


class Attempt(models.Model):
    """
    Store user attempt state for a given ATI exam.
    - time_spent: seconds the user has already used (so countdown resumes from total_seconds - time_spent)
    - last_question: the order index (PositiveInteger) of the last question user attempted
    - answers: JSON mapping question_id -> selected value
        For regular choices: store selected Choice.id (or list for multi-correct)
        For special choices: store list of SpecialChoice ids (ordered)
    - grade: optional float
    - points_scored: integer
    - total_questions: integer
    - is_completed: boolean
    - cancelled_at: datetime when user navigated away (optional)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='attempts', on_delete=models.CASCADE)
    exam = models.ForeignKey(ATI, related_name='attempts', on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    time_spent = models.PositiveIntegerField(default=0)  # seconds
    last_question = models.PositiveIntegerField(default=1)
    answers = JSONField(default=dict, blank=True)  # {question_id: choice_id or [specialchoice_ids], ...}

    grade = models.FloatField(null=True, blank=True)
    points_scored = models.PositiveIntegerField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)

    is_completed = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "exam")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Attempt {self.user.email} - {self.exam.name}"


class Bookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='bookmarks', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name='bookmarks', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bookmark {self.user.email} - Q{self.question.order}"


class Report(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='reports', on_delete=models.CASCADE)
    exam = models.ForeignKey(ATI, related_name='reports', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name='reports', on_delete=models.CASCADE)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Report {self.user.email} - Q{self.question.order}"




from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import JSONField

User = get_user_model()


class HESIAttempt(models.Model):
    """
    Store user attempt state for a given HESI exam.
    - time_spent: seconds the user has already used (so countdown resumes from total_seconds - time_spent)
    - last_question: the order index (PositiveInteger) of the last question user attempted
    - answers: JSON mapping question_id -> selected value
        For regular choices: store selected Choice.id (or list for multi-correct)
        For special choices: store list of SpecialChoice ids (ordered)
    - grade: optional float
    - points_scored: integer
    - total_questions: integer
    - is_completed: boolean
    - cancelled_at: datetime when user navigated away (optional)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='hesi_attempts', on_delete=models.CASCADE)
    exam = models.ForeignKey(HESI, related_name='hesi_attempts', on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    time_spent = models.PositiveIntegerField(default=0)  # seconds
    last_question = models.PositiveIntegerField(default=1)
    answers = JSONField(default=dict, blank=True)  # {question_id: choice_id or [specialchoice_ids], ...}

    grade = models.FloatField(null=True, blank=True)
    points_scored = models.PositiveIntegerField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)

    is_completed = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "exam")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Attempt {self.user.email} - {self.exam.name}"


class HESIBookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='hesi_bookmarks', on_delete=models.CASCADE)
    question = models.ForeignKey(HESIQuestion, related_name='hesi_bookmarks', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bookmark {self.user.email} - Q{self.question.order}"


class HESIReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='hesi_reports', on_delete=models.CASCADE)
    exam = models.ForeignKey(HESI, related_name='hesi_reports', on_delete=models.CASCADE)
    question = models.ForeignKey(HESIQuestion, related_name='hesi_reports', on_delete=models.CASCADE)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Report {self.user.email} - Q{self.question.order}"




from django.db import models

class NewsletterSubscriber(models.Model):
    """
    Stores emails of users who subscribe to the newsletter.
    """
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
 







# api/models.py  — replace the existing Pdf model class with this one

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

class Pdf(models.Model):
    # Categories strictly limited to the five provided
    CATEGORY_ATI = "ATI TEAS"
    CATEGORY_NCLEX = "NCLEX"
    CATEGORY_EXIT = "EXIT EXAMS"
    CATEGORY_HESI = "HESI A2"
    CATEGORY_TESTBANK = "NURSING TESTBANK"

    CATEGORY_CHOICES = [
        (CATEGORY_ATI, "ATI TEAS"),
        (CATEGORY_NCLEX, "NCLEX"),
        (CATEGORY_EXIT, "EXIT EXAMS"),
        (CATEGORY_HESI, "HESI A2"),
        (CATEGORY_TESTBANK, "NURSING TESTBANK"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    # new: category (required)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_ATI)
    # new: proof image URL uploaded to Cloudinary (optional)
    proof_image = models.URLField(max_length=1024, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="uploaded_pdfs"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_pdf"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} ({self.price})"








import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

# Pdf model already provided by you earlier in the conversation.
# New models below:

class PurchaseSession(models.Model):
    """
    Temporary purchase session created when user clicks 'Buy Now'.
    Public endpoints will create this, store chosen pdf and buyer email (when provided).
    Session gets deleted once purchase is completed.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pdf = models.ForeignKey("Pdf", on_delete=models.CASCADE, related_name="sessions")
    buyer_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_purchase_session"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Session {self.id} for {self.pdf.name}"


class PdfPurchase(models.Model):
    """
    Completed purchase record (persisted after successful PayPal capture).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pdf = models.ForeignKey("Pdf", on_delete=models.PROTECT, related_name="purchases")
    buyer_email = models.EmailField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    paypal_order_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_pdf_purchase"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Purchase {self.id} of {self.pdf.name} by {self.buyer_email}"
