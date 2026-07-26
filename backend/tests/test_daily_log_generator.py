from django.test import TestCase
from services.daily_log_generator import DailyLogGenerator
from services.hos_engine import HOSEngine


class DailyLogGeneratorTest(TestCase):
    """Unit tests for FMCSA DailyLogGenerator service."""

    def test_daily_log_totals_equals_24_hours(self):
        """Every generated daily log sheet must total exactly 24.0 hours."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=14.0,
            current_cycle_used=10.0,
            current_location="New York, NY",
            pickup_location="Atlanta, GA",
            dropoff_location="Dallas, TX",
        )
        daily_logs = DailyLogGenerator.generate_daily_logs(timeline, initial_cycle_used=10.0)

        self.assertTrue(len(daily_logs) >= 1)
        for log in daily_logs:
            sum_hours = (
                log["driving_hours"]
                + log["on_duty_hours"]
                + log["off_duty_hours"]
                + log["sleeper_hours"]
            )
            self.assertAlmostEqual(sum_hours, 24.0, places=2)
            self.assertEqual(log["total_hours"], 24.0)

    def test_multi_day_log_generation(self):
        """Long multi-day trips generate sequential Day 1, Day 2 log sheets."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=28.0,
            current_cycle_used=5.0,
            current_location="New York, NY",
            pickup_location="Denver, CO",
            dropoff_location="Los Angeles, CA",
        )
        daily_logs = DailyLogGenerator.generate_daily_logs(timeline, initial_cycle_used=5.0)

        self.assertTrue(len(daily_logs) >= 2)
        day_numbers = [l["day_number"] for l in daily_logs]
        self.assertEqual(day_numbers, list(range(1, len(daily_logs) + 1)))

    def test_duty_statuses_and_remarks_presence(self):
        """Verify 4 duty statuses and remarks are populated correctly."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=8.0,
            current_cycle_used=0.0,
        )
        daily_logs = DailyLogGenerator.generate_daily_logs(timeline, initial_cycle_used=0.0)
        log = daily_logs[0]

        self.assertIn("off_duty", log["status_distribution"])
        self.assertIn("sleeper", log["status_distribution"])
        self.assertIn("driving", log["status_distribution"])
        self.assertIn("on_duty", log["status_distribution"])
        self.assertTrue(len(log["remarks"]) > 0)
