from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator
from django.utils import timezone

class BotManagement(models.Model):
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
    )
    
    IPFS_STATUS_CHOICES = (
        ('pending', '待上传'),
        ('uploading', '上传中'),
        ('uploaded', '已上传'),
        ('failed', '上传失败'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bots')
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    trial_time = models.IntegerField(default=0)
    image1 = models.FileField(upload_to='bot_images/', null=True, blank=True)
    image2 = models.FileField(upload_to='bot_images/', null=True, blank=True)
    image3 = models.FileField(upload_to='bot_images/', null=True, blank=True)
    external_link = models.URLField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    ipfs_status = models.CharField(max_length=20, choices=IPFS_STATUS_CHOICES, default='pending')
    ipfs_hash = models.CharField(max_length=100, null=True, blank=True)
    ipfs_url = models.URLField(null=True, blank=True)
    ipfs_uploaded_at = models.DateTimeField(null=True, blank=True)
    is_ipfs_locked = models.BooleanField(default=False)
    contract_address = models.CharField(max_length=42, null=True, blank=True)
    contract_bot_id = models.IntegerField(null=True, blank=True)
    transaction_hash = models.CharField(max_length=66, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name