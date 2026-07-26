import math
from .hos_engine import HOSEngine


class StopPlanner:
    """
    Stop Planner service responsible for scheduling:
    - Fuel stops every 1000 miles (0.5 hour duration) placed along actual route geometry
    - Pickup stop (1.0 hour duration)
    - Dropoff stop (1.0 hour duration)
    - Merging operational stops with HOSEngine timeline into an ordered schedule
    """

    FUEL_INTERVAL_MILES = 1000.0
    FUEL_DURATION_HOURS = 0.5
    PICKUP_DURATION_HOURS = 1.0
    DROPOFF_DURATION_HOURS = 1.0

    @classmethod
    def haversine_miles(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between two lat/lon coordinates in miles using Haversine formula."""
        R = 3958.8  # Earth radius in miles
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @classmethod
    def generate_fuel_stops_from_geometry(cls, geometry: list, fuel_interval_miles: float = 1000.0) -> list:
        """
        Walks through the actual route polyline geometry [latitude, longitude] using cumulative distance.
        Places a fuel stop every 1000 miles along the exact road path.
        """
        if not geometry or len(geometry) < 2:
            return []

        cum_distances = [0.0]
        total_dist = 0.0

        for i in range(len(geometry) - 1):
            p1 = geometry[i]
            p2 = geometry[i + 1]
            step_dist = cls.haversine_miles(p1[0], p1[1], p2[0], p2[1])
            total_dist += step_dist
            cum_distances.append(total_dist)

        num_stops = int(total_dist // fuel_interval_miles)
        fuel_stops = []

        for f in range(1, num_stops + 1):
            target_miles = f * fuel_interval_miles

            for i in range(len(cum_distances) - 1):
                if cum_distances[i] <= target_miles <= cum_distances[i + 1]:
                    seg_start_dist = cum_distances[i]
                    seg_end_dist = cum_distances[i + 1]
                    seg_length = seg_end_dist - seg_start_dist

                    p1 = geometry[i]
                    p2 = geometry[i + 1]

                    if seg_length > 0:
                        fraction = (target_miles - seg_start_dist) / seg_length
                        lat = p1[0] + fraction * (p2[0] - p1[0])
                        lon = p1[1] + fraction * (p2[1] - p1[1])
                    else:
                        lat, lon = p1[0], p1[1]

                    fuel_stops.append(
                        {
                            "location_name": f"Fuel Stop #{f} ({int(target_miles)} mi)",
                            "stop_type": "FUEL",
                            "latitude": round(lat, 6),
                            "longitude": round(lon, 6),
                            "duration_minutes": 30,
                        }
                    )
                    break

        return fuel_stops

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
        Calculates fuel stops along actual road geometry, applies pickup/dropoff durations,
        and merges with HOS timeline.
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

        # Calculate fuel stops along the actual route polyline geometry
        fuel_stops_data = cls.generate_fuel_stops_from_geometry(geometry, cls.FUEL_INTERVAL_MILES)

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
