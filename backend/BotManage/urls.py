# trading_bot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_trading_bot, name='upload_trading_bot'),
    path('list/', views.get_trading_bots, name='get_trading_bots'),
    path('detail/<uuid:bot_id>/', views.get_trading_bot_detail, name='get_trading_bot_detail'),
]
