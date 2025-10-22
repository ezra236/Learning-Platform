# api/models.py
import uuid
import random
from datetime import timedelta
from django.db import models
from django.utils import timezone
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
import os

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


# ---- config ----
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
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




# -------- ATI TEAS EXAM --------------- #
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# --- Models (Exam / Question / Choice) ---
class Exam(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_complete = models.BooleanField(default=False)
    total_questions = models.PositiveIntegerField(default=0, editable=False)  # specified by creator
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def recalc_current_question_count(self):
        """Return the current number of question rows for this exam (not stored)."""
        return self.questions.count()

    def refresh_total_questions_field(self):
        """Denormalized field: update total_questions to the desired declared value only
           (we keep 'total_questions' as the declared quota; current count is computed)."""
        # NOTE: total_questions field is the declared quota set when creating the exam.
        # We do not overwrite it here — instead we provide helper if needed.
        self.save(update_fields=['updated_at'])

    def __str__(self):
        return self.name


class Question(models.Model):
    # format enum
    FORMAT_1 = 1  # question, choices, explanation, correct answer
    FORMAT_2 = 2  # paragraph, imagepath, question, choices, explanation, correct answer
    FORMAT_3 = 3  # paragraph, question, choices, explanation, correct answer
    FORMAT_4 = 4  # question, choices, imagepath, explanation, correct answer

    FORMAT_CHOICES = (
        (FORMAT_1, "Q, Choices, Explanation, Correct"),
        (FORMAT_2, "Paragraph, ImagePath, Q, Choices, Explanation, Correct"),
        (FORMAT_3, "Paragraph, Q, Choices, Explanation, Correct"),
        (FORMAT_4, "Q, Choices, ImagePath, Explanation, Correct"),
    )

    exam = models.ForeignKey(Exam, related_name='questions', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(help_text="1-based position inside the exam.", blank=True, null=True)
    format = models.PositiveSmallIntegerField(choices=FORMAT_CHOICES)
    paragraph = models.TextField(blank=True, default='')
    image_path = models.CharField(max_length=1024, blank=True, default='')
    question_text = models.TextField()
    explanation = models.TextField()
    correct_choice = models.ForeignKey(
        'Choice',
        null=True,
        blank=True,
        related_name='is_correct_for',
        on_delete=models.PROTECT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = (('exam', 'order'),)
        indexes = [
            models.Index(fields=['exam', 'order']),
        ]

    def clean(self):
        # Format-specific required/forbidden fields.
        if self.format == self.FORMAT_1:
            if self.paragraph.strip():
                raise ValidationError(_("Format 1 must not include a paragraph."))
            if self.image_path.strip():
                raise ValidationError(_("Format 1 must not include an image path."))
        elif self.format == self.FORMAT_2:
            if not self.paragraph.strip():
                raise ValidationError(_("Format 2 requires a paragraph."))
            if not self.image_path.strip():
                raise ValidationError(_("Format 2 requires an image_path (Cloudinary path)."))
        elif self.format == self.FORMAT_3:
            if not self.paragraph.strip():
                raise ValidationError(_("Format 3 requires a paragraph."))
            if self.image_path.strip():
                raise ValidationError(_("Format 3 must not include an image path."))
        elif self.format == self.FORMAT_4:
            if not self.image_path.strip():
                raise ValidationError(_("Format 4 requires an image_path (Cloudinary path)."))
            if self.paragraph.strip():
                raise ValidationError(_("Format 4 must not include a paragraph."))
        else:
            raise ValidationError(_("Unknown question format."))

        # If correct_choice is set, ensure it belongs to this question (if object persisted).
        if self.correct_choice is not None:
            # If self.id is None (not yet saved) we cannot compare question_id; that will be handled in helper.
            if self.pk is not None and self.correct_choice.question_id != self.pk:
                raise ValidationError({"correct_choice": _("Correct choice must belong to this question.")})

        super().clean()

    def save(self, *args, **kwargs):
        # Auto-assign 'order' to append at end if not provided.
        if not self.order:
            last = Question.objects.filter(exam=self.exam).order_by('-order').first()
            self.order = (last.order + 1) if last and last.order else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Q{self.order} on {self.exam.name}"


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.TextField()
    index = models.PositiveSmallIntegerField(help_text="1..6 position for this choice within the question.")

    class Meta:
        unique_together = (('question', 'index'),)
        ordering = ['index']

    def clean(self):
        if not (1 <= self.index <= 6):
            raise ValidationError({"index": _("Choice index must be between 1 and 6.")})
        super().clean()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Choice {self.index} for Q{self.question.order} ({self.question.exam.name})"


# --- Helper to create a question and its choices atomically and set correct_choice ---
def create_question_with_choices(
    exam: Exam,
    fmt: int,
    question_text: str,
    explanation: str,
    choices_texts: list,
    correct_index_zero_based: int,
    paragraph: str = '',
    image_path: str = '',
):
    """
    Atomically create a Question and Choices and set correct_choice.
    choices_texts: list[str] (from frontend individual inputs)
    correct_index_zero_based: 0-based index (frontend uses letter buttons A->0)
    """
    if not (2 <= len(choices_texts) <= 6):
        raise ValidationError("Must supply between 2 and 6 choices.")

    if not (0 <= correct_index_zero_based < len(choices_texts)):
        raise ValidationError("correct_index must be within range of choices")

    if exam.is_complete:
        raise ValidationError("Exam is already marked complete; cannot add questions.")

    with transaction.atomic():
        q = Question(
            exam=exam,
            format=fmt,
            paragraph=paragraph or '',
            image_path=image_path or '',
            question_text=question_text,
            explanation=explanation,
        )
        q.full_clean()
        q.save()  # saves and sets q.pk and order

        created_choices = []
        for idx, text in enumerate(choices_texts, start=1):
            c = Choice(question=q, text=text, index=idx)
            c.full_clean()
            c.save()
            created_choices.append(c)

        # attach correct_choice (point to Choice object)
        correct_choice = created_choices[correct_index_zero_based]
        q.correct_choice = correct_choice
        q.full_clean()
        q.save(update_fields=['correct_choice'])

        # return q
        return q


# --- Signals to update denormalized counts or perform housekeeping ---
@receiver(post_save, sender=Question)
@receiver(post_delete, sender=Question)
def update_exam_question_counts(sender, instance, **kwargs):
    # When questions are created/deleted, we do not modify declared total_questions,
    # but we might want to keep updated_at accurate. No destructive changes here.
    exam = instance.exam
    exam.save(update_fields=['updated_at'])


@receiver(post_save, sender=Choice)
@receiver(post_delete, sender=Choice)
def ensure_choices_count(sender, instance, **kwargs):
    # Optionally we could enforce 2..6 at DB level. For now we only raise in create helper and in clean operations.
    pass






# -------- HESI A2 EXAM --------------- #

from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# --- Models (HesiExam / HesiQuestion / HesiChoice) ---
class HesiExam(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_complete = models.BooleanField(default=False)
    total_questions = models.PositiveIntegerField(default=0, editable=False)  # declared quota
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def recalc_current_question_count(self):
        """Return the current number of question rows for this exam (not stored)."""
        return self.questions.count()

    def refresh_total_questions_field(self):
        """Denormalized field: update total_questions to the desired declared value only
           (we keep 'total_questions' as the declared quota; current count is computed)."""
        # NOTE: total_questions field is the declared quota set when creating the exam.
        # We do not overwrite it here — instead we provide helper if needed.
        self.save(update_fields=['updated_at'])

    def __str__(self):
        return self.name


class HesiQuestion(models.Model):
    # format enum
    FORMAT_1 = 1  # question, choices, explanation, correct answer
    FORMAT_2 = 2  # paragraph, imagepath, question, choices, explanation, correct answer
    FORMAT_3 = 3  # paragraph, question, choices, explanation, correct answer
    FORMAT_4 = 4  # question, choices, imagepath, explanation, correct answer

    FORMAT_CHOICES = (
        (FORMAT_1, "Q, Choices, Explanation, Correct"),
        (FORMAT_2, "Paragraph, ImagePath, Q, Choices, Explanation, Correct"),
        (FORMAT_3, "Paragraph, Q, Choices, Explanation, Correct"),
        (FORMAT_4, "Q, Choices, ImagePath, Explanation, Correct"),
    )

    exam = models.ForeignKey(HesiExam, related_name='questions', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(help_text="1-based position inside the exam.", blank=True, null=True)
    format = models.PositiveSmallIntegerField(choices=FORMAT_CHOICES)
    paragraph = models.TextField(blank=True, default='')
    image_path = models.CharField(max_length=1024, blank=True, default='')
    question_text = models.TextField()
    explanation = models.TextField()
    correct_choice = models.ForeignKey(
        'HesiChoice',
        null=True,
        blank=True,
        related_name='is_correct_for',
        on_delete=models.PROTECT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = (('exam', 'order'),)
        indexes = [
            models.Index(fields=['exam', 'order']),
        ]

    def clean(self):
        # Format-specific required/forbidden fields.
        if self.format == self.FORMAT_1:
            if self.paragraph.strip():
                raise ValidationError(_("Format 1 must not include a paragraph."))
            if self.image_path.strip():
                raise ValidationError(_("Format 1 must not include an image path."))
        elif self.format == self.FORMAT_2:
            if not self.paragraph.strip():
                raise ValidationError(_("Format 2 requires a paragraph."))
            if not self.image_path.strip():
                raise ValidationError(_("Format 2 requires an image_path (Cloudinary path)."))
        elif self.format == self.FORMAT_3:
            if not self.paragraph.strip():
                raise ValidationError(_("Format 3 requires a paragraph."))
            if self.image_path.strip():
                raise ValidationError(_("Format 3 must not include an image path."))
        elif self.format == self.FORMAT_4:
            if not self.image_path.strip():
                raise ValidationError(_("Format 4 requires an image_path (Cloudinary path)."))
            if self.paragraph.strip():
                raise ValidationError(_("Format 4 must not include a paragraph."))
        else:
            raise ValidationError(_("Unknown question format."))

        # If correct_choice is set, ensure it belongs to this question (if object persisted).
        if self.correct_choice is not None:
            # If self.pk is None (not yet saved) we cannot compare question_id; that will be handled in helper.
            if self.pk is not None and self.correct_choice.question_id != self.pk:
                raise ValidationError({"correct_choice": _("Correct choice must belong to this question.")})

        super().clean()

    def save(self, *args, **kwargs):
        # Auto-assign 'order' to append at end if not provided.
        if not self.order:
            last = HesiQuestion.objects.filter(exam=self.exam).order_by('-order').first()
            self.order = (last.order + 1) if last and last.order else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Q{self.order} on {self.exam.name}"


class HesiChoice(models.Model):
    question = models.ForeignKey(HesiQuestion, related_name='choices', on_delete=models.CASCADE)
    text = models.TextField()
    index = models.PositiveSmallIntegerField(help_text="1..6 position for this choice within the question.")

    class Meta:
        unique_together = (('question', 'index'),)
        ordering = ['index']

    def clean(self):
        if not (1 <= self.index <= 6):
            raise ValidationError({"index": _("Choice index must be between 1 and 6.")})
        super().clean()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Choice {self.index} for Q{self.question.order} ({self.question.exam.name})"


# --- Helper to create a question and its choices atomically and set correct_choice ---
def create_hesi_question_with_choices(
    exam: HesiExam,
    fmt: int,
    question_text: str,
    explanation: str,
    choices_texts: list,
    correct_index_zero_based: int,
    paragraph: str = '',
    image_path: str = '',
):
    """
    Atomically create a HesiQuestion and HesiChoices and set correct_choice.
    choices_texts: list[str] (from frontend individual inputs)
    correct_index_zero_based: 0-based index (frontend uses letter buttons A->0)
    """
    if not (2 <= len(choices_texts) <= 6):
        raise ValidationError("Must supply between 2 and 6 choices.")

    if not (0 <= correct_index_zero_based < len(choices_texts)):
        raise ValidationError("correct_index must be within range of choices")

    if exam.is_complete:
        raise ValidationError("Exam is already marked complete; cannot add questions.")

    with transaction.atomic():
        q = HesiQuestion(
            exam=exam,
            format=fmt,
            paragraph=paragraph or '',
            image_path=image_path or '',
            question_text=question_text,
            explanation=explanation,
        )
        q.full_clean()
        q.save()  # saves and sets q.pk and order

        created_choices = []
        for idx, text in enumerate(choices_texts, start=1):
            c = HesiChoice(question=q, text=text, index=idx)
            c.full_clean()
            c.save()
            created_choices.append(c)

        # attach correct_choice (point to HesiChoice object)
        correct_choice = created_choices[correct_index_zero_based]
        q.correct_choice = correct_choice
        q.full_clean()
        q.save(update_fields=['correct_choice'])

        return q


# --- Signals to update denormalized counts or perform housekeeping ---
@receiver(post_save, sender=HesiQuestion)
@receiver(post_delete, sender=HesiQuestion)
def update_exam_question_counts(sender, instance, **kwargs):
    # When questions are created/deleted, we do not modify declared total_questions,
    # but we might want to keep updated_at accurate. No destructive changes here.
    exam = instance.exam
    exam.save(update_fields=['updated_at'])


@receiver(post_save, sender=HesiChoice)
@receiver(post_delete, sender=HesiChoice)
def ensure_choices_count(sender, instance, **kwargs):
    # Optionally we could enforce 2..6 at DB level. For now we only raise in create helper and in clean operations.
    pass
