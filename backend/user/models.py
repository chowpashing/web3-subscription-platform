from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('consumer', 'Consumer'),
        ('developer', 'Developer'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    wallets = models.TextField(default='')  # 存储多个钱包地址
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    verification_code = models.CharField(max_length=6, null=True, blank=True)  # 验证码
    verification_code_expires = models.DateTimeField(null=True, blank=True)  # 验证码过期时间

    def __str__(self):
        return f"{self.user.username}'s profile"