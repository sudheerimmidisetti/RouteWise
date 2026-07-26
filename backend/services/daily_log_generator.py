from datetime import datetime, timedelta, timezone
from django.conf import settings


class DailyLogGenerator:
    """
    DailyLogGenerator converts HOS trip timeline events into FMCSA-compliant
    Driver Daily Logs for single or multi-day trips.

    Features:
    - Automatic midnight event splitting across calendar days (00:00)
    - Independent 24.0-hour day calculation per log sheet
    - Configurable Header Metadata (Carrier, Driver, Vehicle #, Shipping #, Office Address)
    - 4 Duty Statuses (Off Duty, Sleeper Berth, Driving, On Duty)
    - Structured 24-hour step segments for dynamic React SVG graph rendering
    - Synchronized FMCSA Remarks Section (Time, Location, Duty Status, Reason)
    """

    STATUS_MAP = {
        "Driving": "driving",
        "Pickup": "on_duty",
        "Dropoff": "on_duty",
        "Fuel": "on_duty",
        "Break": "off_duty",
        "Rest": "sleeper",
    }

    @classmethod
    def generate_daily_logs(cls, timeline: list, initial_cycle_used: float = 0.0) -> list:
        if not timeline:
            return []

        # Load configurable header settings from Django settings
        defaults = getattr(settings, "FMCSA_LOG_DEFAULTS", {})
        carrier_name = defaults.get("CARRIER_NAME", "Spotter Logistics")
        office_address = defaults.get("MAIN_OFFICE_ADDRESS", "100 Transport Way, Suite 400, Chicago, IL 60601")
        driver_name = defaults.get("DRIVER_NAME", "Demo Driver")
        vehicle_number = defaults.get("VEHICLE_NUMBER", "TRK-001")
        base_shipping_no = defaults.get("SHIPPING_NUMBER", "AUTO-0001")
        co_driver = defaults.get("CO_DRIVER", "N/A")

        # Parse start time from first timeline entry
        first_start_str = timeline[0]["start_time"]
        try:
            trip_start = datetime.fromisoformat(first_start_str.replace("Z", "+00:00"))
        except Exception:
            trip_start = datetime.now(timezone.utc)

        days_buckets = {}

        def add_sub_event(cur_start_dt, cur_end_dt, status, remarks, location):
            mapped_status = cls.STATUS_MAP.get(status, "off_duty")
            day_idx = (cur_start_dt.date() - trip_start.date()).days + 1
            if day_idx < 1:
                day_idx = 1

            if day_idx not in days_buckets:
                day_date = trip_start.date() + timedelta(days=day_idx - 1)
                days_buckets[day_idx] = {
                    "day_number": day_idx,
                    "date": day_date.isoformat(),
                    "driving_hours": 0.0,
                    "on_duty_hours": 0.0,
                    "off_duty_hours": 0.0,
                    "sleeper_hours": 0.0,
                    "miles_today": 0.0,
                    "remarks_detail": [],
                    "raw_segments": [],
                }

            day_data = days_buckets[day_idx]
            sub_duration = round((cur_end_dt - cur_start_dt).total_seconds() / 3600.0, 2)

            if sub_duration <= 0:
                return

            formatted_time = cur_start_dt.strftime("%I:%M %p")

            # Accumulate hours
            if mapped_status == "driving":
                day_data["driving_hours"] += sub_duration
                day_data["miles_today"] += round(sub_duration * 55.0, 1)
            elif mapped_status == "on_duty":
                day_data["on_duty_hours"] += sub_duration
            elif mapped_status == "off_duty":
                day_data["off_duty_hours"] += sub_duration
            elif mapped_status == "sleeper":
                day_data["sleeper_hours"] += sub_duration

            day_data["raw_segments"].append({
                "status": mapped_status,
                "duration": sub_duration,
                "location": location,
                "remarks": remarks,
            })

            day_data["remarks_detail"].append({
                "time": formatted_time,
                "location": location,
                "status": status,
                "reason": remarks,
            })

        # Process each timeline event and split at midnight boundaries
        for item in timeline:
            try:
                start_dt = datetime.fromisoformat(item["start_time"].replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(item["end_time"].replace("Z", "+00:00"))
            except Exception:
                continue

            status = item["status"]
            remarks = item["remarks"]
            location = item["location_name"]

            cur_start = start_dt
            while cur_start < end_dt:
                # Next midnight boundary
                next_midnight = datetime(
                    cur_start.year, cur_start.month, cur_start.day,
                    tzinfo=timezone.utc
                ) + timedelta(days=1)

                cur_end = min(end_dt, next_midnight)
                add_sub_event(cur_start, cur_end, status, remarks, location)
                cur_start = cur_end

        # Finalize daily log outputs ensuring exact 24.0 hours per day
        daily_logs = []
        cycle_remaining = max(0.0, 70.0 - float(initial_cycle_used))

        sorted_days = sorted(days_buckets.keys())
        for day_num in sorted_days:
            day = days_buckets[day_num]
            driving = round(day["driving_hours"], 2)
            on_duty = round(day["on_duty_hours"], 2)
            off_duty = round(day["off_duty_hours"], 2)
            sleeper = round(day["sleeper_hours"], 2)

            sum_hours = driving + on_duty + off_duty + sleeper

            # Fill remaining unallocated day hours into Off Duty to equal exactly 24.0 hours
            if sum_hours < 24.0:
                unallocated = round(24.0 - sum_hours, 2)
                off_duty = round(off_duty + unallocated, 2)
                sum_hours = 24.0

            # Deduct on-duty time from cycle remaining
            on_duty_today = driving + on_duty
            cycle_remaining = max(0.0, round(cycle_remaining - on_duty_today, 2))

            # Build 24-hour SVG graph segment coordinates
            segments = []
            curr_hour = 0.0

            for raw in day["raw_segments"]:
                if curr_hour >= 24.0:
                    break
                dur = min(raw["duration"], 24.0 - curr_hour)
                if dur > 0:
                    segments.append({
                        "status": raw["status"],
                        "start_hour": round(curr_hour, 2),
                        "end_hour": round(curr_hour + dur, 2),
                        "duration_hours": round(dur, 2),
                    })
                    curr_hour += dur

            # If day is less than 24h, fill trailing hours as off_duty
            if curr_hour < 24.0:
                segments.append({
                    "status": "off_duty",
                    "start_hour": round(curr_hour, 2),
                    "end_hour": 24.0,
                    "duration_hours": round(24.0 - curr_hour, 2),
                })

            # Plain text string list fallback
            text_remarks = [
                f"{r['time']} - {r['location']}: {r['reason']}"
                for r in day["remarks_detail"]
            ] or ["Normal driving operations"]

            shipping_no = f"{base_shipping_no}-D{day_num}" if len(sorted_days) > 1 else base_shipping_no

            log_entry = {
                "day_number": day_num,
                "date": day["date"],
                "miles_today": round(day["miles_today"], 1),
                "carrier_name": carrier_name,
                "main_office_address": office_address,
                "driver_name": driver_name,
                "vehicle_number": vehicle_number,
                "shipping_number": shipping_no,
                "co_driver": co_driver,
                "driving_hours": driving,
                "on_duty_hours": on_duty,
                "off_duty_hours": off_duty,
                "sleeper_hours": sleeper,
                "total_hours": 24.0,
                "remaining_cycle_hours": cycle_remaining,
                "remarks": text_remarks,
                "remarks_detail": day["remarks_detail"],
                "segments": segments,
                "status_distribution": {
                    "off_duty": off_duty,
                    "sleeper": sleeper,
                    "driving": driving,
                    "on_duty": on_duty,
                },
            }
            daily_logs.append(log_entry)

        return daily_logs
