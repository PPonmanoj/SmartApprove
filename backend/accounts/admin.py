from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Department, StudentClass, StaffProfile, StudentProfile

admin.site.register(get_user_model())
admin.site.register(Department)
admin.site.register(StudentClass)
admin.site.register(StaffProfile)
admin.site.register(StudentProfile)
