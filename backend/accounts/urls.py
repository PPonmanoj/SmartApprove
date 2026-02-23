from django.urls import path
from . import views

urlpatterns = [
    path('student/signup/', views.StudentSignupView.as_view(), name='student-signup'),
    path('staff/signup/', views.StaffSignupView.as_view(), name='staff-signup'),
    path('login/', views.LoginView.as_view(), name='login'),

    # Bonafide endpoints
    path('bonafide/check/', views.BonafideCheckView.as_view(), name='bonafide-check'),
    path('bonafide/submit/', views.BonafideSubmitView.as_view(), name='bonafide-submit'),
    path('bonafide/incoming/', views.IncomingBonafideListView.as_view(), name='bonafide-incoming'),
    path('bonafide/my/', views.StudentBonafideListView.as_view(), name='bonafide-my'),        # FIX F-08
    path('bonafide/<int:pk>/', views.BonafideDetailView.as_view(), name='bonafide-detail'),
    path('bonafide/<int:pk>/status/', views.BonafideUpdateStatusView.as_view(), name='bonafide-status'), # FIX F-07
]
