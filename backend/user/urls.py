from django.urls import path
from .views import (
    RegisterView, LoginView, Web3LoginView, BindEmailView,
    UserDetailView, LogoutView, DeleteUserView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('web3-login/', Web3LoginView.as_view(), name='web3-login'),
    path('bind-email/', BindEmailView.as_view(), name='bind-email'),
    path('user-detail/', UserDetailView.as_view(), name='user-detail'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('delete/', DeleteUserView.as_view(), name='delete-user'),

]