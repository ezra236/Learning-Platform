# api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        # Basic duplication logic:
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            return value

        # If user exists and already verified -> can't register again
        if user.email_verified:
            raise serializers.ValidationError(_("A user with this email already exists."))
        # else allow password update for unverified user
        return value





from rest_framework import serializers
from api.models import Campaign

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = (
            "id",
            "heading",
            "description",
            "format",
            "mediapath",
            "public_id",
            "cloud_resource_type",
            "is_active",
            "link",
            "created_by",
            "created_at",
        )
        read_only_fields = ("id", "mediapath", "public_id", "cloud_resource_type", "created_at", "created_by")



# api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "last_login")

class UpdateNameSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

class SendVerificationSerializer(serializers.Serializer):
    # no payload required, but kept for extensibility
    pass

class VerifyCodeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8)




# api/serializers.py
from rest_framework import serializers
from .models import Campaign

class CampaignSerializers(serializers.ModelSerializer):
    type = serializers.SerializerMethodField(default='campaign')

    class Meta:
        model = Campaign
        fields = ("id", "heading", "description", "format", "mediapath", "public_id", "cloud_resource_type", "link", "created_at", "type")

    def get_type(self, obj):
        return "campaign"












# serializers.py
from rest_framework import serializers
from .models import ATI, Question, Choice, SpecialChoice

class ChoiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Choice
        fields = ('id', 'text_html', 'order', 'is_correct')

class SpecialChoiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = SpecialChoice
        fields = ('id', 'text_html', 'order')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)
    specialchoices = SpecialChoiceSerializer(many=True, required=False)
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.URLField(read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'exam', 'order', 'format', 'question_html', 'paragraph_html',
                  'table_html', 'explanation_html', 'image', 'image_url',
                  'choices', 'specialchoices', 'special_correct_order', 'created_at')
        read_only_fields = ('created_at',)

    def _sync_choices(self, question, choices_data):
        """
        Update/create/delete Choice objects to match choices_data ordering.
        choices_data: list of dicts possibly containing 'id'
        """
        if choices_data is None:
            return

        existing = {c.id: c for c in question.choices.all()}
        incoming_ids = []
        for i, cdata in enumerate(choices_data):
            cid = cdata.get('id')
            if cid and cid in existing:
                ch = existing[cid]
                ch.text_html = cdata.get('text_html', '')
                ch.is_correct = bool(cdata.get('is_correct', False))
                ch.order = int(cdata.get('order', i))
                ch.save()
                incoming_ids.append(ch.id)
            else:
                ch = Choice.objects.create(
                    question=question,
                    text_html=cdata.get('text_html', ''),
                    is_correct=bool(cdata.get('is_correct', False)),
                    order=int(cdata.get('order', i))
                )
                incoming_ids.append(ch.id)
        # delete any choices not present in incoming_ids
        question.choices.exclude(id__in=incoming_ids).delete()

    def _sync_specialchoices(self, question, sc_data):
        if sc_data is None:
            return

        existing = {s.id: s for s in question.specialchoices.all()}
        incoming_ids = []
        sc_objs_created = []  # maintain created order for mapping special_correct_order
        for i, sc in enumerate(sc_data):
            sid = sc.get('id')
            if sid and sid in existing:
                s = existing[sid]
                s.text_html = sc.get('text_html', '')
                s.order = int(sc.get('order', i))
                s.save()
                incoming_ids.append(s.id)
                sc_objs_created.append(s)
            else:
                s = SpecialChoice.objects.create(
                    question=question,
                    text_html=sc.get('text_html', ''),
                    order=int(sc.get('order', i))
                )
                incoming_ids.append(s.id)
                sc_objs_created.append(s)
        # delete removed
        question.specialchoices.exclude(id__in=incoming_ids).delete()
        return sc_objs_created

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        specialchoices_data = validated_data.pop('specialchoices', [])
        # image is handled by the view (uploaded to Cloudinary) and saved as image_url
        validated_data.pop('image', None)

        question = Question.objects.create(**validated_data)

        for i, cdata in enumerate(choices_data):
            Choice.objects.create(question=question,
                                  text_html=cdata.get('text_html', ''),
                                  order=cdata.get('order', i),
                                  is_correct=cdata.get('is_correct', False))
        sc_objs = []
        for i, scdata in enumerate(specialchoices_data):
            sc = SpecialChoice.objects.create(question=question,
                                              text_html=scdata.get('text_html', ''),
                                              order=scdata.get('order', i))
            sc_objs.append(sc)

        # handle special_correct_order mapping (client may send indexes)
        sco = self.initial_data.get('special_correct_order', None)
        if sco is not None:
            parsed = []
            try:
                for val in sco:
                    if isinstance(val, int) and 0 <= val < len(sc_objs):
                        parsed.append(sc_objs[val].id)
                    else:
                        parsed.append(val)
                question.special_correct_order = parsed
                question.save()
            except Exception:
                pass

        return question

    def update(self, instance, validated_data):
        """
        Update the question and nested choices/specialchoices.
        The view should already have handled image upload & set 'image_url' in validated_data if needed.
        """
        choices_data = validated_data.pop('choices', None)
        specialchoices_data = validated_data.pop('specialchoices', None)
        # image field is write-only; if view uploaded it to Cloudinary it will set image_url in validated_data
        validated_data.pop('image', None)

        # update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # sync choices and specialchoices
        self._sync_choices(instance, choices_data)
        sc_objs = self._sync_specialchoices(instance, specialchoices_data) or []

        # special_correct_order handling (if provided in initial_data)
        sco = self.initial_data.get('special_correct_order', None)
        if sco is not None:
            parsed = []
            try:
                # If values are indices map to sc_objs (if they are new), otherwise assume ids
                for val in sco:
                    if isinstance(val, int):
                        # if index and within created list length, map
                        if 0 <= val < len(sc_objs):
                            parsed.append(sc_objs[val].id)
                        else:
                            parsed.append(val)
                    else:
                        parsed.append(val)
                instance.special_correct_order = parsed
                instance.save()
            except Exception:
                # ignore mapping errors
                pass

        return instance

class ATISerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = ATI
        fields = ('id', 'name', 'completed', 'questions')







from rest_framework import serializers
from .models import HESI, HESIQuestion, HESIChoice, HESISpecialChoice

class HESIChoiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = HESIChoice
        fields = ('id', 'text_html', 'order', 'is_correct')

class HESISpecialChoiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = SpecialChoice
        fields = ('id', 'text_html', 'order')

class HESIQuestionSerializer(serializers.ModelSerializer):
    choices = HESIChoiceSerializer(many=True, required=False)
    specialchoices = HESISpecialChoiceSerializer(many=True, required=False)
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.URLField(read_only=True)

    class Meta:
        model = HESIQuestion
        fields = ('id', 'exam', 'order', 'format', 'question_html', 'paragraph_html',
                  'table_html', 'explanation_html', 'image', 'image_url',
                  'choices', 'specialchoices', 'special_correct_order', 'created_at')
        read_only_fields = ('created_at',)

    def _sync_choices(self, question, choices_data):
        """
        Update/create/delete Choice objects to match choices_data ordering.
        choices_data: list of dicts possibly containing 'id'
        """
        if choices_data is None:
            return

        existing = {c.id: c for c in question.choices.all()}
        incoming_ids = []
        for i, cdata in enumerate(choices_data):
            cid = cdata.get('id')
            if cid and cid in existing:
                ch = existing[cid]
                ch.text_html = cdata.get('text_html', '')
                ch.is_correct = bool(cdata.get('is_correct', False))
                ch.order = int(cdata.get('order', i))
                ch.save()
                incoming_ids.append(ch.id)
            else:
                ch = HESIChoice.objects.create(
                    question=question,
                    text_html=cdata.get('text_html', ''),
                    is_correct=bool(cdata.get('is_correct', False)),
                    order=int(cdata.get('order', i))
                )
                incoming_ids.append(ch.id)
        # delete any choices not present in incoming_ids
        question.choices.exclude(id__in=incoming_ids).delete()

    def _sync_specialchoices(self, question, sc_data):
        if sc_data is None:
            return

        existing = {s.id: s for s in question.specialchoices.all()}
        incoming_ids = []
        sc_objs_created = []  # maintain created order for mapping special_correct_order
        for i, sc in enumerate(sc_data):
            sid = sc.get('id')
            if sid and sid in existing:
                s = existing[sid]
                s.text_html = sc.get('text_html', '')
                s.order = int(sc.get('order', i))
                s.save()
                incoming_ids.append(s.id)
                sc_objs_created.append(s)
            else:
                s = HESISpecialChoice.objects.create(
                    question=question,
                    text_html=sc.get('text_html', ''),
                    order=int(sc.get('order', i))
                )
                incoming_ids.append(s.id)
                sc_objs_created.append(s)
        # delete removed
        question.specialchoices.exclude(id__in=incoming_ids).delete()
        return sc_objs_created

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        specialchoices_data = validated_data.pop('specialchoices', [])
        # image is handled by the view (uploaded to Cloudinary) and saved as image_url
        validated_data.pop('image', None)

        question = HESIQuestion.objects.create(**validated_data)

        for i, cdata in enumerate(choices_data):
            HESIChoice.objects.create(question=question,
                                  text_html=cdata.get('text_html', ''),
                                  order=cdata.get('order', i),
                                  is_correct=cdata.get('is_correct', False))
        sc_objs = []
        for i, scdata in enumerate(specialchoices_data):
            sc = HESISpecialChoice.objects.create(question=question,
                                              text_html=scdata.get('text_html', ''),
                                              order=scdata.get('order', i))
            sc_objs.append(sc)

        # handle special_correct_order mapping (client may send indexes)
        sco = self.initial_data.get('special_correct_order', None)
        if sco is not None:
            parsed = []
            try:
                for val in sco:
                    if isinstance(val, int) and 0 <= val < len(sc_objs):
                        parsed.append(sc_objs[val].id)
                    else:
                        parsed.append(val)
                question.special_correct_order = parsed
                question.save()
            except Exception:
                pass

        return question

    def update(self, instance, validated_data):
        """
        Update the question and nested choices/specialchoices.
        The view should already have handled image upload & set 'image_url' in validated_data if needed.
        """
        choices_data = validated_data.pop('choices', None)
        specialchoices_data = validated_data.pop('specialchoices', None)
        # image field is write-only; if view uploaded it to Cloudinary it will set image_url in validated_data
        validated_data.pop('image', None)

        # update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # sync choices and specialchoices
        self._sync_choices(instance, choices_data)
        sc_objs = self._sync_specialchoices(instance, specialchoices_data) or []

        # special_correct_order handling (if provided in initial_data)
        sco = self.initial_data.get('special_correct_order', None)
        if sco is not None:
            parsed = []
            try:
                # If values are indices map to sc_objs (if they are new), otherwise assume ids
                for val in sco:
                    if isinstance(val, int):
                        # if index and within created list length, map
                        if 0 <= val < len(sc_objs):
                            parsed.append(sc_objs[val].id)
                        else:
                            parsed.append(val)
                    else:
                        parsed.append(val)
                instance.special_correct_order = parsed
                instance.save()
            except Exception:
                # ignore mapping errors
                pass

        return instance

class HESISerializer(serializers.ModelSerializer):
    questions = HESIQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = HESI
        fields = ('id', 'name', 'completed', 'questions')





from rest_framework import serializers
from .models import (
    NCLEXExam, NCLEXQuestion, NCLEXChoice, NCLEXCase,
    NCLEXAction, NCLEXPotentialCondition, NCLEXParameter
)

class NCLEXChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXChoice
        fields = ['id', 'label', 'text', 'is_correct', 'correct_order', 'display_order']


class NCLEXCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXCase
        fields = ['id', 'heading', 'case_text']


# --- new serializers for format 9 lists ---
class NCLEXActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXAction
        fields = ['id', 'text', 'is_correct', 'display_order']


class NCLEXPotentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXPotentialCondition
        fields = ['id', 'text', 'is_correct', 'display_order']


class NCLEXParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXParameter
        fields = ['id', 'text', 'is_correct', 'display_order']


class NCLEXQuestionSerializer(serializers.ModelSerializer):
    choices = NCLEXChoiceSerializer(many=True, required=False)
    cases = NCLEXCaseSerializer(many=True, required=False)
    actions = NCLEXActionSerializer(many=True, required=False)
    potentials = NCLEXPotentialSerializer(many=True, required=False)
    parameters = NCLEXParameterSerializer(many=True, required=False)
    exam_id = serializers.PrimaryKeyRelatedField(queryset=NCLEXExam.objects.all(), source='exam', write_only=True)

    class Meta:
        model = NCLEXQuestion
        fields = [
            'id', 'exam_id', 'format', 'order',
            'question_text', 'explanation', 'paragraph', 'image_url',
            'blank_answer',
            # headings for format 5
            'heading1', 'heading2', 'heading3',
            'choices', 'cases', 'actions', 'potentials', 'parameters',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        exam = data.get('exam') or getattr(self.instance, 'exam', None)
        if exam and exam.is_completed and (self.context.get('creating', False)):
            raise serializers.ValidationError("Cannot add questions for a completed exam.")
        return data

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        cases_data = validated_data.pop('cases', [])
        actions_data = validated_data.pop('actions', [])
        potentials_data = validated_data.pop('potentials', [])
        parameters_data = validated_data.pop('parameters', [])
        exam = validated_data.pop('exam')
        validated_data['exam'] = exam
        q = NCLEXQuestion.objects.create(**validated_data)

        for idx, c in enumerate(choices_data, start=1):
            NCLEXChoice.objects.create(
                question=q,
                label=c.get('label') or f"Choice {idx}",
                text=c.get('text', ''),
                is_correct=c.get('is_correct', False),
                correct_order=c.get('correct_order'),
                display_order=c.get('display_order', idx),
            )

        for c in cases_data:
            NCLEXCase.objects.create(question=q, heading=c['heading'], case_text=c['case_text'])

        # create actions/potentials/parameters
        for idx, a in enumerate(actions_data, start=1):
            NCLEXAction.objects.create(
                question=q,
                text=a.get('text', ''),
                is_correct=a.get('is_correct', False),
                display_order=a.get('display_order', idx),
            )
        for idx, p in enumerate(potentials_data, start=1):
            NCLEXPotentialCondition.objects.create(
                question=q,
                text=p.get('text', ''),
                is_correct=p.get('is_correct', False),
                display_order=p.get('display_order', idx),
            )
        for idx, pr in enumerate(parameters_data, start=1):
            NCLEXParameter.objects.create(
                question=q,
                text=pr.get('text', ''),
                is_correct=pr.get('is_correct', False),
                display_order=pr.get('display_order', idx),
            )

        return q

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        cases_data = validated_data.pop('cases', None)
        actions_data = validated_data.pop('actions', None)
        potentials_data = validated_data.pop('potentials', None)
        parameters_data = validated_data.pop('parameters', None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for idx, c in enumerate(choices_data, start=1):
                NCLEXChoice.objects.create(
                    question=instance,
                    label=c.get('label') or f"Choice {idx}",
                    text=c.get('text', ''),
                    is_correct=c.get('is_correct', False),
                    correct_order=c.get('correct_order'),
                    display_order=c.get('display_order', idx),
                )

        if cases_data is not None:
            instance.cases.all().delete()
            for c in cases_data:
                NCLEXCase.objects.create(question=instance, heading=c['heading'], case_text=c['case_text'])

        # actions
        if actions_data is not None:
            instance.actions.all().delete()
            for idx, a in enumerate(actions_data, start=1):
                NCLEXAction.objects.create(
                    question=instance,
                    text=a.get('text', ''),
                    is_correct=a.get('is_correct', False),
                    display_order=a.get('display_order', idx),
                )

        # potentials
        if potentials_data is not None:
            instance.potentials.all().delete()
            for idx, p in enumerate(potentials_data, start=1):
                NCLEXPotentialCondition.objects.create(
                    question=instance,
                    text=p.get('text', ''),
                    is_correct=p.get('is_correct', False),
                    display_order=p.get('display_order', idx),
                )

        # parameters
        if parameters_data is not None:
            instance.parameters.all().delete()
            for idx, pr in enumerate(parameters_data, start=1):
                NCLEXParameter.objects.create(
                    question=instance,
                    text=pr.get('text', ''),
                    is_correct=pr.get('is_correct', False),
                    display_order=pr.get('display_order', idx),
                )

        return instance


class NCLEXExamSerializer(serializers.ModelSerializer):
    questions = NCLEXQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = NCLEXExam
        fields = ['id', 'name', 'is_completed', 'duration_minutes', 'created_at', 'questions']
        read_only_fields = ['id', 'created_at', 'questions']






from rest_framework import serializers
from .models import NCLEXExam, NCLEXQuestion, NCLEXChoice, NCLEXCase, NclexrnAttempt, NclexrnReport, NclexrnBookmark, NCLEXAction, NCLEXPotentialCondition, NCLEXParameter

class NclexrnChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXChoice
        fields = ('id','label','text','is_correct','correct_order','display_order')

class NclexrnCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXCase
        fields = ('id','heading','case_text')

class NclexrnActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXAction
        fields = ('id','text','is_correct','display_order')

class NclexrnPotentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXPotentialCondition
        fields = ('id','text','is_correct','display_order')

class NclexrnParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCLEXParameter
        fields = ('id','text','is_correct','display_order')

class NclexrnQuestionSerializer(serializers.ModelSerializer):
    choices = NclexrnChoiceSerializer(many=True, read_only=True)
    cases = NclexrnCaseSerializer(many=True, read_only=True)
    actions = NclexrnActionSerializer(many=True, read_only=True)
    potentials = NclexrnPotentialSerializer(many=True, read_only=True)
    parameters = NclexrnParameterSerializer(many=True, read_only=True)

    class Meta:
        model = NCLEXQuestion
        fields = (
            'id','exam','format','order','question_text','explanation','paragraph','image_url',
            'blank_answer','heading1','heading2','heading3','choices','cases',
            'actions','potentials','parameters'
        )

class NclexrnExamSerializer(serializers.ModelSerializer):
    questions = NclexrnQuestionSerializer(many=True, read_only=True)
    class Meta:
        model = NCLEXExam
        fields = ('id','name','is_completed','duration_minutes','created_at','questions')

class NclexrnAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = NclexrnAttempt
        fields = '__all__'
        read_only_fields = ('user','started_at','completed_at')

class NclexrnReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = NclexrnReport
        fields = '__all__'
        read_only_fields = ('user','created_at')

class NclexrnBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = NclexrnBookmark
        fields = '__all__'
        read_only_fields = ('user','created_at')







from rest_framework import serializers
from .models import (
    PrepExam, PrepQuestion, PrepChoice, PrepCase,
    PrepAction, PrepPotentialCondition, PrepParameter,
    PrepAttempt, PrepReport, PrepBookmark
)

# --- main edit/create serializers for admin-like API ---
class PrepChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepChoice
        fields = ['id', 'label', 'text', 'is_correct', 'correct_order', 'display_order']


class PrepCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepCase
        fields = ['id', 'heading', 'case_text']


# --- new serializers for format 9 lists ---
class PrepActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepAction
        fields = ['id', 'text', 'is_correct', 'display_order']


class PrepPotentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepPotentialCondition
        fields = ['id', 'text', 'is_correct', 'display_order']


class PrepParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepParameter
        fields = ['id', 'text', 'is_correct', 'display_order']


class PrepQuestionSerializer(serializers.ModelSerializer):
    choices = PrepChoiceSerializer(many=True, required=False)
    cases = PrepCaseSerializer(many=True, required=False)
    actions = PrepActionSerializer(many=True, required=False)
    potentials = PrepPotentialSerializer(many=True, required=False)
    parameters = PrepParameterSerializer(many=True, required=False)
    exam_id = serializers.PrimaryKeyRelatedField(queryset=PrepExam.objects.all(), source='exam', write_only=True)

    class Meta:
        model = PrepQuestion
        fields = [
            'id', 'exam_id', 'format', 'order',
            'question_text', 'explanation', 'paragraph', 'image_url',
            'blank_answer',
            # headings for format 5
            'heading1', 'heading2', 'heading3',
            'choices', 'cases', 'actions', 'potentials', 'parameters',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        exam = data.get('exam') or getattr(self.instance, 'exam', None)
        if exam and exam.is_completed and (self.context.get('creating', False)):
            raise serializers.ValidationError("Cannot add questions for a completed exam.")
        return data

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        cases_data = validated_data.pop('cases', [])
        actions_data = validated_data.pop('actions', [])
        potentials_data = validated_data.pop('potentials', [])
        parameters_data = validated_data.pop('parameters', [])
        exam = validated_data.pop('exam')
        validated_data['exam'] = exam
        q = PrepQuestion.objects.create(**validated_data)

        for idx, c in enumerate(choices_data, start=1):
            PrepChoice.objects.create(
                question=q,
                label=c.get('label') or f"Choice {idx}",
                text=c.get('text', ''),
                is_correct=c.get('is_correct', False),
                correct_order=c.get('correct_order'),
                display_order=c.get('display_order', idx),
            )

        for c in cases_data:
            PrepCase.objects.create(question=q, heading=c['heading'], case_text=c['case_text'])

        # create actions/potentials/parameters
        for idx, a in enumerate(actions_data, start=1):
            PrepAction.objects.create(
                question=q,
                text=a.get('text', ''),
                is_correct=a.get('is_correct', False),
                display_order=a.get('display_order', idx),
            )
        for idx, p in enumerate(potentials_data, start=1):
            PrepPotentialCondition.objects.create(
                question=q,
                text=p.get('text', ''),
                is_correct=p.get('is_correct', False),
                display_order=p.get('display_order', idx),
            )
        for idx, pr in enumerate(parameters_data, start=1):
            PrepParameter.objects.create(
                question=q,
                text=pr.get('text', ''),
                is_correct=pr.get('is_correct', False),
                display_order=pr.get('display_order', idx),
            )

        return q

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        cases_data = validated_data.pop('cases', None)
        actions_data = validated_data.pop('actions', None)
        potentials_data = validated_data.pop('potentials', None)
        parameters_data = validated_data.pop('parameters', None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for idx, c in enumerate(choices_data, start=1):
                PrepChoice.objects.create(
                    question=instance,
                    label=c.get('label') or f"Choice {idx}",
                    text=c.get('text', ''),
                    is_correct=c.get('is_correct', False),
                    correct_order=c.get('correct_order'),
                    display_order=c.get('display_order', idx),
                )

        if cases_data is not None:
            instance.cases.all().delete()
            for c in cases_data:
                PrepCase.objects.create(question=instance, heading=c['heading'], case_text=c['case_text'])

        # actions
        if actions_data is not None:
            instance.actions.all().delete()
            for idx, a in enumerate(actions_data, start=1):
                PrepAction.objects.create(
                    question=instance,
                    text=a.get('text', ''),
                    is_correct=a.get('is_correct', False),
                    display_order=a.get('display_order', idx),
                )

        # potentials
        if potentials_data is not None:
            instance.potentials.all().delete()
            for idx, p in enumerate(potentials_data, start=1):
                PrepPotentialCondition.objects.create(
                    question=instance,
                    text=p.get('text', ''),
                    is_correct=p.get('is_correct', False),
                    display_order=p.get('display_order', idx),
                )

        # parameters
        if parameters_data is not None:
            instance.parameters.all().delete()
            for idx, pr in enumerate(parameters_data, start=1):
                PrepParameter.objects.create(
                    question=instance,
                    text=pr.get('text', ''),
                    is_correct=pr.get('is_correct', False),
                    display_order=pr.get('display_order', idx),
                )

        return instance


class PrepExamSerializer(serializers.ModelSerializer):
    questions = PrepQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = PrepExam
        fields = ['id', 'name', 'is_completed', 'duration_minutes', 'created_at', 'questions']
        read_only_fields = ['id', 'created_at', 'questions']


# --- the "runtime"/client serializers (read-only friendly) ---
class PrepChoiceReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepChoice
        fields = ('id','label','text','is_correct','correct_order','display_order')

class PrepCaseReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepCase
        fields = ('id','heading','case_text')

class PrepActionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepAction
        fields = ('id','text','is_correct','display_order')

class PrepPotentialReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepPotentialCondition
        fields = ('id','text','is_correct','display_order')

class PrepParameterReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepParameter
        fields = ('id','text','is_correct','display_order')

class PrepQuestionReadSerializer(serializers.ModelSerializer):
    choices = PrepChoiceReadSerializer(many=True, read_only=True)
    cases = PrepCaseReadSerializer(many=True, read_only=True)
    actions = PrepActionReadSerializer(many=True, read_only=True)
    potentials = PrepPotentialReadSerializer(many=True, read_only=True)
    parameters = PrepParameterReadSerializer(many=True, read_only=True)

    class Meta:
        model = PrepQuestion
        fields = (
            'id','exam','format','order','question_text','explanation','paragraph','image_url',
            'blank_answer','heading1','heading2','heading3','choices','cases',
            'actions','potentials','parameters'
        )

class PrepExamReadSerializer(serializers.ModelSerializer):
    questions = PrepQuestionReadSerializer(many=True, read_only=True)
    class Meta:
        model = PrepExam
        fields = ('id','name','is_completed','duration_minutes','created_at','questions')

class PrepAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepAttempt
        fields = '__all__'
        read_only_fields = ('user','started_at','completed_at')

class PrepReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepReport
        fields = '__all__'
        read_only_fields = ('user','created_at')

class PrepBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepBookmark
        fields = '__all__'
        read_only_fields = ('user','created_at')



