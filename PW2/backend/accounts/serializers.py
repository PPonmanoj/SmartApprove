from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, StudentClass, StaffProfile, StudentProfile, BonafideRequest

User = get_user_model()

class MinimalUserSerializer(serializers.ModelSerializer):
    designation = serializers.SerializerMethodField()
    student_class = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'role', 'name', 'mobile_number', 'designation', 'student_class', 'department')

    def get_designation(self, obj):
        if obj.role == 'staff' and hasattr(obj, 'staff_profile'):
            return obj.staff_profile.designation
        return None

    def get_student_class(self, obj):
        profile = getattr(obj, 'student_profile', None) or getattr(obj, 'staff_profile', None)
        if profile and getattr(profile, 'student_class', None):
            return profile.student_class.code
        return None

    def get_department(self, obj):
        if obj.role == 'student' and hasattr(obj, 'student_profile') and obj.student_profile.student_class:
            return obj.student_profile.student_class.department.code
        if obj.role == 'staff' and hasattr(obj, 'staff_profile') and obj.staff_profile.hod_department:
            return obj.staff_profile.hod_department.code
        return None

class StudentSignupSerializer(serializers.Serializer):
    username = serializers.CharField()           # Roll No
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    class_code = serializers.CharField()         # e.g. BE_CSE_G1
    mobile = serializers.CharField(required=False, allow_blank=True)

    def validate_class_code(self, value):
        try:
            StudentClass.objects.get(code=value)
        except StudentClass.DoesNotExist:
            raise serializers.ValidationError("Invalid class_code")
        return value

    def create(self, validated_data):
        class_obj = StudentClass.objects.get(code=validated_data.pop('class_code'))
        mobile = validated_data.pop('mobile', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            mobile_number=mobile,
            role='student'
        )
        StudentProfile.objects.create(user=user, student_class=class_obj)
        return user

class StaffSignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    designation = serializers.CharField()  # TUTOR, HOD, DEAN, etc.
    class_code = serializers.CharField(required=False, allow_blank=True)
    hod_department_code = serializers.CharField(required=False, allow_blank=True)
    dean_type = serializers.CharField(required=False, allow_blank=True)
    mobile = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data.get('class_code'):
            try:
                StudentClass.objects.get(code=data['class_code'])
            except StudentClass.DoesNotExist:
                raise serializers.ValidationError({'class_code': 'Invalid class_code'})
        if data.get('hod_department_code'):
            try:
                Department.objects.get(code=data['hod_department_code'])
            except Department.DoesNotExist:
                raise serializers.ValidationError({'hod_department_code': 'Invalid hod_department_code'})
        return data

    def create(self, validated_data):
        class_code = validated_data.pop('class_code', None)
        hod_code = validated_data.pop('hod_department_code', None)
        dean_type = validated_data.pop('dean_type', '')
        mobile = validated_data.pop('mobile', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            mobile_number=mobile,
            role='staff'
        )
        student_class = None
        hod_dept = None
        if class_code:
            student_class = StudentClass.objects.get(code=class_code)
        if hod_code:
            hod_dept = Department.objects.get(code=hod_code)
        StaffProfile.objects.create(
            user=user,
            designation=validated_data['designation'],
            student_class=student_class,
            hod_department=hod_dept,
            dean_type=dean_type or ''
        )
        return user

class BonafideRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.CharField(read_only=True)
    permission_file_url = serializers.SerializerMethodField()

    class Meta:
        model = BonafideRequest
        fields = [
            'id', 'student_username', 'student_name', 'roll_number', 'contact', 'reason',
            'permission_file_url', 'status', 'created_at',
            # persisted LLM fields
            'extracted', 'checklist', 'is_valid', 'explanation',
        ]
        read_only_fields = ['id', 'student_username', 'permission_file_url', 'created_at',
                            'extracted', 'checklist', 'is_valid', 'explanation']

    def get_permission_file_url(self, obj):
        request = self.context.get('request')
        if obj.permission_file and hasattr(obj.permission_file, 'url'):
            if request:
                return request.build_absolute_uri(obj.permission_file.url)
            return obj.permission_file.url
        return None