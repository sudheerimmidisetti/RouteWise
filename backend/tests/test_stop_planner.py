import math
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

    def test_fuel_stop_markers_lie_on_displayed_polyline(self):
        """
        Validation Test: Ensures every generated fuel stop marker lies directly
        on the displayed route polyline (within a threshold of < 10 meters).
        """
        # Multi-state route geometry polyline: Kakinada -> Bengaluru -> Delhi
        geometry = [
            [16.9891, 82.2475],  # Kakinada
            [13.0827, 80.2707],  # Chennai
            [12.9716, 77.5946],  # Bengaluru
            [17.6599, 75.9064],  # Solapur
            [22.7196, 75.8577],  # Indore
            [27.1767, 78.0081],  # Agra
            [28.6139, 77.2090],  # Delhi
        ]

        fuel_stops = StopPlanner.generate_fuel_stops_from_geometry(geometry, 1000.0)
        self.assertGreater(len(fuel_stops), 0)

        for fuel in fuel_stops:
            flat = fuel["latitude"]
            flon = fuel["longitude"]

            # Calculate minimum distance from fuel marker to any segment of geometry polyline
            min_distance_meters = float("inf")

            for i in range(len(geometry) - 1):
                p1 = geometry[i]
                p2 = geometry[i + 1]

                # Project point onto segment p1-p2
                dlat = p2[0] - p1[0]
                dlon = p2[1] - p1[1]
                length_sq = dlat * dlat + dlon * dlon

                if length_sq > 0:
                    t = max(0.0, min(1.0, ((flat - p1[0]) * dlat + (flon - p1[1]) * dlon) / length_sq))
                else:
                    t = 0.0

                proj_lat = p1[0] + t * dlat
                proj_lon = p1[1] + t * dlon

                dist_miles = StopPlanner.haversine_miles(flat, flon, proj_lat, proj_lon)
                dist_meters = dist_miles * 1609.34
                min_distance_meters = min(min_distance_meters, dist_meters)

            # Assert fuel stop marker is within 10 meters of the polyline
            self.assertLess(min_distance_meters, 10.0, f"Fuel stop marker {fuel['location_name']} is too far ({min_distance_meters:.2f}m) from route polyline!")
