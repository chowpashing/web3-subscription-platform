from rest_framework import serializers
from .models import Subscription

class SubscriptionSerializer(serializers.ModelSerializer):
    trial_period_hours = serializers.IntegerField(read_only=True)
    contract_bot_id = serializers.IntegerField(source='bot.contract_bot_id', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'bot',
            'contract_bot_id',
            'payment_time',
            'payment_amount',
            'currency',
            'transaction_hash',
            'expiration_date',
            'status',
            'active',
            'trial_period_hours'
        ] 