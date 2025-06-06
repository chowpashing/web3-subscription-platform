from django.shortcuts import render

# Create your views here.
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login, User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from .serializers import UserSerializer, RegisterSerializer, Web3LoginSerializer, BindEmailSerializer
from web3 import Web3
from eth_account.messages import encode_defunct
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
import traceback
from django.core.mail import send_mail
import random
from datetime import datetime, timedelta
from django.utils import timezone
from siwe import SiweMessage


# 注册视图
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.profile.role
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
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


# Web3 签名验证函数
def verify_signature(wallet_address, message, signature):
    try:
        # 打印调试信息
        print(f"Verifying signature for wallet: {wallet_address}")
        print(f"Message to verify: {message}")
        print(f"Signature received: {signature}")
        
        # 创建可签名消息
        message_hash = encode_defunct(text=message)
        print(f"Created message hash: {message_hash}")
        
        # 使用eth_account库验证签名
        from eth_account import Account
        recovered_address = Account.recover_message(
            message_hash,
            signature=signature
        )
        
        print(f"Recovered address: {recovered_address}")
        print(f"Original wallet address: {wallet_address}")
        print(f"Comparison result: {recovered_address.lower() == wallet_address.lower()}")
        
        return recovered_address.lower() == wallet_address.lower()
            
    except Exception as e:
        print(f"Signature verification error: {str(e)}")
        traceback.print_exc()
        return False

# Web3 钱包登录
class Web3LoginView(APIView):
    def post(self, request):
        try:
            wallet_address = request.data.get("wallet_address")
            signature = request.data.get("signature")
            message = request.data.get("message")

            if not wallet_address or not signature or not message:
                return Response(
                    {"error": "Wallet address, signature and message are required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"Received login request:")
            print(f"Wallet: {wallet_address}")
            print(f"Message: {message}")
            print(f"Signature: {signature}")

            # 验证签名
            if not verify_signature(wallet_address, message, signature):
                return Response(
                    {"error": "Invalid signature or message"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # 查找具有此钱包地址的用户资料
            import json
            wallet_json_pattern = f'"{wallet_address}": true'
            profile = UserProfile.objects.filter(wallets__contains=wallet_json_pattern).first()
            
            if profile:
                user = profile.user
                refresh = RefreshToken.for_user(user)
                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data
                })
            else:
                # 如果没有找到用户，返回需要设置的信息
                return Response({
                    "message": "New user detected. Please bind email and select a role.",
                    "wallet_address": wallet_address,
                    "needs_setup": True
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error in Web3LoginView: {e}")
            traceback.print_exc()
            return Response(
                {"error": "An error occurred during login"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# 绑定邮箱和选择角色（Web3 用户首次登录）
class BindEmailView(APIView):
    def post(self, request):
        wallet_address = request.data.get("wallet_address")
        email = request.data.get("email")
        role = request.data.get("role")  # consumer / developer

        if not email or not role:
            return Response({"error": "Email and role are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 检查邮箱是否已被使用
            if User.objects.filter(email=email).exists():
                return Response({"error": "Email already in use"}, status=status.HTTP_400_BAD_REQUEST)
                
            # 创建新用户和用户资料
            user = User.objects.create(
                username=email,  # 使用邮箱作为用户名
                email=email
            )
            
            # 创建用户资料
            profile = UserProfile.objects.create(
                user=user,
                role=role,
                wallets='{}'  # 初始化为空 JSON 对象
            )
            
            # 修改这部分代码 - 正确处理 wallets 字段
            try:
                # 如果 wallets 为空，初始化为空字典
                import json
                current_wallets = json.loads(profile.wallets) if profile.wallets else {}
                # 添加新的钱包地址
                current_wallets[wallet_address] = True
                # 将字典转换为JSON字符串后存储
                profile.wallets = json.dumps(current_wallets)
                profile.save()

                # 生成JWT令牌
                refresh = RefreshToken.for_user(user)
                update_last_login(None, user)

                # 返回完整的用户信息
                return Response({
                    "user": UserSerializer(user).data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                print(f"Error handling wallets: {e}")
                user.delete()  # 回滚用户创建
                return Response({"error": "Failed to bind wallet"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            print(f"Error in BindEmailView: {e}")
            traceback.print_exc()
            return Response({"error": "An error occurred during email binding"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 获取当前用户信息
class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(UserSerializer(user).data)


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
        serializer = UserSerializer(user)
        serializer.delete(user)
        return Response({"message": "账号删除成功"}, status=status.HTTP_200_OK)

