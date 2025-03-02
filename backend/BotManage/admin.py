from django.contrib import admin

# Register your models here.
# trading_bot/admin.py
from .models import TradingBot

class TradingBotAdmin(admin.ModelAdmin):
    list_display = ('name', 'developer', 'price_per_day', 'trial_days', 'audit_status')
    list_filter = ('audit_status', 'developer')

admin.site.register(TradingBot, TradingBotAdmin)
