from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BotViewSet
import logging

logger = logging.getLogger(__name__)

router = DefaultRouter()
router.register(r'bots', BotViewSet, basename='bot')

# 打印所有注册的 URL
for url in router.urls:
    logger.info(f"Registered URL: {url.pattern}")

urlpatterns = [
    path('', include(router.urls)),
]