from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [('student', 'Student'), ('staff', 'Staff')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    name = models.CharField(max_length=100, blank=True)
    mobile_number = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Department(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name


class StudentClass(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='classes')
    
    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    student_class = models.ForeignKey(StudentClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    
    def __str__(self):
        return f"Student: {self.user.username}"


class StaffProfile(models.Model):
    DESIGNATION_CHOICES = [
        ('TUTOR', 'Tutor'),
        ('PROGRAM_COORDINATOR', 'Program Coordinator'),
        ('HOD', 'Head of Department'),
        ('DEAN', 'Dean'),
        ('PRINCIPAL', 'Principal'),
        ('OTHER', 'Other'),
    ]
    
    DEAN_TYPE_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('AUTONOMOUS', 'Autonomous'),
        ('ADMIN', 'Administrative'),
        ('PLACEMENT', 'Placement'),
        ('STUDENT_AFFAIRS', 'Student Affairs'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='staff_profile')
    designation = models.CharField(max_length=30, choices=DESIGNATION_CHOICES)
    student_class = models.ForeignKey(StudentClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='tutors')
    hod_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='hods')
    dean_type = models.CharField(max_length=20, choices=DEAN_TYPE_CHOICES, blank=True, null=True)
    
    def __str__(self):
        return f"{self.designation}: {self.user.username}"


class BonafideRequest(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('tutor_review', 'Under Tutor Review'),
        ('tutor_approved', 'Tutor Approved'),
        ('tutor_rejected', 'Tutor Rejected'),
        ('hod_review', 'Under HOD Review'),
        ('hod_approved', 'HOD Approved'),
        ('hod_rejected', 'HOD Rejected'),
        ('dean_review', 'Under Dean Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    AI_MODEL_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('groq', 'Groq Llama'),
    ]
    
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bonafide_requests')
    student_name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=50)
    contact = models.CharField(max_length=15)
    reason = models.TextField()
    permission_file = models.FileField(upload_to='bonafide_permissions/')
    
    # AI Analysis Fields
    ai_model_used = models.CharField(max_length=20, choices=AI_MODEL_CHOICES, default='gemini')
    extracted = models.JSONField(default=dict, blank=True)
    checklist = models.JSONField(default=dict, blank=True)
    is_valid = models.BooleanField(default=False)
    explanation = models.TextField(blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)  # 0.0-1.0
    
    # Approval Flow Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    current_approver = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='pending_approvals')
    
    # Approval Actions
    tutor_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='tutor_approvals')
    tutor_approved_at = models.DateTimeField(null=True, blank=True)
    tutor_comment = models.TextField(blank=True)
    
    hod_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='hod_approvals')
    hod_approved_at = models.DateTimeField(null=True, blank=True)
    hod_comment = models.TextField(blank=True)
    
    dean_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='dean_approvals')
    dean_approved_at = models.DateTimeField(null=True, blank=True)
    dean_comment = models.TextField(blank=True)
    
    final_rejection_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Bonafide for {self.student_name} - {self.status}"
    
    def get_approval_chain(self):
        """Returns the approval chain as a list of steps with their status"""
        chain = [
            {
                'step': 'Tutor',
                'status': 'approved' if self.tutor_approved_by else ('pending' if self.status in ['submitted', 'tutor_review'] else 'waiting'),
                'approver': self.tutor_approved_by.name if self.tutor_approved_by else None,
                'timestamp': self.tutor_approved_at,
                'comment': self.tutor_comment
            },
            {
                'step': 'HOD',
                'status': 'approved' if self.hod_approved_by else ('pending' if self.status in ['hod_review'] else 'waiting'),
                'approver': self.hod_approved_by.name if self.hod_approved_by else None,
                'timestamp': self.hod_approved_at,
                'comment': self.hod_comment
            },
            {
                'step': 'Dean',
                'status': 'approved' if self.dean_approved_by else ('pending' if self.status in ['dean_review'] else 'waiting'),
                'approver': self.dean_approved_by.name if self.dean_approved_by else None,
                'timestamp': self.dean_approved_at,
                'comment': self.dean_comment
            }
        ]
        return chain


class InternshipRequest(models.Model):
    STATUS_CHOICES = BonafideRequest.STATUS_CHOICES
    AI_MODEL_CHOICES = BonafideRequest.AI_MODEL_CHOICES
    
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='internship_requests')
    student_name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=50)
    contact = models.CharField(max_length=15)
    company_name = models.CharField(max_length=200)
    internship_type = models.CharField(max_length=50)  # Summer/Winter
    start_date = models.DateField()
    end_date = models.DateField()
    parents_contact = models.CharField(max_length=15)
    
    # Document uploads
    permission_file = models.FileField(upload_to='internship_permissions/')
    offer_letter = models.FileField(upload_to='internship_offers/')
    parent_consent = models.FileField(upload_to='internship_consents/')
    
    # AI Analysis
    ai_model_used = models.CharField(max_length=20, choices=AI_MODEL_CHOICES, default='gemini')
    extracted = models.JSONField(default=dict, blank=True)
    checklist = models.JSONField(default=dict, blank=True)
    is_valid = models.BooleanField(default=False)
    explanation = models.TextField(blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    offer_suspicious_indicators = models.JSONField(default=list, blank=True)
    
    # Approval Flow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    current_approver = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='pending_internship_approvals')
    
    tutor_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='internship_tutor_approvals')
    tutor_approved_at = models.DateTimeField(null=True, blank=True)
    tutor_comment = models.TextField(blank=True)
    
    hod_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='internship_hod_approvals')
    hod_approved_at = models.DateTimeField(null=True, blank=True)
    hod_comment = models.TextField(blank=True)
    
    dean_approved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='internship_dean_approvals')
    dean_approved_at = models.DateTimeField(null=True, blank=True)
    dean_comment = models.TextField(blank=True)
    
    final_rejection_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Internship for {self.student_name} at {self.company_name}"
    
    def get_approval_chain(self):
        chain = [
            {
                'step': 'Tutor',
                'status': 'approved' if self.tutor_approved_by else ('pending' if self.status in ['submitted', 'tutor_review'] else 'waiting'),
                'approver': self.tutor_approved_by.name if self.tutor_approved_by else None,
                'timestamp': self.tutor_approved_at,
                'comment': self.tutor_comment
            },
            {
                'step': 'HOD',
                'status': 'approved' if self.hod_approved_by else ('pending' if self.status in ['hod_review'] else 'waiting'),
                'approver': self.hod_approved_by.name if self.hod_approved_by else None,
                'timestamp': self.hod_approved_at,
                'comment': self.hod_comment
            },
            {
                'step': 'Dean',
                'status': 'approved' if self.dean_approved_by else ('pending' if self.status in ['dean_review'] else 'waiting'),
                'approver': self.dean_approved_by.name if self.dean_approved_by else None,
                'timestamp': self.dean_approved_at,
                'comment': self.dean_comment
            }
        ]
        return chain
