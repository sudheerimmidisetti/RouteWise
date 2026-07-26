from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from planner.models import Trip, Stop
from planner.serializers import TripPlanInputSerializer


class TripModelTest(TestCase):
    """Unit tests for Trip and Stop models."""

    def test_trip_creation(self):
        trip = Trip.objects.create(
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Chicago, IL",
            current_cycle_used=34.0,
        )
        self.assertEqual(str(trip), f"Trip {trip.id}: New York, NY -> Philadelphia, PA -> Chicago, IL")

    def test_stop_creation(self):
        trip = Trip.objects.create(
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Chicago, IL",
        )
        stop = Stop.objects.create(
            trip=trip,
            location_name="Philadelphia, PA",
            stop_type="PICKUP",
            sequence_order=1,
        )
        self.assertEqual(stop.trip, trip)
        self.assertEqual(str(stop), "Stop 1: Philadelphia, PA (PICKUP)")


class TripPlanInputSerializerTest(TestCase):
    """Unit tests for TripPlanInputSerializer validations."""

    def test_valid_serializer_data(self):
        data = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 20.5,
        }
        serializer = TripPlanInputSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_invalid_negative_cycle(self):
        data = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": -5.0,
        }
        serializer = TripPlanInputSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("current_cycle_used", serializer.errors)


class TripPlanAPITest(TestCase):
    """Unit tests for POST /api/trip/plan endpoint with OpenRouteService integration."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('trip-plan')

    def test_post_trip_plan_with_ors_routing(self):
        payload = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 15.0,
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 201)

        data = response.data['data']
        self.assertEqual(data['current_location'], "New York, NY")
        self.assertIn('geometry', data)
        self.assertTrue(len(data['geometry']) > 0)
        self.assertTrue(data['total_distance'] > 0)
        self.assertTrue(data['total_duration'] > 0)
        self.assertEqual(len(data['stops']), 3)

        # Verify lat/lon are set on stops
        stops = data['stops']
        for stop in stops:
            self.assertIsNotNone(stop['latitude'])
            self.assertIsNotNone(stop['longitude'])
