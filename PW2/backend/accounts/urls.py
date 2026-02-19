from django.urls import path
from .views import (
    StudentSignupView, StaffSignupView, LoginView,
    BonafideCheckView, BonafideSubmitView, BonafideDetailView,
    IncomingBonafideListView, BonafideActionView, BonafideHistoryView,
    NotificationListView, NotificationMarkReadView,
    BonafideFileView, BonafideDownloadTokenView, PublicBonafideDownloadView,
    StudentBonafideListView
)

urlpatterns = [
    path('student/signup/', StudentSignupView.as_view(), name='student-signup'),
    path('staff/signup/', StaffSignupView.as_view(), name='staff-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('bonafide/check/', BonafideCheckView.as_view(), name='bonafide-check'),
    path('bonafide/submit/', BonafideSubmitView.as_view(), name='bonafide-submit'),
    path('bonafide/incoming/', IncomingBonafideListView.as_view(), name='bonafide-incoming'),
    path('bonafide/<int:pk>/', BonafideDetailView.as_view(), name='bonafide-detail'),
    path("bonafide/<int:pk>/action/", BonafideActionView.as_view(), name="bonafide-action"),
    path("bonafide/history/", BonafideHistoryView.as_view(), name="bonafide-history"),
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/mark-read/", NotificationMarkReadView.as_view(), name="notification-mark-read"),
    path("bonafide/<int:pk>/file/", BonafideFileView.as_view(), name="bonafide-file"),
    path("bonafide/<int:pk>/file-token/", BonafideDownloadTokenView.as_view(), name="bonafide-file-token"),
    path("bonafide/download/<str:token>/", PublicBonafideDownloadView.as_view(), name="bonafide-download-token"),
    path("bonafide/mine/", StudentBonafideListView.as_view(), name="bonafide-mine"),
]