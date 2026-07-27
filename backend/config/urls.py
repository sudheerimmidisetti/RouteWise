from django.contrib import admin
from django.urls import path, include
from planner.views import HealthCheckView

urlpatterns = [
    path('', HealthCheckView.as_view(), name='root-health'),
    path('health', HealthCheckView.as_view(), name='health-noslash'),
    path('health/', HealthCheckView.as_view(), name='health-slash'),
    path('admin/', admin.site.urls),
    path('api/', include('planner.urls')),
]
