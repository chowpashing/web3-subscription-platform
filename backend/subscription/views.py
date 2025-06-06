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
from django.utils.dateformat import DateFormat
from django.utils.timezone import localtime

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
            # 从关联的 bot 中获取 trial_time 并赋值给 subscription 的 trial_period_hours
            sub.trial_period_hours = bot.trial_time
            sub.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSubscriptionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        subscriptions = Subscription.objects.filter(user=user).order_by('-payment_time')
        if not subscriptions.exists():
            return Response({'status': 'no_subscription', 'message': 'No subscription record.'}, status=status.HTTP_200_OK)

        now = timezone.now()
        result = []
        for subscription in subscriptions:
            serializer = SubscriptionSerializer(subscription)
            data = serializer.data

            if subscription.expiration_date < now:
                data['status_description'] = 'expired'
                data['message'] = 'Your subscription has expired.'
                subscription.active = False
                subscription.save()
            elif subscription.active:
                trial_end_time = subscription.payment_time + timedelta(hours=subscription.trial_period_hours)
                if subscription.trial_period_hours > 0 and now < trial_end_time:
                    data['status_description'] = 'trial'
                    data['message'] = f'Before {trial_end_time.isoformat()}, you can'
                    data['cancel_subscription_url'] = '/api/subscription/cancel'
                else:
                    data['status_description'] = 'subscribed'
                    data['message'] = 'You are currently subscribed.'
            else:
                data['status_description'] = 'cancelled_not_expired'
                data['message'] = 'Your subscription has been cancelled.'
            # 直接返回原始 UTC 时间
            data['payment_time'] = subscription.payment_time
            data['expiration_date'] = subscription.expiration_date
            result.append(data)

        return Response(result, status=status.HTTP_200_OK)

class SetInactiveSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        transaction_hash = request.data.get('transaction_hash')
        if not transaction_hash:
            return Response({'error': 'transaction_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            subscription = Subscription.objects.filter(
                user=user, 
                transaction_hash=transaction_hash,
                active=True
            ).first()
            
            if not subscription:
                return Response(
                    {'error': 'Active subscription not found with the given transaction hash'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            subscription.active = False
            subscription.save()
            
            return Response(
                {'success': True, 'message': 'Subscription set to inactive.'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update subscription status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
