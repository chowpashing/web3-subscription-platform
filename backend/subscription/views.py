from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Subscription
from .serializers import SubscriptionSerializer
from django.utils import timezone
from .payments import process_payment
from bot_management.models import BotManage
from user_management.models import User


class SubscriptionListView(APIView):
    """列出用户的所有订阅"""
    def get(self, request):
        user_wallet = request.query_params.get('user_wallet', None)
        if not user_wallet:
            return Response({'detail': 'Wallet address is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        subscriptions = Subscription.objects.filter(user_address=user_wallet)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)


class SubscriptionDetailView(APIView):
    """查看单个订单详情"""
    def get(self, request, tx_hash):
        try:
            subscription = Subscription.objects.get(tx_hash=tx_hash)
        except Subscription.DoesNotExist:
            return Response({'detail': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)


class SubscriptionCreateView(APIView):
    """用户创建订阅订单的接口（包括支付和链上交易哈希记录）"""
    def post(self, request):
        user_wallet = request.data.get('user_wallet')
        bot_id = request.data.get('bot_id')
        amount = request.data.get('amount')  # 用户支付的金额
        bot = BotManage.objects.get(id=bot_id)

        # 执行支付逻辑（链上支付处理）
        tx_hash = process_payment(user_wallet, bot.developer_wallet, amount)

        # 创建订阅记录
        subscription = Subscription.objects.create(
            tx_hash=tx_hash,
            user_address=user_wallet,
            bot=bot,
            is_active=True,
            end_time=timezone.now() + timezone.timedelta(days=30),  # 30天试用期
            payment_status='paid'
        )

        return Response({'tx_hash': tx_hash, 'subscription_id': subscription.tx_hash}, status=status.HTTP_201_CREATED)


class RefundView(APIView):
    """处理退款请求"""
    def post(self, request, tx_hash):
        try:
            subscription = Subscription.objects.get(tx_hash=tx_hash)
        except Subscription.DoesNotExist:
            return Response({'detail': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # 判断是否符合退款条件（例如试用期内）
        if not subscription.is_in_trial_period():
            return Response({'detail': 'Refund period has expired'}, status=status.HTTP_400_BAD_REQUEST)

        # 执行退款逻辑
        # 假设退款逻辑是通过链上操作退款给用户
        process_payment(bot.developer_wallet, subscription.user_address, subscription.bot.price)

        # 更新订阅状态为已退款
        subscription.payment_status = 'refunded'
        subscription.save()

        return Response({'detail': 'Refund processed successfully'}, status=status.HTTP_200_OK)
