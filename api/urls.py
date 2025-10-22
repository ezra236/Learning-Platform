# api/urls.py
from django.urls import path
from . import views, public, user
from .user import SignupAPIView, VerifyCodeAPIView, ResendCodeAPIView, CsrfTokenView, SigninAPIView, AuthSessionAPIView, SubscriptionStatusAPIView

urlpatterns = [
    path("csrf/", views.csrf_token_view, name="csrf"),
    path("superadmin/exists/", views.superadmin_exists_view, name="superadmin_exists"),
    path("superadmin/signup/", views.send_verification_view, name="superadmin_signup"),
    path("superadmin/verify/", views.verify_code_view, name="superadmin_verify"),

    path("superadmin/signin/", views.superadmin_signin_view, name="superadmin_signin"),
    path("superadmin/signout/", views.superadmin_signout_view, name="superadmin_signout"),
    path("superadmin/me/", views.superadmin_me_view, name="superadmin_me"), 

    path("reviews/", views.reviews_list_view, name="reviews-list"),
    path("plans/", views.plans_list_create_view, name="plans-list-create"),
    path("plans/<int:plan_id>/", views.plan_detail_view, name="plan-detail"),

    path("auth/csrf/", CsrfTokenView.as_view(), name="api-csrf"),
    path("auth/signup/", SignupAPIView.as_view(), name="api-signup"),
    path("auth/verify/", VerifyCodeAPIView.as_view(), name="api-verify"),
    path("auth/resend/", ResendCodeAPIView.as_view(), name="api-resend"),
    path("signin/", SigninAPIView.as_view(), name="signin"),  # <-- new
    path("auth/session/", AuthSessionAPIView.as_view(), name="auth_session"),   

    path("plans/public/", user.plans_public_view, name="plans-public"),
    path("intended-plans/", user.intended_plans_view, name="intended-plans"),
    path("intended-plans/<uuid:slip_id>/", user.intended_plan_detail_view, name="intended-plan-detail"),
    path("intended-plans/total/", user.intended_plans_total_view, name="intended-plans-total"),

    path("paypal/create-order/", user.paypal_create_order_view, name="paypal-create-order"),
    path("paypal/capture-order/", user.paypal_capture_order_view, name="paypal-capture-order"),

    path("subscriptions/", user.subscriptions_view, name="api-subscriptions"),

    path("subscription/status/", SubscriptionStatusAPIView.as_view(), name="subscription-status"),    

    path("evidence/", views.create_evidence_view, name="create_evidence"),
    path("admin-assistants/", views.admin_assistants_list_view, name="admin_assistants_list"),
    path("admin-assistants/create/", views.create_admin_assistant_view, name="create_admin_assistant"),
    path("admin-assistants/<uuid:uid>/activate/", views.admin_assistant_activate_view, name="activate_admin_assistant"),
    path("admin-assistants/<uuid:uid>/deactivate/", views.admin_assistant_deactivate_view, name="deactivate_admin_assistant"),
    path("admin-assistants/<uuid:uid>/", views.admin_assistant_delete_view, name="delete_admin_assistant"),  

    path("public/evidences/", public.public_evidences_list_view, name="public_evidences"),
    path("public/evidences/<uuid:uid>/", public.public_evidence_detail_view, name="public_evidence_detail"),
    path("reviews/submit/", public.submit_review, name="submit_review"),
    path("csrfs/", public.get_csrf_token, name="get_csrf_token"),

    path("exams/create/", views.create_exam_view, name="create_exam"),
    path("exams/active/", views.active_exam_view, name="active_exam"),
    path("exams/<int:exam_id>/questions/", views.exam_questions_view, name="exam_questions"),
    path("exams/mark-complete/", views.mark_exam_complete_view, name="mark_exam_complete"),
    path("questions/create/", views.create_question_view, name="create_question"),
    path("upload-image/", views.upload_image_view, name="upload_image"),

    path("hesi/exams/create/", views.create_hesi_exam_view, name="create_hesi_exam"),
    path("hesi/exams/active/", views.active_hesi_exam_view, name="active_hesi_exam"),
    path("hesi/exams/<int:exam_id>/questions/", views.hesi_exam_questions_view, name="hesi_exam_questions"),
    path("hesi/exams/mark-complete/", views.mark_hesi_exam_complete_view, name="mark_hesi_exam_complete"),
    path("hesi/questions/create/", views.create_hesi_question_view, name="create_hesi_question"),
    path("hesi/upload-image/", views.hesi_upload_image_view, name="hesi_upload_image"), 

    path("examslist/", views.list_exams_view, name="list_exams"),
    path("examslist/<int:exam_id>/full/", views.get_exam_full_view, name="get_exam_full"),
    path("examslist/<int:exam_id>/update/", views.update_exam_view, name="update_exam"),
    path("questions/<int:question_id>/update/", views.update_question_view, name="update_question"),
    path("questions/<int:question_id>/replace-image/", views.replace_question_image_view, name="replace_question_image"),

    path("hesi/examslist/", views.hesi_list_exams_view, name="hesi_list_exams"),
    path("hesi/examslist/<int:exam_id>/full/", views.hesi_get_exam_full_view, name="hesi_get_exam_full"),
    path("hesi/examslist/<int:exam_id>/update/", views.hesi_update_exam_view, name="hesi_update_exam"),
    path("hesi/questions/<int:question_id>/update/", views.hesi_update_question_view, name="hesi_update_question"),
    path("hesi/questions/<int:question_id>/replace-image/", views.hesi_replace_question_image_view, name="hesi_replace_question_image"), 
] 
 