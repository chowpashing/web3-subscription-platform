# Create your views here.
# user/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from web3 import Web3

# Web3 签名验证函数
def verify_signature(wallet_address, message, signature):
    try:
        w3 = Web3()
        recovered_address = w3.eth.account.recover_message(
            text=message, signature=signature
        )
        return recovered_address.lower() == wallet_address.lower()
    except:
        return False

# 用户注册（传统方式）
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 用户登录（传统方式）
class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            update_last_login(None, user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Web3 钱包登录
class Web3LoginView(APIView):
    def post(self, request):
        wallet_address = request.data.get("wallet_address")
        signature = request.data.get("signature")
        message = f"Sign this message to log in: {wallet_address}"

        if not verify_signature(wallet_address, message, signature):
            return Response({"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

        user, created = User.objects.get_or_create(wallet_address=wallet_address)
        
        # 如果是首次登录，需要用户选择角色并绑定邮箱
        if created or not user.role:
            return Response({
                "message": "New user detected. Please bind email and select a role.",
                "wallet_address": wallet_address,
                "needs_setup": True
            }, status=status.HTTP_200_OK)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data
        })

# 绑定邮箱和选择角色（Web3 用户首次登录）
class BindEmailView(APIView):
    def post(self, request):
        wallet_address = request.data.get("wallet_address")
        email = request.data.get("email")
        role = request.data.get("role")  # user / developer

        if not email or not role:
            return Response({"error": "Email and role are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(wallet_address=wallet_address)
            user.email = email
            user.role = role
            user.save()
            return Response({"message": "Email and role bound successfully"}, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

# 获取当前用户信息
class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(UserSerializer(user).data)

# 更新用户信息
class UpdateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 用户登出
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

# 删除用户账户
class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"message": "Account deleted successfully"}, status=status.HTTP_200_OK)