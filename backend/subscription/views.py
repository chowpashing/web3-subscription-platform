from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Subscription
from botmanagement.models import BotManagement
from django.contrib.auth.models import User
from .serializers import SubscriptionSerializer
from django.utils import timezone
from datetime import timedelta

# Create your views here.

class SubscriptionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        # 自动获取 user
        data['user'] = request.user.id
        # 检查 bot 是否存在
        try:
            bot = BotManagement.objects.get(id=data['bot'])
        except BotManagement.DoesNotExist:
            return Response({'error': 'Bot not found'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SubscriptionSerializer(data=data)
        if serializer.is_valid():
            sub = serializer.save()
            # 从关联的 bot 中获取 trial_time 并赋值给 subscription 的 trial_period_days
            sub.trial_period_days = bot.trial_time
            sub.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSubscriptionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        subscriptions = Subscription.objects.filter(user=user).order_by('-payment_time')
        if not subscriptions.exists():
            return Response({'status': 'no_subscription', 'message': '当前用户无订阅记录。'}, status=status.HTTP_200_OK)

        now = timezone.now()
        result = []
        for subscription in subscriptions:
            serializer = SubscriptionSerializer(subscription)
            data = serializer.data

            # 判断订阅状态
            if subscription.expiration_date < now:
                data['status_description'] = 'expired'
                data['message'] = '您的订阅已过期。'
                subscription.active = False
                subscription.save()
            elif subscription.active:
                trial_end_time = subscription.payment_time + timedelta(days=subscription.trial_period_days)
                if subscription.trial_period_days > 0 and now < trial_end_time:
                    data['status_description'] = 'trial'
                    data['message'] = '您当前处于试用期。'
                    data['cancel_subscription_url'] = '/api/subscription/cancel'
                else:
                    data['status_description'] = 'subscribed'
                    data['message'] = '您当前已订阅。'
            else:
                data['status_description'] = 'cancelled_not_expired'
                data['message'] = '您的订阅已取消，将在到期日后失效。'
            result.append(data)

        return Response(result, status=status.HTTP_200_OK)
