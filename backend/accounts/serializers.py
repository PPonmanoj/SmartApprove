from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, StaffProfile, BonafideRequest, InternshipRequest, StudentClass, Department
from .validators import validate_mobile_number, validate_email, validate_roll_number

User = get_user_model()


class StudentSignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, validators=[validate_roll_number])
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(validators=[validate_email])
    mobile = serializers.CharField(max_length=15, validators=[validate_mobile_number])
    class_code = serializers.CharField(max_length=50)

    def validate_username(self, value):
        if User.objects.filter(username=value.upper()).exists():
            raise serializers.ValidationError("Roll number already registered.")
        return value.upper()

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email already registered.")
        return value.lower()

    def validate_mobile(self, value):
        cleaned = validate_mobile_number(value)
        if User.objects.filter(mobile_number=cleaned).exists():
            raise serializers.ValidationError("Mobile number already registered.")
        return cleaned

    def validate_class_code(self, value):
        try:
            StudentClass.objects.get(code=value)
        except StudentClass.DoesNotExist:
            raise serializers.ValidationError("Invalid class code.")
        return value

    def create(self, validated_data):
        class_code = validated_data.pop('class_code')
        mobile = validated_data.pop('mobile')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            name=validated_data['name'],
            mobile_number=mobile,
            role='student'
        )
        
        student_class = StudentClass.objects.get(code=class_code)
        StudentProfile.objects.create(user=user, student_class=student_class)
        
        return user


class StaffSignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(validators=[validate_email])
    mobile = serializers.CharField(max_length=15, validators=[validate_mobile_number])
    designation = serializers.ChoiceField(choices=StaffProfile.DESIGNATION_CHOICES)
    class_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    hod_department_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    dean_type = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email already registered.")
        return value.lower()

    def validate_mobile(self, value):
        cleaned = validate_mobile_number(value)
        if User.objects.filter(mobile_number=cleaned).exists():
            raise serializers.ValidationError("Mobile number already registered.")
        return cleaned

    def create(self, validated_data):
        class_code = validated_data.pop('class_code', None)
        hod_dept_code = validated_data.pop('hod_department_code', None)
        dean_type = validated_data.pop('dean_type', None)
        designation = validated_data.pop('designation')
        mobile = validated_data.pop('mobile')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            name=validated_data['name'],
            mobile_number=mobile,
            role='staff'
        )
        
        profile = StaffProfile.objects.create(user=user, designation=designation)
        
        if class_code:
            profile.student_class = StudentClass.objects.get(code=class_code)
        if hod_dept_code:
            profile.hod_department = Department.objects.get(code=hod_dept_code)
        if dean_type:
            profile.dean_type = dean_type
        
        profile.save()
        return user


class MinimalUserSerializer(serializers.ModelSerializer):
    designation = serializers.SerializerMethodField()
    student_class = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'mobile_number', 'role', 'designation', 'student_class', 'department']

    def get_designation(self, obj):
        if hasattr(obj, 'staff_profile'):
            return obj.staff_profile.designation
        return None

    def get_student_class(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.student_class:
            return obj.student_profile.student_class.name
        if hasattr(obj, 'staff_profile') and obj.staff_profile.student_class:
            return obj.staff_profile.student_class.name
        return None

    def get_department(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.student_class:
            return obj.student_profile.student_class.department.name
        if hasattr(obj, 'staff_profile') and obj.staff_profile.hod_department:
            return obj.staff_profile.hod_department.name
        return None


class BonafideRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name_display = serializers.CharField(source='student.name', read_only=True)
    permission_file_url = serializers.SerializerMethodField()
    approval_chain = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BonafideRequest
        fields = '__all__'
    
    def get_permission_file_url(self, obj):
        if obj.permission_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.permission_file.url)
        return None
    
    def get_approval_chain(self, obj):
        return obj.get_approval_chain()


class InternshipRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name_display = serializers.CharField(source='student.name', read_only=True)
    permission_file_url = serializers.SerializerMethodField()
    offer_letter_url = serializers.SerializerMethodField()
    parent_consent_url = serializers.SerializerMethodField()
    approval_chain = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = InternshipRequest
        fields = '__all__'
    
    def get_permission_file_url(self, obj):
        if obj.permission_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.permission_file.url)
        return None
    
    def get_offer_letter_url(self, obj):
        if obj.offer_letter:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.offer_letter.url)
        return None
    
    def get_parent_consent_url(self, obj):
        if obj.parent_consent:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.parent_consent.url)
        return None
    
    def get_approval_chain(self, obj):
        return obj.get_approval_chain()
