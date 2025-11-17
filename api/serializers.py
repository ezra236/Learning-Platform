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
from .models import Announcement, Campaign

class AnnouncementSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField(default='announcement')

    class Meta:
        model = Announcement
        fields = ("id", "format", "mediapath", "public_id", "created_at", "type")

    def get_type(self, obj):
        return "announcement"


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




