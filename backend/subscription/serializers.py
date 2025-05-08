from rest_framework import serializers
from .models import Subscription

class SubscriptionSerializer(serializers.ModelSerializer):
    trial_period_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'bot',
            'payment_time',
            'payment_amount',
            'currency',
            'transaction_hash',
            'expiration_date',
            'status',
            'active',
            'trial_period_days'
        ] 