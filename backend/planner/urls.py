from django.urls import path
from .views import HealthCheckView, TripPlanView

urlpatterns = [
    # Support both trailing slash and no-trailing-slash requests
    path('health', HealthCheckView.as_view(), name='health-check-noslash'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('trip/plan', TripPlanView.as_view(), name='trip-plan-noslash'),
    path('trip/plan/', TripPlanView.as_view(), name='trip-plan'),
]
