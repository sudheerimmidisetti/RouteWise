from rest_framework import serializers
from .models import Trip, Stop, DailyLog


class StopSerializer(serializers.ModelSerializer):
    """Serializer for Stop model."""

    class Meta:
        model = Stop
        fields = [
            'id',
            'location_name',
            'stop_type',
            'latitude',
            'longitude',
            'duration_minutes',
            'sequence_order',
        ]


class DailyLogSerializer(serializers.ModelSerializer):
    """Serializer for DailyLog model."""

    class Meta:
        model = DailyLog
        fields = [
            'id',
            'day_number',
            'date',
            'driving_hours',
            'on_duty_hours',
            'off_duty_hours',
            'sleeper_hours',
            'remaining_cycle_hours',
        ]


class TripPlanInputSerializer(serializers.Serializer):
    """Serializer for validating trip planning request payload."""

    current_location = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        error_messages={'blank': 'Current location cannot be empty.'},
    )
    pickup_location = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        error_messages={'blank': 'Pickup location cannot be empty.'},
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        error_messages={'blank': 'Dropoff location cannot be empty.'},
    )
    current_cycle_used = serializers.FloatField(
        required=True,
        min_value=0.0,
        max_value=70.0,
        error_messages={
            'min_value': 'Current cycle used cannot be negative.',
            'max_value': 'Current cycle used cannot exceed 70 hours.',
        },
    )

    def validate_current_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Current location cannot be empty or whitespace.")
        return value.strip()

    def validate_pickup_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Pickup location cannot be empty or whitespace.")
        return value.strip()

    def validate_dropoff_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Dropoff location cannot be empty or whitespace.")
        return value.strip()


class TripSerializer(serializers.ModelSerializer):
    """Full Trip serializer with nested stops and daily logs."""

    stops = StopSerializer(many=True, read_only=True)
    daily_logs = DailyLogSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used',
            'total_distance',
            'total_duration',
            'stops',
            'daily_logs',
            'created_at',
            'updated_at',
        ]
