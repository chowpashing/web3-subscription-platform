from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile
from django.contrib.auth.hashers import make_password
from django.db import transaction

class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    wallets = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'wallets', 'role']
        read_only_fields = ['id']

    def get_wallets(self, obj):
        if not hasattr(obj, 'profile') or not obj.profile.wallets:
            return None
        try:
            import json
            return json.loads(obj.profile.wallets)
        except json.JSONDecodeError:
            return None

    def get_role(self, obj):
        if not hasattr(obj, 'profile'):
            return None
        return obj.profile.role

    def delete(self, instance):
        """删除用户及其关联数据"""
        with transaction.atomic():
            # 删除用户配置文件
            if hasattr(instance, 'profile'):
                instance.profile.delete()
            # 删除用户
            instance.delete()

class RegisterSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, label='Confirm password')
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=True, write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'role']
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate_email(self, value):
        # 验证邮箱是否已被使用
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("用户邮箱已存在，请使用其他邮箱。")
        return value
    
    def validate(self, attrs):
        # 验证两次密码是否一致
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # 移除确认密码字段
        validated_data.pop('password2', None)
        # 获取角色
        role = validated_data.pop('role', None)
        
        # 创建用户
        user = User.objects.create(
            username=validated_data['email'],  # 使用邮箱作为用户名
            email=validated_data['email'],
            password=make_password(validated_data['password'])
        )
        
        # 创建用户资料
        UserProfile.objects.create(
            user=user,
            role=role
        )
        
        return user

class Web3LoginSerializer(serializers.Serializer):
    """Web3钱包登录序列化器"""
    wallet_address = serializers.CharField(required=True)
    signature = serializers.CharField(required=True)

class BindEmailSerializer(serializers.Serializer):
    """绑定邮箱和角色序列化器"""
    wallet_address = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=True)  # 修改这一行
    
    def validate_email(self, value):
        # 验证邮箱是否已被使用
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

class SendVerificationCodeSerializer(serializers.Serializer):
    """发送验证码序列化器"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # 验证邮箱是否存在
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱未注册")
        return value

    """重置密码序列化器"""
    email = serializers.EmailField(required=True)
    verification_code = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, min_length=6)
    new_password2 = serializers.CharField(required=True, min_length=6)

    def validate(self, attrs):
        # 验证两次密码是否一致
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "两次输入的密码不一致"})
        return attrs