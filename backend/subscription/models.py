from django.db import models
from user.models import User
from botmanage.models import BotManagement

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('trial', 'Trial'),
        ('subscribed', 'Subscribed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    bot = models.ForeignKey(BotManagement, on_delete=models.CASCADE)
    payment_time = models.DateTimeField(auto_now_add=True)
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='ETH-USDT')  # Supports multiple chains
    transaction_hash = models.CharField(max_length=255, unique=True)  # Blockchain transaction hash
    expiration_date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    active = models.BooleanField(default=False)  # Whether the bot is currently active

    def __str__(self):
        return f"Subscription {self.id} - {self.user.email} - {self.bot.name}"