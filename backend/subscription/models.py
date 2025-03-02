from django.db import models

class User(models.Model):
    ROLE_CHOICES = [
        ('consumer', 'Consumer'),
        ('developer', 'Developer'),
    ]

    email = models.EmailField(unique=True, null=True, blank=True)
    wallets = models.JSONField(default=dict)  # Stores multiple wallet addresses
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email if self.email else f"User {self.id}"