from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from services.trip_service import TripPlanningService
from .serializers import TripPlanInputSerializer

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """API view for service health checks."""

    def get(self, request):
        return Response(
            {
                "status": status.HTTP_200_OK,
                "message": "Service is healthy",
                "data": {"service": "RouteWise Planner Service"},
            },
            status=status.HTTP_200_OK,
        )


class TripPlanView(APIView):
    """
    API view for commercial trip planning, OpenRouteService routing,
    FMCSA HOS rule calculation, stop scheduling, and daily log generation.
    """

    def post(self, request):
        serializer = TripPlanInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "Validation failed",
                    "data": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = TripPlanningService.plan_trip(serializer.validated_data)
            return Response(
                {
                    "status": status.HTTP_201_CREATED,
                    "message": "Trip plan generated successfully",
                    "data": result,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error processing trip plan: {e}", exc_info=True)
            return Response(
                {
                    "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": f"Failed to generate trip plan: {str(e)}",
                    "data": None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
