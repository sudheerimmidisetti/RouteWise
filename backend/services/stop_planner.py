import math
from .hos_engine import HOSEngine


class StopPlanner:
    """
    Stop Planner service responsible for scheduling:
    - Fuel stops every 1000 miles (0.5 hour duration)
    - Pickup stop (1.0 hour duration)
    - Dropoff stop (1.0 hour duration)
    - Merging operational stops with HOSEngine timeline into an ordered schedule
    """

    FUEL_INTERVAL_MILES = 1000.0
    FUEL_DURATION_HOURS = 0.5
    PICKUP_DURATION_HOURS = 1.0
    DROPOFF_DURATION_HOURS = 1.0

    @classmethod
    def generate_stops_and_schedule(
        cls,
        total_distance_miles: float,
        total_driving_hours: float,
        current_cycle_used: float,
        geometry: list,
        current_location: str,
        pickup_location: str,
        dropoff_location: str,
        waypoints: list = None,
    ) -> dict:
        """
        Calculates fuel stops, applies pickup/dropoff durations, and merges with HOS timeline.
        Returns dict containing:
        - stops: list of stop objects with sequence_order, location_name, stop_type, lat, lon
        - timeline: merged HOS schedule list
        """
        stops = []
        sequence_counter = 1

        # Determine exact waypoint coordinates from waypoints dict list or geometry
        if waypoints and len(waypoints) >= 3:
            curr_coords = [waypoints[0]['lat'], waypoints[0]['lon']]
            pick_coords = [waypoints[1]['lat'], waypoints[1]['lon']]
            drop_coords = [waypoints[2]['lat'], waypoints[2]['lon']]
        else:
            curr_coords = geometry[0] if geometry else [40.7128, -74.006]
            mid_idx = len(geometry) // 2 if geometry else 0
            pick_coords = geometry[mid_idx] if geometry else [39.9526, -75.1652]
            drop_coords = geometry[-1] if geometry else [41.8781, -87.6298]

        # Stop 1: Current Location (Pin 1)
        stops.append(
            {
                "sequence_order": sequence_counter,
                "location_name": current_location,
                "stop_type": "CURRENT",
                "latitude": curr_coords[0],
                "longitude": curr_coords[1],
                "duration_minutes": 0,
            }
        )
        sequence_counter += 1

        # Stop 2: Pickup Location (Pin 2)
        stops.append(
            {
                "sequence_order": sequence_counter,
                "location_name": pickup_location,
                "stop_type": "PICKUP",
                "latitude": pick_coords[0],
                "longitude": pick_coords[1],
                "duration_minutes": 60,  # 1 hour
            }
        )
        sequence_counter += 1

        # Calculate fuel stops required (every 1000 miles) between Pickup and Dropoff
        num_fuel_stops = int(total_distance_miles // cls.FUEL_INTERVAL_MILES)
        fuel_stops_data = []

        if num_fuel_stops > 0 and len(geometry) > 2:
            geo_len = len(geometry)
            step_size = geo_len // (num_fuel_stops + 1)
            for f in range(1, num_fuel_stops + 1):
                idx = min(f * step_size, geo_len - 1)
                pt = geometry[idx]
                fuel_stop_name = f"Fuel Stop #{f} ({int(f * cls.FUEL_INTERVAL_MILES)} mi)"
                fuel_stops_data.append(
                    {
                        "location_name": fuel_stop_name,
                        "stop_type": "FUEL",
                        "latitude": pt[0],
                        "longitude": pt[1],
                        "duration_minutes": 30,
                    }
                )

        # Insert fuel stops if any
        for fuel in fuel_stops_data:
            fuel["sequence_order"] = sequence_counter
            stops.append(fuel)
            sequence_counter += 1

        # Stop Last: Dropoff Location (Pin 3)
        stops.append(
            {
                "sequence_order": sequence_counter,
                "location_name": dropoff_location,
                "stop_type": "DROPOFF",
                "latitude": drop_coords[0],
                "longitude": drop_coords[1],
                "duration_minutes": 60,  # 1 hour
            }
        )

        # Generate HOS timeline with 1h pickup & 1h dropoff
        timeline = HOSEngine.calculate_trip_timeline(
            total_driving_hours=total_driving_hours,
            current_cycle_used=current_cycle_used,
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            pickup_duration_hours=cls.PICKUP_DURATION_HOURS,
            dropoff_duration_hours=cls.DROPOFF_DURATION_HOURS,
        )

        # Inject fuel stops into timeline if fuel stops exist
        if fuel_stops_data:
            updated_timeline = []
            for item in timeline:
                updated_timeline.append(item)
                if item["status"] == "Pickup" and fuel_stops_data:
                    for f_stop in fuel_stops_data:
                        updated_timeline.append(
                            {
                                "start_time": item["end_time"],
                                "end_time": item["end_time"],  # Quick 30m refuel marker
                                "duration_hours": 0.5,
                                "status": "Break",
                                "location_name": f_stop["location_name"],
                                "remarks": "Scheduled 30-minute Fueling Stop (every 1000 miles)",
                            }
                        )
            timeline = updated_timeline

        return {
            "stops": stops,
            "timeline": timeline,
        }
