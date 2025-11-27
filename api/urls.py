# api/urls.py
from django.urls import path
from .views import ATIListCreateAPIView, ATIGetAPIView, QuestionCreateAPIView, QuestionListAPIView, QuestionRetrieveUpdateAPIView, HESIListCreateAPIView, HESIGetAPIView, HESIQuestionCreateAPIView, HESIQuestionListAPIView, HESIQuestionRetrieveUpdateAPIView
from . import views, public, user, analytics, announcement, nclex
from . import atiexam
from . import ads
from . import assistant
from . import newsletter
from . import pdf
from .import purchasepdf
from .bookmark import BookmarkedQuestionsAPIView
from .user import SignupAPIView, VerifyCodeAPIView, ResendCodeAPIView, CsrfTokenView, SigninAPIView, AuthSessionAPIView, ProfileView, SendPasswordCodeView, VerifyPasswordCodeView, ResetPasswordView, MarketingQueueView, CampaignSeenView
from .nclex import (
    NCLEXExamListCreateAPIView,
    NCLEXExamRetrieveUpdateAPIView,
    NCLEXQuestionCreateAPIView,
    NCLEXQuestionListAPIView,
    NCLEXQuestionRetrieveUpdateAPIView,
    NCLEXUploadImageAPIView,
)

from .nclexexam import (
    NCLEXExamByNameAPIView,
    NclexrnCheckAttemptAPIView,
    NclexrnAttemptCreateAPIView,
    NclexrnAttemptDetailAPIView,
    NclexrnSubmitAttemptAPIView,
    NclexrnReportCreateAPIView,
    NclexrnBookmarkCreateAPIView,
)

from .nclexpn import (
    PrepExamListCreateAPIView,
    PrepExamRetrieveUpdateAPIView,
    PrepQuestionCreateAPIView,
    PrepQuestionListAPIView,
    PrepQuestionRetrieveUpdateAPIView,
    PrepUploadImageAPIView,
)

from .nclexpnexam import (
    PrepExamByNameAPIView,
    PrepCheckAttemptAPIView,
    PrepAttemptCreateAPIView,
    PrepAttemptDetailAPIView,
    PrepSubmitAttemptAPIView,
    PrepReportCreateAPIView,
    PrepBookmarkCreateAPIView,
)

from .ati import AtiDashboardView
from .hesi import HesiDashboardView

urlpatterns = [ 

    path("prep/exams/by-name/", PrepExamByNameAPIView.as_view(), name="prep_exams_by_name"),
    path("prep/attempts/check/<int:exam_id>/", PrepCheckAttemptAPIView.as_view(), name="prep_check_attempt"),
    path("prep/attempts/", PrepAttemptCreateAPIView.as_view(), name="prep_create_attempt"),
    path("prep/attempts/<int:pk>/", PrepAttemptDetailAPIView.as_view(), name="prep_attempt_detail"),
    path("prep/attempts/<int:pk>/submit/", PrepSubmitAttemptAPIView.as_view(), name="prep_submit_attempt"),
    path("prep/reports/", PrepReportCreateAPIView.as_view(), name="prep_reports_create"),
    path("prep/bookmarks/", PrepBookmarkCreateAPIView.as_view(), name="prep_bookmarks_create"),
    
    path("prep/exams/", PrepExamListCreateAPIView.as_view(), name="prep_exams_list_create"),
    path("prep/exams/<int:pk>/", PrepExamRetrieveUpdateAPIView.as_view(), name="prep_exams_detail"),
    path("prep/questions/", PrepQuestionListAPIView.as_view(), name="prep_questions_list"),
    path("prep/questions/create/", PrepQuestionCreateAPIView.as_view(), name="prep_questions_create"),
    path("prep/questions/<int:pk>/", PrepQuestionRetrieveUpdateAPIView.as_view(), name="prep_questions_detail"),
    path("prep/upload-image/", PrepUploadImageAPIView.as_view(), name="prep_upload_image"),
    
    path("nclex/exams/by-name/", NCLEXExamByNameAPIView.as_view(), name="nclex_exams_by_name"),
    path("nclex/attempts/check/<int:exam_id>/", NclexrnCheckAttemptAPIView.as_view(), name="nclex_check_attempt"),
    path("nclex/attempts/", NclexrnAttemptCreateAPIView.as_view(), name="nclex_create_attempt"),
    path("nclex/attempts/<int:pk>/", NclexrnAttemptDetailAPIView.as_view(), name="nclex_attempt_detail"),
    path("nclex/attempts/<int:pk>/submit/", NclexrnSubmitAttemptAPIView.as_view(), name="nclex_submit_attempt"),
    path("nclex/reports/", NclexrnReportCreateAPIView.as_view(), name="nclex_reports_create"),
    path("nclex/bookmarks/", NclexrnBookmarkCreateAPIView.as_view(), name="nclex_bookmarks_create"),
    
    path("nclex/exams/", NCLEXExamListCreateAPIView.as_view(), name="nclex_exams_list_create"),
    path("nclex/exams/<int:pk>/", NCLEXExamRetrieveUpdateAPIView.as_view(), name="nclex_exams_detail"),
    path("nclex/questions/", NCLEXQuestionListAPIView.as_view(), name="nclex_questions_list"),
    path("nclex/questions/create/", NCLEXQuestionCreateAPIView.as_view(), name="nclex_questions_create"),
    path("nclex/questions/<int:pk>/", NCLEXQuestionRetrieveUpdateAPIView.as_view(), name="nclex_questions_detail"),
    path("nclex/upload-image/", NCLEXUploadImageAPIView.as_view(), name="nclex_upload_image"),    

    path("pdfs/", pdf.pdfs_view, name="pdfs"),
    path("public/pdfs/", purchasepdf.public_pdfs_list, name="public_pdfs_list"),
    path("public/purchase_sessions/", purchasepdf.create_purchase_session, name="create_purchase_session"),
    path("public/purchase_sessions/<uuid:session_id>/set_email/", purchasepdf.set_session_email, name="set_session_email"),
    path("public/create-paypal-order/", purchasepdf.create_paypal_order, name="create_paypal_order"),
    path("public/complete-order/", purchasepdf.complete_order, name="complete_order"),

    path("csrf/", views.csrf_token_view, name="csrf"),
    path("superadmin/exists/", views.superadmin_exists_view, name="superadmin_exists"),
    path("superadmin/signup/", views.send_verification_view, name="superadmin_signup"),
    path("superadmin/verify/", views.verify_code_view, name="superadmin_verify"),

    path("superadmin/signin/", views.superadmin_signin_view, name="superadmin_signin"),
    path("superadmin/signout/", views.superadmin_signout_view, name="superadmin_signout"),
    path("superadmin/me/", views.superadmin_me_view, name="superadmin_me"), 

    path('newsletter/subscribers/', newsletter.newsletter_subscribers, name='newsletter_subscribers'),
    path('newsletter/templates/', newsletter.email_templates, name='email_templates'),
    path('newsletter/send/', newsletter.send_newsletter, name='send_newsletter'),

    path("plans/<uuid:plan_id>/", views.plan_edit_api, name="api_edit_plan"),

    path("today-signed-in/", analytics.today_signed_in_count, name="api_today_signed_in"),
    path("total-registered-verified/", analytics.total_registered_verified, name="api_total_registered_verified"),
    path("today-payments/", analytics.today_payments, name="api_today_payments"),
    path("page-visit/", analytics.record_page_visit, name="api_page_visit"),
    path("page-visits/", analytics.page_visits_summary, name="page_visits_summary"),
    path("total-visitors/", analytics.total_visitors_summary, name="total_visitors_summary"),

    path("exams/", views.exams_list, name="exams_list"),
    path("exams/<str:pk>/", views.exams_delete, name="exams_delete"),
    path("exams/<str:pk>/set_free/", views.exams_set_free, name="exams_set_free"), 

    path("ati-teas-stats/", analytics.ati_teas_stats, name="ati_teas_stats"),
    path("hesi-a2-stats/", analytics.hesi_a2_stats, name="hesi_a2_stats"),

    path("campaigns/", announcement.CampaignListCreateView.as_view(), name="campaign_list_create"),
    path("campaigns/<uuid:pk>/", announcement.CampaignRetrieveUpdateDeleteView.as_view(), name="campaign_detail_update_delete"),

    path("campaignsinsights/", views.campaigns_insights_view, name="api-campaigns-insights"),

    path("admin/stats/", analytics.admin_stats_view, name="admin-stats"),
    path("admin/monthly-activity/", analytics.admin_monthly_activity_view, name="admin-monthly-activity"), 
    path("admin/stats/", analytics.admin_stats_view, name="admin-stats"),
    path("admin/monthly-activity/", analytics.admin_monthly_activity_view, name="admin-monthly-activity"),
    path("admin/subscriptions-overview/", analytics.admin_subscriptions_overview, name="admin-subscriptions-overview"),
    path("admin/verified-users-overview/", analytics.admin_verified_users_overview, name="admin-verified-users"),
    path("admin/growth-pie-data/", analytics.admin_growth_pie_view, name="admin-growth-pie-data"),
    path("admin/overview-bars/", analytics.admin_overview_bars_view, name="admin-overview-bars"),

    path("reviews/", views.reviews_list_view, name="reviews-list"),
    path("plans/", views.plans_list_create_view, name="plans-list-create"),
    path("plans/<int:plan_id>/", views.plan_detail_view, name="plan-detail"),

    path("auth/csrf/", CsrfTokenView.as_view(), name="api-csrf"),
    path("auth/signup/", SignupAPIView.as_view(), name="api-signup"),
    path("auth/verify/", VerifyCodeAPIView.as_view(), name="api-verify"),
    path("auth/resend/", ResendCodeAPIView.as_view(), name="api-resend"),
    path("signin/", SigninAPIView.as_view(), name="signin"),  # <-- new
    path("auth/session/", AuthSessionAPIView.as_view(), name="auth_session"),  

    path("subscriptionsz/", user.SubscriptionListView.as_view(), name="api-subscriptions"),

    path("user/ati-dashboard/", AtiDashboardView.as_view(), name="ati-dashboard"),
    path("user/hesi-dashboard/", HesiDashboardView.as_view(), name="hesi-dashboard"),

    path("marketing/queue/", MarketingQueueView.as_view(), name="marketing-queue"),
    path("marketing/campaign_seen/", CampaignSeenView.as_view(), name="campaign-seen"), 

    path("auth/profile/", ProfileView.as_view(), name="api-profile"),
    path("auth/password/send-code/", SendPasswordCodeView.as_view(), name="api-send-code"),
    path("auth/password/verify-code/", VerifyPasswordCodeView.as_view(), name="api-verify-code"),
    path("auth/password/reset/", ResetPasswordView.as_view(), name="api-reset-password"),

    path("plans/public/", user.plans_public_view, name="plans-public"),
    path("intended-plans/", user.intended_plans_view, name="intended-plans"),
    path("intended-plans/<uuid:slip_id>/", user.intended_plan_detail_view, name="intended-plan-detail"),
    path("intended-plans/total/", user.intended_plans_total_view, name="intended-plans-total"),

    path("paypal/create-order/", user.paypal_create_order_view, name="paypal-create-order"),
    path("paypal/capture-order/", user.paypal_capture_order_view, name="paypal-capture-order"),

    path("subscriptions/", user.subscriptions_view, name="api-subscriptions"),

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
    path("plans/ati-teas-7/", public.plans_for_ati_teas_7, name="plans_ati_teas_7"),
    path("plans/nclex/", public.plans_for_nclex, name="plans_nclex"),
    path("plans/hesia2/", public.plans_for_hesia2, name="plans_ati_teas_7"),
    path("plan/", ads.plans_all, name="plans_all"),
    path("newsletter/subscribe/", ads.subscribe_newsletter, name="newsletter_subscribe"),

    path('ati/', ATIListCreateAPIView.as_view(), name='ati-list-create'),
    path('ati/<int:pk>/', ATIGetAPIView.as_view(), name='ati-detail'),
    path('ati/questions/', QuestionCreateAPIView.as_view(), name='question-create'),
    path('ati/questions/<int:pk>/', QuestionRetrieveUpdateAPIView.as_view(), name='question-detail'),
    path('ati/questions/list/', QuestionListAPIView.as_view(), name='question-list'),    

    path('hesi/', HESIListCreateAPIView.as_view(), name='ati-list-create'),
    path('hesi/<int:pk>/', HESIGetAPIView.as_view(), name='ati-detail'),
    path('hesi/questions/', HESIQuestionCreateAPIView.as_view(), name='question-create'),
    path('hesi/questions/<int:pk>/', HESIQuestionRetrieveUpdateAPIView.as_view(), name='question-detail'),
    path('hesi/questions/list/', HESIQuestionListAPIView.as_view(), name='question-list'),    

    path("exam/<path:examname>/", atiexam.ExamDetailAPIView.as_view(), name="api-exam-detail"), 
    path("attempt/<str:exam_id>/", atiexam.AttemptAPIView.as_view(), name="api-attempt"),
    path("bookmark/", atiexam.BookmarkAPIView.as_view(), name="api-bookmark"),
    path("report/", atiexam.ReportAPIView.as_view(), name="api-report"),

    path("hesiexam/<path:examname>/", atiexam.HESIExamDetailAPIView.as_view(), name="api-exam-detail"),
    path("hesiattempt/<str:exam_id>/", atiexam.HESIAttemptAPIView.as_view(), name="api-attempt"),
    path("hesibookmark/", atiexam.HESIBookmarkAPIView.as_view(), name="api-bookmark"),
    path("hesireport/", atiexam.HESIReportAPIView.as_view(), name="api-report"), 

    path('bookmarks/', BookmarkedQuestionsAPIView.as_view(), name='api-bookmarks'),

    path("subscriptionsdata/", views.subscriptions_list, name="subscriptions_list"),
    path("subscriptionsdata/<uuid:id>/", views.subscription_delete, name="subscription_delete"),

    path("assistant/signin/", assistant.assistant_signin_view, name="superadmin_signin"),
    path("assistant/signout/", assistant.assistant_signout_view, name="superadmin_signout"),
    path("assistant/me/", assistant.assistant_me_view, name="superadmin_me"),  
] 
  