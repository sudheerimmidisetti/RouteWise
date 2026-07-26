from planner.models import Trip, Stop, DailyLog
from planner.serializers import TripSerializer
from .ors_service import OpenRouteService
from .stop_planner import StopPlanner
from .daily_log_generator import DailyLogGenerator


class TripPlanningService:
    """Service layer handling trip planning, stop scheduling, HOS calculations & daily log generation."""

    @staticmethod
    def plan_trip(validated_data: dict) -> dict:
        """
        Processes validated trip inputs, fetches OpenRouteService routing geometry,
        generates ordered stop schedule (1000m fuel stops, 1h pickup, 1h dropoff),
        calculates FMCSA HOS trip timeline, generates FMCSA Driver Daily Logs,
        persists Trip, Stop, and DailyLog instances, and returns serialized response payload.
        """
        current_location = validated_data['current_location']
        pickup_location = validated_data['pickup_location']
        dropoff_location = validated_data['dropoff_location']
        current_cycle_used = validated_data['current_cycle_used']

        # Call OpenRouteService integration
        ors = OpenRouteService()
        route_info = ors.get_route(
            current_loc=current_location,
            pickup_loc=pickup_location,
            dropoff_loc=dropoff_location,
        )

        distance_miles = route_info.get("distance_miles", 0.0)
        duration_hours = route_info.get("duration_hours", 0.0)
        geometry = route_info.get("geometry", [])
        waypoints = route_info.get("waypoints", [])

        # Generate stops and merged schedule using StopPlanner
        planner_result = StopPlanner.generate_stops_and_schedule(
            total_distance_miles=distance_miles,
            total_driving_hours=duration_hours,
            current_cycle_used=current_cycle_used,
            geometry=geometry,
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            waypoints=waypoints,
        )

        generated_stops = planner_result["stops"]
        timeline = planner_result["timeline"]

        # Generate FMCSA Driver Daily Logs
        daily_logs_data = DailyLogGenerator.generate_daily_logs(
            timeline=timeline,
            initial_cycle_used=current_cycle_used,
        )

        # Persist main Trip instance
        trip = Trip.objects.create(
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            current_cycle_used=current_cycle_used,
            total_distance=distance_miles,
            total_duration=duration_hours,
        )

        # Persist all generated Stop records
        for stop_data in generated_stops:
            Stop.objects.create(
                trip=trip,
                location_name=stop_data['location_name'],
                stop_type=stop_data['stop_type'],
                latitude=stop_data['latitude'],
                longitude=stop_data['longitude'],
                duration_minutes=stop_data['duration_minutes'],
                sequence_order=stop_data['sequence_order'],
            )

        # Persist DailyLog records
        for log_data in daily_logs_data:
            DailyLog.objects.create(
                trip=trip,
                day_number=log_data['day_number'],
                date=log_data['date'],
                driving_hours=log_data['driving_hours'],
                on_duty_hours=log_data['on_duty_hours'],
                off_duty_hours=log_data['off_duty_hours'],
                sleeper_hours=log_data['sleeper_hours'],
                remaining_cycle_hours=log_data['remaining_cycle_hours'],
            )

        # Serialize trip and attach geometry, timeline, and daily logs
        serializer = TripSerializer(trip)
        response_data = serializer.data
        response_data['geometry'] = geometry
        response_data['timeline'] = timeline
        response_data['daily_logs'] = daily_logs_data

        return response_data
