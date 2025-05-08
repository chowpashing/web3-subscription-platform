from django.urls import path
from .views import SubscriptionCreateView, UserSubscriptionStatusView

urlpatterns = [
    path('create/', SubscriptionCreateView.as_view(), name='subscription-create'),
    path('status/', UserSubscriptionStatusView.as_view(), name='subscription-status'),
]