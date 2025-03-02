from rest_framework import serializers
from .models import Subscription
from bot_management.models import BotManage
from user_management.models import User

class SubscriptionSerializer(serializers.ModelSerializer):
    bot_name = serializers.CharField(source='bot.name', read_only=True)
    user_address = serializers.CharField(max_length=42)  # 用户钱包地址

    class Meta:
        model = Subscription
        fields = ['tx_hash', 'user_address', 'bot_name', 'start_time', 'is_active', 'end_time', 'payment_status']

    def validate(self, data):
        """验证支付和订阅时长"""
        user_address = data.get('user_address')
        bot = data.get('bot')

        # 检查用户是否存在
        try:
            user = User.objects.get(wallet_address=user_address)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")

        # 检查机器人是否存在
        if not BotManage.objects.filter(id=bot.id).exists():
            raise serializers.ValidationError("Bot not found.")
        
        return data
