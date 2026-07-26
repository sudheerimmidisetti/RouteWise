from datetime import datetime, timedelta, timezone


class HOSEngine:
    """
    Hours of Service (HOS) Engine implementing FMCSA Interstate Trucking Rules:
    - 11-Hour Driving Limit per shift
    - 14-Hour Duty Window Limit per shift
    - 30-Minute Rest Break after 8 cumulative driving hours without break
    - 10-Hour Consecutive Rest Break to reset shift timers
    - 70-Hour / 8-Day Cycle Limit (triggers 34-hour restart if cycle exhausted)
    """

    MAX_DRIVING_PER_SHIFT = 11.0
    MAX_DUTY_PER_SHIFT = 14.0
    MAX_DRIVING_BEFORE_BREAK = 8.0
    BREAK_DURATION_HOURS = 0.5
    REST_DURATION_HOURS = 10.0
    CYCLE_RESTART_DURATION_HOURS = 34.0
    MAX_CYCLE_HOURS = 70.0

    @classmethod
    def calculate_trip_timeline(
        cls,
        total_driving_hours: float,
        current_cycle_used: float = 0.0,
        start_time: datetime = None,
        current_location: str = "Current Location",
        pickup_location: str = "Pickup Location",
        dropoff_location: str = "Dropoff Location",
        pickup_duration_hours: float = 1.0,
        dropoff_duration_hours: float = 1.0,
    ) -> list:
        """
        Calculates a chronological timeline of events for a trip.
        Returns a list of dicts with keys:
        - start_time: ISO 8601 string
        - end_time: ISO 8601 string
        - duration_hours: float
        - status: 'Driving' | 'Break' | 'Rest' | 'Pickup' | 'Dropoff'
        - location_name: str
        - remarks: str
        """
        if start_time is None:
            start_time = datetime.now(timezone.utc).replace(microsecond=0)

        timeline = []
        current_time = start_time

        # Trackers
        shift_driving = 0.0
        shift_duty = 0.0
        driving_since_break = 0.0
        cycle_used = float(current_cycle_used)

        def add_event(status: str, duration: float, location: str, remarks: str):
            nonlocal current_time
            end_time = current_time + timedelta(hours=duration)
            entry = {
                "start_time": current_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_hours": round(duration, 2),
                "status": status,
                "location_name": location,
                "remarks": remarks,
            }
            timeline.append(entry)
            current_time = end_time
            return entry

        def reset_shift():
            nonlocal shift_driving, shift_duty, driving_since_break
            shift_driving = 0.0
            shift_duty = 0.0
            driving_since_break = 0.0

        # Step 1: Start at Current Location -> Drive to Pickup
        # Distribute driving hours into Pickup leg vs Dropoff leg
        pickup_leg_driving = min(total_driving_hours * 0.25, 3.0)
        dropoff_leg_driving = total_driving_hours - pickup_leg_driving

        remaining_driving_queue = [
            ("Pickup Leg", pickup_leg_driving, current_location, pickup_location),
            ("Dropoff Leg", dropoff_leg_driving, pickup_location, dropoff_location),
        ]

        # Insert initial Pickup on-duty activity at Pickup arrival
        has_done_pickup = False

        for leg_name, leg_driving_needed, origin_loc, dest_loc in remaining_driving_queue:
            remaining_leg_driving = leg_driving_needed

            while remaining_leg_driving > 0.001:
                # Check cycle hours limit (70h/8-day)
                if cycle_used >= cls.MAX_CYCLE_HOURS:
                    add_event(
                        status="Rest",
                        duration=cls.CYCLE_RESTART_DURATION_HOURS,
                        location=origin_loc,
                        remarks="34-hour Cycle Restart - 70h/8-day cycle limit reached",
                    )
                    cycle_used = 0.0
                    reset_shift()

                # Calculate max driving segment allowed by limits
                max_by_11h_driving = cls.MAX_DRIVING_PER_SHIFT - shift_driving
                max_by_14h_duty = cls.MAX_DUTY_PER_SHIFT - shift_duty
                max_by_8h_break = cls.MAX_DRIVING_BEFORE_BREAK - driving_since_break
                max_by_cycle = cls.MAX_CYCLE_HOURS - cycle_used

                max_allowed_driving = min(
                    remaining_leg_driving,
                    max_by_11h_driving,
                    max_by_14h_duty,
                    max_by_8h_break,
                    max_by_cycle,
                )

                if max_allowed_driving <= 0.001:
                    # Need a rest break or 30-min break
                    if driving_since_break >= cls.MAX_DRIVING_BEFORE_BREAK:
                        add_event(
                            status="Break",
                            duration=cls.BREAK_DURATION_HOURS,
                            location=origin_loc,
                            remarks="Mandatory 30-minute break after 8 hours cumulative driving",
                        )
                        shift_duty += cls.BREAK_DURATION_HOURS
                        cycle_used += cls.BREAK_DURATION_HOURS
                        driving_since_break = 0.0
                    else:
                        add_event(
                            status="Rest",
                            duration=cls.REST_DURATION_HOURS,
                            location=origin_loc,
                            remarks="Mandatory 10-hour rest break (11h driving / 14h duty window reached)",
                        )
                        reset_shift()
                    continue

                # Drive segment
                add_event(
                    status="Driving",
                    duration=max_allowed_driving,
                    location=f"En route to {dest_loc}",
                    remarks=f"Driving segment ({leg_name})",
                )

                shift_driving += max_allowed_driving
                shift_duty += max_allowed_driving
                driving_since_break += max_allowed_driving
                cycle_used += max_allowed_driving
                remaining_leg_driving -= max_allowed_driving

            # Leg completed
            if leg_name == "Pickup Leg" and not has_done_pickup:
                # Add Pickup activity
                add_event(
                    status="Pickup",
                    duration=pickup_duration_hours,
                    location=pickup_location,
                    remarks="Loading / On-Duty at Pickup location",
                )
                shift_duty += pickup_duration_hours
                cycle_used += pickup_duration_hours
                has_done_pickup = True

        # Final Dropoff activity
        add_event(
            status="Dropoff",
            duration=dropoff_duration_hours,
            location=dropoff_location,
            remarks="Unloading / On-Duty at Dropoff location",
        )

        return timeline
