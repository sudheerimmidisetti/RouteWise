from django.db import models


class Trip(models.Model):
    """Model representing a commercial truck trip plan."""

    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(default=0.0)

    total_distance = models.FloatField(null=True, blank=True, help_text="Total distance in miles")
    total_duration = models.FloatField(null=True, blank=True, help_text="Total duration in hours")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Trip {self.id}: {self.current_location} -> {self.pickup_location} -> {self.dropoff_location}"


class Stop(models.Model):
    """Model representing a stop or waypoint along a trip route."""

    STOP_TYPE_CHOICES = [
        ('CURRENT', 'Current Location'),
        ('PICKUP', 'Pickup Location'),
        ('DROPOFF', 'Dropoff Location'),
        ('REST_BREAK', 'Rest Break'),
        ('SLEEPER', 'Sleeper Berth'),
    ]

    trip = models.ForeignKey(Trip, related_name='stops', on_delete=models.CASCADE)
    location_name = models.CharField(max_length=255)
    stop_type = models.CharField(max_length=30, choices=STOP_TYPE_CHOICES, default='REST_BREAK')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)
    sequence_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sequence_order']

    def __str__(self):
        return f"Stop {self.sequence_order}: {self.location_name} ({self.stop_type})"


class DailyLog(models.Model):
    """Model representing FMCSA Hours of Service (HOS) daily driver log."""

    trip = models.ForeignKey(Trip, related_name='daily_logs', on_delete=models.CASCADE)
    day_number = models.IntegerField()
    date = models.DateField(null=True, blank=True)
    driving_hours = models.FloatField(default=0.0)
    on_duty_hours = models.FloatField(default=0.0)
    off_duty_hours = models.FloatField(default=0.0)
    sleeper_hours = models.FloatField(default=0.0)
    remaining_cycle_hours = models.FloatField(default=70.0)

    class Meta:
        ordering = ['day_number']

    def __str__(self):
        return f"Day {self.day_number} Log for Trip {self.trip_id}"
