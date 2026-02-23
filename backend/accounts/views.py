from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
import logging, os, tempfile, json as _json

from .models import BonafideRequest, StaffProfile, StudentProfile
from .serializers import BonafideRequestSerializer, StudentSignupSerializer, StaffSignupSerializer, MinimalUserSerializer

def attach_role_to_token(user):
    """Helper to manually add role to token serializer"""
    return {'role': user.role, 'name': user.name}
from .bonafide_agent import get_pdf_text, run_bonafide_graph_from_text

User = get_user_model()
logger = logging.getLogger(__name__)


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Add custom claims to include role and name in token
    refresh['role'] = user.role
    refresh['name'] = user.name
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class StudentSignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = StudentSignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        tokens = tokens_for_user(user)
        return Response({**tokens, 'user': MinimalUserSerializer(user).data}, status=201)


class StaffSignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = StaffSignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        tokens = tokens_for_user(user)
        return Response({**tokens, 'user': MinimalUserSerializer(user).data}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username, password = request.data.get('username'), request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None:
            try:
                u = User.objects.get(email=username)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                pass
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=401)
        tokens = tokens_for_user(user)
        user_data = MinimalUserSerializer(user).data
        return Response({**tokens, 'user': user_data})


class BonafideCheckView(APIView):
    """AI validity check — authenticated only (prevents quota abuse)."""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        upload = request.FILES.get('file') or request.FILES.get('permission')
        purpose = request.data.get('purpose', 'bonafide')
        if not upload:
            return Response({"detail": "No file uploaded."}, status=400)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        try:
            for chunk in upload.chunks(): tmp.write(chunk)
            tmp.flush(); tmp.close()
            text = get_pdf_text(tmp.name)
            result = run_bonafide_graph_from_text(text, purpose=purpose)
            return Response(result)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=500)
        finally:
            try: os.unlink(tmp.name)
            except: pass


class BonafideSubmitView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        user = request.user
        sp = getattr(user, "student_profile", None) or StudentProfile.objects.create(user=user)
        purpose = request.data.get('purpose', 'bonafide')
        permission_file = request.FILES.get('file') or request.FILES.get('permission')
        if not permission_file:
            return Response({"detail": "Permission file required."}, status=400)

        bon = BonafideRequest.objects.create(
            student=user,
            student_name=request.data.get('student_name') or user.name or user.username,
            roll_number=request.data.get('roll_number', ''),
            contact=request.data.get('contact', ''),
            reason=request.data.get('reason', ''),
            purpose=purpose,
            permission_file=permission_file,
            current_stage='tutor',
        )

        # Use pre-checked result if provided (avoids duplicate AI call)
        try:
            pre_ext = request.data.get('pre_extracted')
            pre_chk = request.data.get('pre_checklist')
            pre_val = request.data.get('pre_is_valid')
            if pre_ext and pre_chk and pre_val is not None:
                bon.extracted   = _json.loads(pre_ext) if isinstance(pre_ext, str) else pre_ext
                bon.checklist   = _json.loads(pre_chk) if isinstance(pre_chk, str) else pre_chk
                bon.is_valid    = str(pre_val).lower() in ('true','1','yes')
                bon.explanation = (bon.extracted or {}).get('explanation','')
                bon.status      = 'pending'
                bon.save()
            else:
                raise ValueError("no pre-check")
        except Exception:
            try:
                text   = get_pdf_text(bon.permission_file.path)
                result = run_bonafide_graph_from_text(text, purpose=purpose)
                bon.extracted   = result.get('extracted') or {}
                bon.checklist   = result.get('checklist') or {}
                bon.is_valid    = bool(result.get('is_valid', False))
                bon.explanation = (bon.extracted or {}).get('explanation','')
                bon.status      = 'pending'
                bon.save()
            except Exception as exc:
                logger.exception("LLM run failed id=%s: %s", bon.id, exc)

        serializer = BonafideRequestSerializer(bon, context={'request': request})
        if not getattr(sp, "student_class", None):
            return Response({"warning": "No class assigned.", "result": serializer.data}, status=201)
        return Response(serializer.data, status=201)


class BonafideDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try: bon = BonafideRequest.objects.get(pk=pk)
        except BonafideRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        user = request.user
        if bon.student == user:
            return Response(BonafideRequestSerializer(bon, context={'request': request}).data)
        sp = getattr(user, "staff_profile", None)
        if sp and sp.student_class:
            student_cls = getattr(getattr(bon.student, "student_profile", None), "student_class", None)
            if student_cls and student_cls == sp.student_class:
                return Response(BonafideRequestSerializer(bon, context={'request': request}).data)
        return Response({"detail": "Not authorized."}, status=403)


class BonafideUpdateStatusView(APIView):
    """
    Staff approves/rejects at their stage.
    PATCH /api/auth/bonafide/<pk>/status/
    Body: { "action": "approved"|"rejected", "comment": "..." }
    Automatically advances to next stage on approval.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        if not hasattr(user, 'staff_profile'):
            return Response({"detail": "Staff only."}, status=403)

        try: bon = BonafideRequest.objects.get(pk=pk)
        except BonafideRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        action  = request.data.get('action')   # 'approved' or 'rejected'
        comment = request.data.get('comment', '')
        if action not in ('approved', 'rejected'):
            return Response({"detail": "action must be 'approved' or 'rejected'."}, status=400)

        sp          = user.staff_profile
        designation = sp.designation  # TUTOR, HOD, DEAN
        staff_name  = user.name or user.username
        now         = timezone.now()

        if designation == 'TUTOR' and bon.current_stage == 'tutor':
            bon.tutor_status  = action
            bon.tutor_comment = comment
            bon.tutor_name    = staff_name
            bon.tutor_at      = now
            if action == 'approved':
                bon.current_stage = 'hod'
            else:
                bon.current_stage = 'done'
                bon.status        = 'rejected'

        elif designation == 'HOD' and bon.current_stage == 'hod':
            bon.hod_status  = action
            bon.hod_comment = comment
            bon.hod_name    = staff_name
            bon.hod_at      = now
            if action == 'approved':
                bon.current_stage = 'dean'
            else:
                bon.current_stage = 'done'
                bon.status        = 'rejected'

        elif designation == 'DEAN' and bon.current_stage == 'dean':
            bon.dean_status  = action
            bon.dean_comment = comment
            bon.dean_name    = staff_name
            bon.dean_at      = now
            bon.current_stage = 'done'
            bon.status        = 'approved' if action == 'approved' else 'rejected'
        else:
            return Response({"detail": f"You ({designation}) cannot act on stage '{bon.current_stage}'."}, status=403)

        bon.save()
        return Response(BonafideRequestSerializer(bon, context={'request': request}).data)


class IncomingBonafideListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try: sp = user.staff_profile
        except: return Response({"detail": "Staff profile required."}, status=403)

        designation = sp.designation
        if designation == 'TUTOR':
            if not sp.student_class:
                return Response({"detail": "No class assigned."}, status=400)
            qs = BonafideRequest.objects.filter(
                student__student_profile__student_class=sp.student_class,
                current_stage='tutor'
            )
        elif designation == 'HOD':
            if not sp.hod_department:
                return Response({"detail": "No department assigned."}, status=400)
            qs = BonafideRequest.objects.filter(
                student__student_profile__student_class__department=sp.hod_department,
                current_stage='hod'
            )
        elif designation in ('DEAN', 'PRINCIPAL'):
            qs = BonafideRequest.objects.filter(current_stage='dean')
        else:
            qs = BonafideRequest.objects.none()

        return Response(BonafideRequestSerializer(qs, many=True, context={'request': request}).data)


class StudentBonafideListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = BonafideRequest.objects.filter(student=request.user)
        status_filter = request.query_params.get('status')
        if status_filter in ('pending','approved','rejected'):
            qs = qs.filter(status=status_filter)
        return Response(BonafideRequestSerializer(qs, many=True, context={'request': request}).data)
