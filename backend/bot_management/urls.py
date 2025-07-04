from django.contrib import admin
from django.urls import path, include
from .views import health_check
 
urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    path('api/', include('user.urls')),
] 