from django.contrib import admin

# Register your models here.
# user/admin.py
from .models import User

admin.site.register(User)
