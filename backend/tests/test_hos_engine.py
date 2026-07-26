from datetime import datetime, timezone
from django.test import TestCase
from services.hos_engine import HOSEngine


class HOSEngineTest(TestCase):
    """Unit tests for FMCSA Hours of Service (HOS) Engine."""

    def test_short_trip_timeline(self):
        """Short trip under 8 hours driving needs no 30m break or 10h rest."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=5.0,
            current_cycle_used=10.0,
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Baltimore, MD",
        )
        self.assertTrue(len(timeline) >= 3)
        statuses = [item['status'] for item in timeline]
        self.assertIn('Driving', statuses)
        self.assertIn('Pickup', statuses)
        self.assertIn('Dropoff', statuses)
        self.assertNotIn('Rest', statuses)
        self.assertNotIn('Break', statuses)

    def test_30min_break_enforcement(self):
        """Driving over 8 hours triggers mandatory 30-minute break."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=9.5,
            current_cycle_used=5.0,
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Charlotte, NC",
        )
        statuses = [item['status'] for item in timeline]
        self.assertIn('Break', statuses)

        # Verify break entry details
        break_entries = [item for item in timeline if item['status'] == 'Break']
        self.assertEqual(len(break_entries), 1)
        self.assertEqual(break_entries[0]['duration_hours'], 0.5)

    def test_11h_driving_limit_enforcement(self):
        """Driving over 11 hours triggers 10-hour rest break."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=15.0,
            current_cycle_used=10.0,
            current_location="New York, NY",
            pickup_location="Atlanta, GA",
            dropoff_location="Dallas, TX",
        )
        statuses = [item['status'] for item in timeline]
        self.assertIn('Rest', statuses)

        rest_entries = [item for item in timeline if item['status'] == 'Rest']
        self.assertTrue(len(rest_entries) >= 1)
        self.assertEqual(rest_entries[0]['duration_hours'], 10.0)

    def test_70h_cycle_limit_enforcement(self):
        """Cycle used at 68 hours triggers 34-hour cycle restart."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=6.0,
            current_cycle_used=68.0,
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Pittsburgh, PA",
        )
        restart_entries = [
            item for item in timeline if item['status'] == 'Rest' and item['duration_hours'] == 34.0
        ]
        self.assertTrue(len(restart_entries) >= 1)

    def test_timeline_chronological_continuity(self):
        """Verify timeline timestamps are strictly continuous without gaps."""
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=13.0,
            current_cycle_used=20.0,
        )
        self.assertTrue(len(timeline) > 0)

        for i in range(len(timeline) - 1):
            curr_end = timeline[i]['end_time']
            next_start = timeline[i + 1]['start_time']
            self.assertEqual(
                curr_end,
                next_start,
                f"Discontinuity found at step {i}: end {curr_end} != start {next_start}",
            )
            # Ensure mandatory fields exist
            self.assertIn('status', timeline[i])
            self.assertIn('duration_hours', timeline[i])
            self.assertIn('location_name', timeline[i])
            self.assertIn('remarks', timeline[i])
