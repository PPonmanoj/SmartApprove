from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('staff', 'Staff'),
    )
    email = models.EmailField('email address', unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    name = models.CharField(max_length=255, blank=True)            # single name field from frontend
    mobile_number = models.CharField(max_length=20, blank=True)     # stores mobile from forms

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.role})"

class Department(models.Model):
    code = models.CharField(max_length=50, unique=True)  # e.g. BE_CSE
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.code

class StudentClass(models.Model):
    code = models.CharField(max_length=50, unique=True)  # e.g. BE_CSE_G1
    name = models.CharField(max_length=120)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='classes')

    def __str__(self):
        return self.code

class StaffProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='staff_profile')
    designation = models.CharField(max_length=64)  # TUTOR, HOD, DEAN, etc.
    student_class = models.ForeignKey(StudentClass, null=True, blank=True, on_delete=models.SET_NULL, related_name='staffs')
    hod_department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='hods')
    dean_type = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.designation}"

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    student_class = models.ForeignKey(StudentClass, null=True, blank=True, on_delete=models.SET_NULL, related_name='students')

    def __str__(self):
        return f"{self.user.username} - {self.student_class}"

class BonafideRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bonafide_requests')
    student_name = models.CharField(max_length=255, blank=True)
    roll_number = models.CharField(max_length=128, blank=True)
    contact = models.CharField(max_length=64, blank=True)
    reason = models.TextField(blank=True)
    permission_file = models.FileField(upload_to='bonafide_permissions/', null=True, blank=True)

    # New fields to persist LLM output / audit
    extracted = models.JSONField(null=True, blank=True)
    checklist = models.JSONField(null=True, blank=True)
    is_valid = models.BooleanField(default=False)
    explanation = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bonafide({self.student.username}) - {self.status}"

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="actor_notifications")
    verb = models.CharField(max_length=128)  # e.g. "submitted", "approved", "rejected", "new_request"
    message = models.TextField(blank=True)
    target_bonafide = models.ForeignKey("BonafideRequest", null=True, blank=True, on_delete=models.SET_NULL, related_name="notifications")
    unread = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification to {self.recipient} - {self.verb}"
