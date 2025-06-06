from django.urls import path
from .views import SubscriptionCreateView, UserSubscriptionStatusView, SetInactiveSubscriptionView

urlpatterns = [
    path('create/', SubscriptionCreateView.as_view(), name='subscription-create'),
    path('status/', UserSubscriptionStatusView.as_view(), name='subscription-status'),
    path('set_inactive/', SetInactiveSubscriptionView.as_view()),
]