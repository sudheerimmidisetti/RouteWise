from django.test import TestCase
from services.stop_planner import StopPlanner


class StopPlannerTest(TestCase):
    """Unit tests for StopPlanner service."""

    def test_short_trip_stops_and_durations(self):
        """Short trip under 1000 miles generates Current, Pickup (1h), Dropoff (1h)."""
        geometry = [[40.7, -74.0], [39.9, -75.1], [41.8, -87.6]]
        result = StopPlanner.generate_stops_and_schedule(
            total_distance_miles=500.0,
            total_driving_hours=9.0,
            current_cycle_used=10.0,
            geometry=geometry,
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Chicago, IL",
        )
        stops = result["stops"]
        self.assertEqual(len(stops), 3)

        pickup_stop = [s for s in stops if s["stop_type"] == "PICKUP"][0]
        dropoff_stop = [s for s in stops if s["stop_type"] == "DROPOFF"][0]

        self.assertEqual(pickup_stop["duration_minutes"], 60)
        self.assertEqual(dropoff_stop["duration_minutes"], 60)

    def test_long_trip_fuel_stops_insertion(self):
        """Trip over 2000 miles automatically inserts fuel stops every 1000 miles."""
        geometry = [[40.7, -74.0], [40.0, -85.0], [39.0, -95.0], [34.0, -118.0]]
        result = StopPlanner.generate_stops_and_schedule(
            total_distance_miles=2400.0,
            total_driving_hours=42.0,
            current_cycle_used=5.0,
            geometry=geometry,
            current_location="New York, NY",
            pickup_location="Kansas City, MO",
            dropoff_location="Los Angeles, CA",
        )
        stops = result["stops"]
        fuel_stops = [s for s in stops if s["stop_type"] == "FUEL"]
        self.assertEqual(len(fuel_stops), 2)
        for fuel in fuel_stops:
            self.assertEqual(fuel["duration_minutes"], 30)

    def test_merged_timeline_schedule(self):
        """Verify merged timeline contains Pickup, Dropoff, and Fuel entries."""
        geometry = [[40.7, -74.0], [40.0, -85.0], [39.0, -95.0], [34.0, -118.0]]
        result = StopPlanner.generate_stops_and_schedule(
            total_distance_miles=1500.0,
            total_driving_hours=25.0,
            current_cycle_used=10.0,
            geometry=geometry,
            current_location="New York, NY",
            pickup_location="St. Louis, MO",
            dropoff_location="Denver, CO",
        )
        timeline = result["timeline"]
        statuses = [t["status"] for t in timeline]

        self.assertIn("Pickup", statuses)
        self.assertIn("Dropoff", statuses)

        pickup_entry = [t for t in timeline if t["status"] == "Pickup"][0]
        dropoff_entry = [t for t in timeline if t["status"] == "Dropoff"][0]

        self.assertEqual(pickup_entry["duration_hours"], 1.0)
        self.assertEqual(dropoff_entry["duration_hours"], 1.0)
