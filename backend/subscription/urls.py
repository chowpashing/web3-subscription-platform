from django.urls import path
from .views import SubscriptionListView, SubscriptionDetailView, SubscriptionCreateView, RefundView

urlpatterns = [
    path('subscription/', SubscriptionListView.as_view(), name='subscription-list'),
    path('subscription/<str:tx_hash>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
    path('subscription/create/', SubscriptionCreateView.as_view(), name='subscription-create'),
    path('subscription/refund/<str:tx_hash>/', RefundView.as_view(), name='subscription-refund'),
]
