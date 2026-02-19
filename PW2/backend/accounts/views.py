from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import logging
import re
import os
import tempfile

# import the agent runner
from .bonafide_agent import get_pdf_text, run_bonafide_graph_from_text

from .models import BonafideRequest, StaffProfile, StudentProfile
from .serializers import BonafideRequestSerializer
from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import AllowAny
from .serializers import StudentSignupSerializer, StaffSignupSerializer, MinimalUserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q

User = get_user_model()

logger = logging.getLogger(__name__)

def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token)
    }

class StudentSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = StudentSignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        tokens = tokens_for_user(user)
        return Response({
            **tokens,
            'user': MinimalUserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class StaffSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = StaffSignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        tokens = tokens_for_user(user)
        return Response({
            **tokens,
            'user': MinimalUserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        # allow login by username or email
        user = authenticate(request, username=username, password=password)
        if user is None:
            try:
                u = User.objects.get(email=username)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                user = None
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        tokens = tokens_for_user(user)
        return Response({
            **tokens,
            'user': MinimalUserSerializer(user).data
        })

class BonafideCheckView(APIView):
    """
    Accepts multipart/form-data with key 'file' (PDF). Uses langgraph + Gemini (exact flow you provided)
    to extract structured fields and audit them. Returns JSON { extracted, checklist, is_valid, iterations }.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        upload = request.FILES.get('file') or request.FILES.get('permission') or None
        if not upload:
            return Response({"detail": "No file uploaded. Attach file under key 'file' or 'permission'."},
                            status=status.HTTP_400_BAD_REQUEST)

        # save to temp file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        try:
            for chunk in upload.chunks():
                tmp.write(chunk)
            tmp.flush()
            tmp.close()
            file_path = tmp.name

            # extract text
            try:
                document_content = get_pdf_text(file_path)
            except Exception as exc:
                return Response({"detail": f"Failed to extract text from PDF: {str(exc)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # run langgraph/Gemini flow (no heuristics)
            try:
                result = run_bonafide_graph_from_text(document_content)
            except Exception as exc:
                return Response({"detail": f"Agent run failed: {str(exc)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(result, status=status.HTTP_200_OK)

        finally:
            # cleanup temp file
            try:
                tmp.close()
            except Exception:
                pass
            try:
                if 'file_path' in locals() and os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception:
                pass

class BonafideSubmitView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        """
        Student submits bonafide. On submit we:
         - store the uploaded file
         - run the LLM (single call) on the saved PDF text
         - persist extracted/checklist/is_valid/explanation into the BonafideRequest record
        """
        user = request.user
        # ensure StudentProfile exists
        sp = getattr(user, "student_profile", None)
        if not sp:
            sp = StudentProfile.objects.create(user=user)

        student_name = request.data.get('student_name') or user.get_full_name() or user.username
        roll_number = request.data.get('roll_number', '')
        contact = request.data.get('contact', '')
        reason = request.data.get('reason', '')
        permission_file = request.FILES.get('file') or request.FILES.get('permission')

        if not permission_file:
            return Response({"detail": "Permission file required."}, status=status.HTTP_400_BAD_REQUEST)

        # create record first so file is saved by storage
        bon = BonafideRequest.objects.create(
            student=user,
            student_name=student_name,
            roll_number=roll_number,
            contact=contact,
            reason=reason,
            permission_file=permission_file
        )

        # attempt to extract text and run the agent (best-effort)
        try:
            file_path = bon.permission_file.path
            raw_text = get_pdf_text(file_path)
            result = run_bonafide_graph_from_text(raw_text)
            # persist results
            bon.extracted = result.get('extracted') or {}
            bon.checklist = result.get('checklist') or {}
            bon.is_valid = bool(result.get('is_valid', False))
            # prefer explanation inside extracted if present
            explanation = None
            if isinstance(bon.extracted, dict):
                explanation = bon.extracted.get('explanation')
            if not explanation:
                explanation = result.get('explanation') or ''
            bon.explanation = explanation or ''
            # set status based on is_valid
            bon.status = 'approved' if bon.is_valid else 'pending'
            bon.save()
        except Exception as exc:
            # keep record but log LLM failure
            logger.exception("LLM run failed for bonafide id=%s: %s", bon.id, str(exc))

        serializer = BonafideRequestSerializer(bon, context={'request': request})
        # if student's class missing, warn (tutor routing won't work until set)
        if not getattr(sp, "student_class", None):
            return Response({
                "warning": "Your student profile has no class assigned. The request was created but tutors will not receive it until your class is set.",
                "result": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BonafideDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            bon = BonafideRequest.objects.get(pk=pk)
        except BonafideRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # student may view own request
        if bon.student == user:
            serializer = BonafideRequestSerializer(bon, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # staff access rules
        staff_profile = getattr(user, "staff_profile", None)
        if not staff_profile:
            return Response({"detail": "Not authorized to view this request."}, status=status.HTTP_403_FORBIDDEN)

        designation = (staff_profile.designation or "").upper()
        student_cls = getattr(getattr(bon.student, "student_profile", None), "student_class", None)
        class_code = getattr(student_cls, "code", None) or str(student_cls or "")

        # Tutors can view requests for their class (that are not forwarded to PC)
        if designation == 'TUTOR':
            if student_cls and student_cls == staff_profile.student_class:
                serializer = BonafideRequestSerializer(bon, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Program Coordinators can view requests that tutors approved (status == 'pc_pending') for their class
        if designation in ('PROGRAM_COORDINATOR', 'PC', 'COORDINATOR'):
            if student_cls and student_cls == staff_profile.student_class and getattr(bon, "status", None) == "pc_pending":
                serializer = BonafideRequestSerializer(bon, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)

        # HoD can view requests forwarded to HoD (status == 'hod_pending') for classes in their department.
        if designation in ('HOD', 'HEAD', 'HEAD_OF_DEPARTMENT'):
            dept = get_staff_department(staff_profile)
            # normalize both dept and class_code to compare robustly (handle "BE CSE" / "BE_CSE" / "BE CSE G1")
            if dept and getattr(bon, "status", None) == "hod_pending":
                def norm(s) -> str:
                    return re.sub(r'\W+', '', str(s or '')).upper()
                if norm(dept) and norm(dept) in norm(class_code):
                    serializer = BonafideRequestSerializer(bon, context={'request': request})
                    return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"detail": "Not authorized to view this request."}, status=status.HTTP_403_FORBIDDEN)

class IncomingBonafideListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        logger.info("IncomingBonafideListView called by user=%s", getattr(user, "username", None))

        staff_profile = getattr(user, "staff_profile", None)
        if not staff_profile:
            logger.warning("User %s has no staff_profile", getattr(user, "username", None))
            return Response({"detail": "Staff profile required."}, status=status.HTTP_403_FORBIDDEN)

        designation = (staff_profile.designation or "").upper()
        tutor_class = staff_profile.student_class
        logger.info("Staff %s designation=%s class=%s", user.username, designation, getattr(tutor_class, "code", None))

        if not tutor_class and designation not in ('HOD', 'HEAD', 'HEAD_OF_DEPARTMENT'):
            return Response({"detail": "Staff has no class/department assigned."}, status=status.HTTP_400_BAD_REQUEST)

        # Tutors: show requests for their class, excluding those already forwarded to PC/HOD
        if designation == 'TUTOR':
            incoming_qs = BonafideRequest.objects.filter(
                student__student_profile__student_class=tutor_class
            ).exclude(status__in=['pc_pending', 'hod_pending'])
            serializer = BonafideRequestSerializer(incoming_qs, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Program Coordinators: show requests forwarded to PC for their class
        if designation in ('PROGRAM_COORDINATOR', 'PC', 'COORDINATOR'):
            incoming_qs = BonafideRequest.objects.filter(
                student__student_profile__student_class=tutor_class,
                status='pc_pending'
            )
            serializer = BonafideRequestSerializer(incoming_qs, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # HoD: show requests forwarded to HoD for classes belonging to their department
        if designation in ('HOD', 'HEAD', 'HEAD_OF_DEPARTMENT'):
            dept = get_staff_department(staff_profile)
            if not dept:
                logger.warning("HoD %s has no department set; returning empty list", getattr(user, "username", None))
                return Response([], status=status.HTTP_200_OK)

            # normalize comparator
            def norm(s) -> str:
                return re.sub(r'\W+', '', str(s or '')).upper()

            qs = BonafideRequest.objects.filter(status='hod_pending')
            matches = []
            dept_norm = norm(dept)
            for b in qs:
                cls = getattr(getattr(b.student, 'student_profile', None), 'student_class', None)
                class_code = getattr(cls, 'code', None) or str(cls or "")
                if dept_norm and dept_norm in norm(class_code):
                    matches.append(b)
            serializer = BonafideRequestSerializer(matches, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        logger.warning("User %s denied incoming list access due to designation=%s", user.username, designation)
        return Response({"detail": "Only tutors, program coordinators and HoDs can view incoming requests."}, status=status.HTTP_403_FORBIDDEN)

class BonafideActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        """
        Actions for Tutor, Program Coordinator, and HoD.

        Status transitions (consistent):
          - Tutor approve  -> "pc_pending"
          - Tutor reject   -> "rejected"
          - PC approve     -> "hod_pending"
          - PC reject      -> "rejected"
          - HoD approve    -> "approved"
          - HoD reject     -> "rejected"

        Expects JSON: {"action":"approve"|"reject", "comment":"..."}
        """
        try:
            bon = BonafideRequest.objects.get(pk=pk)
        except BonafideRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        staff_profile = getattr(user, "staff_profile", None)
        if not staff_profile:
            return Response({"detail": "Staff profile required."}, status=status.HTTP_403_FORBIDDEN)

        designation = (staff_profile.designation or "").upper()
        action = (request.data.get("action") or "").lower()
        comment = request.data.get("comment", "") or ""

        if action not in ("approve", "reject"):
            return Response({"detail": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        # Helper to persist comment into explicit field if exists else into extracted JSON
        def persist_comment(field_name, comment_text):
            try:
                if hasattr(bon, field_name):
                    setattr(bon, field_name, comment_text)
                else:
                    extracted = bon.extracted if isinstance(bon.extracted, dict) else {}
                    extracted_key = f"_{field_name}"
                    extracted[extracted_key] = comment_text
                    bon.extracted = extracted
            except Exception:
                logger.exception("Failed to persist %s for bonafide id=%s", field_name, bon.id)

        # Tutor actions
        if designation == 'TUTOR':
            student_cls = getattr(getattr(bon.student, "student_profile", None), "student_class", None)
            if not student_cls or student_cls != staff_profile.student_class:
                return Response({"detail": "Not authorized for this student/class."}, status=status.HTTP_403_FORBIDDEN)

            if action == "approve":
                bon.status = "pc_pending"
            else:
                bon.status = "rejected"

            persist_comment("tutor_comment", comment)
            bon.save()
            return Response(BonafideRequestSerializer(bon, context={"request": request}).data, status=status.HTTP_200_OK)

        # Program Coordinator actions (must act only on pc_pending)
        if designation in ('PROGRAM_COORDINATOR', 'PC', 'COORDINATOR'):
            student_cls = getattr(getattr(bon.student, "student_profile", None), "student_class", None)
            if not student_cls or student_cls != staff_profile.student_class:
                return Response({"detail": "Not authorized for this student/class."}, status=status.HTTP_403_FORBIDDEN)
            if getattr(bon, "status", None) != "pc_pending":
                return Response({"detail": "Only PC pending requests can be acted on by PC."}, status=status.HTTP_400_BAD_REQUEST)

            if action == "approve":
                bon.status = "hod_pending"
            else:
                bon.status = "rejected"

            persist_comment("pc_comment", comment)
            bon.save()
            return Response(BonafideRequestSerializer(bon, context={"request": request}).data, status=status.HTTP_200_OK)

        # HoD actions (must act only on hod_pending)
        if designation in ('HOD', 'HEAD', 'HEAD_OF_DEPARTMENT'):
            # ensure bon is hod_pending
            if getattr(bon, "status", None) != "hod_pending":
                return Response({"detail": "Only HoD pending requests can be acted on by HoD."}, status=status.HTTP_400_BAD_REQUEST)

            # verify HoD's department matches the student's class
            student_cls = getattr(getattr(bon.student, "student_profile", None), "student_class", None)
            staff_dept = get_staff_department(staff_profile)
            def _norm(s):
                return re.sub(r'\W+', '', str(s or '')).upper()
            class_code = getattr(student_cls, "code", None) or str(student_cls or "")
            if not staff_dept or not (_norm(staff_dept) in _norm(class_code)):
                return Response({"detail": "Not authorized for this department/class."}, status=status.HTTP_403_FORBIDDEN)

            if action == "approve":
                bon.status = "approved"
            else:
                bon.status = "rejected"

            persist_comment("hod_comment", comment)
            bon.save()
            return Response(BonafideRequestSerializer(bon, context={"request": request}).data, status=status.HTTP_200_OK)

        # Other roles not allowed to perform action here
        return Response({"detail": "Only tutors, program coordinators and HoDs can perform this action."}, status=status.HTTP_403_FORBIDDEN)

class BonafideHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        staff_profile = getattr(user, "staff_profile", None)
        if not staff_profile:
            return Response({"detail": "Staff profile required."}, status=status.HTTP_403_FORBIDDEN)

        designation = (staff_profile.designation or "").upper()

        # Tutor: history for their class (exclude purely new/pending requests)
        if designation == "TUTOR":
            tutor_class = staff_profile.student_class
            if not tutor_class:
                return Response([], status=status.HTTP_200_OK)
            qs = BonafideRequest.objects.filter(
                student__student_profile__student_class=tutor_class
            ).exclude(status__in=['pending', '', None]).order_by('-created_at')
            serializer = BonafideRequestSerializer(qs, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Program Coordinator: history for their class (include pc actions)
        if designation in ("PROGRAM_COORDINATOR", "PC", "COORDINATOR"):
            pc_class = staff_profile.student_class
            if not pc_class:
                return Response([], status=status.HTTP_200_OK)
            qs = BonafideRequest.objects.filter(
                student__student_profile__student_class=pc_class
            ).exclude(status__in=['pending', '', None]).order_by('-created_at')
            serializer = BonafideRequestSerializer(qs, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # HoD: history for their department (normalized matching)
        if designation in ("HOD", "HEAD", "HEAD_OF_DEPARTMENT"):
            dept = get_staff_department(staff_profile)
            if not dept:
                return Response([], status=status.HTTP_200_OK)
            def norm(s) -> str:
                return re.sub(r'\W+', '', str(s or '')).upper()
            dept_norm = norm(dept)
            qs = BonafideRequest.objects.exclude(status__in=['pending', '', None]).order_by('-created_at')
            matches = []
            for b in qs:
                cls = getattr(getattr(b.student, 'student_profile', None), 'student_class', None)
                class_code = getattr(cls, 'code', None) or str(cls or "")
                if dept_norm and dept_norm in norm(class_code):
                    matches.append(b)
            serializer = BonafideRequestSerializer(matches, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # other staff: empty list
        return Response([], status=status.HTTP_200_OK)

# add helper to robustly read department from StaffProfile
def get_staff_department(staff_profile):
    if not staff_profile:
        return None

    # 1) direct FK field on StaffProfile (your model uses hod_department)
    dept_obj = getattr(staff_profile, "hod_department", None)
    if dept_obj:
        # Department instance: prefer 'code' then 'name'
        code = getattr(dept_obj, "code", None)
        if code:
            return code
        name = getattr(dept_obj, "name", None)
        if name:
            return name
        return str(dept_obj)

    # 2) check other common attribute names that might hold a string value
    for attr in ('department', 'hod_department', 'department_code', 'dept', 'hodDept', 'hod_dept', 'hod_dept_code'):
        val = getattr(staff_profile, attr, None)
        if val:
            return val

    # 3) fallback to inspecting __dict__ for any dept-like key
    d = getattr(staff_profile, '__dict__', None)
    if isinstance(d, dict):
        for k, v in d.items():
            if v and ('dept' in k.lower() or 'hod' in k.lower()):
                return v

    return None
