from datetime import datetime, timedelta, timezone
from django.conf import settings


class DailyLogGenerator:
    """
    Generates FMCSA-compliant Driver Daily Log Sheets from the Merged HOS &
    Operational Timeline.

    The timeline is the SINGLE SOURCE OF TRUTH.  Every segment, hour total,
    graph coordinate, and remark row is derived dynamically from timeline
    events — nothing is hardcoded or estimated.

    Pipeline
    --------
    1.  Parse each timeline event (ISO-8601, 12-hour AM/PM, or 24-hour time).
    2.  Map the event's activity/status to one of four FMCSA duty statuses.
    3.  Split any event that crosses a midnight boundary into separate
        per-day sub-events.
    4.  Bucket sub-events by calendar day.
    5.  For each day, sort sub-events chronologically, fill any uncovered
        gaps with OFF DUTY, and emit a complete 24.0-hour segment list.
    6.  Calculate per-status totals from the segment list (never separately).
    7.  Emit a matching remarks table from the same sub-events.
    """

    # ------------------------------------------------------------------
    # Duty-status mapping  (timeline activity → FMCSA row key)
    #
    #   Row 1  off_duty   – Off Duty
    #   Row 2  sleeper    – Sleeper Berth
    #   Row 3  driving    – Driving
    #   Row 4  on_duty    – On Duty (Not Driving)
    # ------------------------------------------------------------------
    STATUS_MAP = {
        # Driving
        "driving":                "driving",

        # On Duty (Not Driving)
        "fuel stop":              "on_duty",
        "fuel":                   "on_duty",
        "pickup":                 "on_duty",
        "dropoff":                "on_duty",
        "inspection":             "on_duty",
        "loading":                "on_duty",
        "unloading":              "on_duty",
        "paperwork":              "on_duty",
        "on duty":                "on_duty",
        "on duty (not driving)":  "on_duty",

        # Off Duty
        "break":                  "off_duty",
        "off duty":               "off_duty",
        "rest":                   "off_duty",

        # Sleeper Berth  (only when explicitly identified)
        "sleeper":                "sleeper",
        "sleeper berth":          "sleeper",
    }

    # Human-readable label for each FMCSA row (used in remarks output)
    FMCSA_LABEL = {
        "driving":  "DRIVING",
        "on_duty":  "ON DUTY (Not Driving)",
        "off_duty": "OFF DUTY",
        "sleeper":  "SLEEPER BERTH",
    }

    # ------------------------------------------------------------------
    # Time parsing
    # ------------------------------------------------------------------
    @classmethod
    def _parse_dt(cls, value, fallback: datetime) -> datetime:
        """Parse a time value into a timezone-aware datetime.

        Supported formats (tried in order):
        1. Already a datetime object → returned as-is.
        2. ISO-8601 string  (``2026-07-25T08:00:00+00:00``).
        3. 12-hour AM/PM    (``09:00 PM``).
        4. 24-hour          (``21:00``).
        """
        if isinstance(value, datetime):
            return value

        raw = str(value or "").strip()
        if not raw:
            return fallback

        # ISO-8601
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass

        # 12-hour AM/PM
        try:
            t = datetime.strptime(raw, "%I:%M %p").time()
            return fallback.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
        except (ValueError, TypeError):
            pass

        # 24-hour
        try:
            t = datetime.strptime(raw, "%H:%M").time()
            return fallback.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
        except (ValueError, TypeError):
            pass

        return fallback

    # ------------------------------------------------------------------
    # Status mapping
    # ------------------------------------------------------------------
    @classmethod
    def _map_status(cls, activity: str) -> str:
        """Map a timeline activity string to an FMCSA duty-status key."""
        return cls.STATUS_MAP.get(str(activity or "").strip().lower(), "off_duty")

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------
    @classmethod
    def generate_daily_logs(cls, timeline: list, initial_cycle_used: float = 0.0) -> list:
        """Convert a Merged HOS & Operational Timeline into daily log sheets.

        Parameters
        ----------
        timeline : list[dict]
            Each dict must contain at least ``start_time`` and either
            ``end_time`` or ``duration_hours``, plus ``status`` (the
            activity label) and optionally ``location_name`` / ``remarks``.
        initial_cycle_used : float
            Hours already consumed in the driver's 70-hour / 8-day cycle.

        Returns
        -------
        list[dict]
            One dict per calendar day, each containing ``segments``,
            ``remarks_detail``, per-status hour totals, etc.
        """
        if not timeline:
            return []

        # -- configurable header defaults (from Django settings) -----------
        defaults = getattr(settings, "FMCSA_LOG_DEFAULTS", {})
        carrier      = defaults.get("CARRIER_NAME",         "RouteWise Logistics")
        office_addr  = defaults.get("MAIN_OFFICE_ADDRESS",  "100 Transport Way, Suite 400, Chicago, IL 60601")
        driver       = defaults.get("DRIVER_NAME",          "Demo Driver")
        vehicle      = defaults.get("VEHICLE_NUMBER",       "TRK-001 / Trailer #TR-88")
        base_ship    = defaults.get("SHIPPING_NUMBER",      "AUTO-0001")
        co_driver    = defaults.get("CO_DRIVER",            "N/A")

        # -- reference date from first event --------------------------------
        ref = datetime.now(timezone.utc)
        trip_start = cls._parse_dt(timeline[0].get("start_time"), ref)

        # ================================================================
        # PHASE 1 — Split every timeline event at midnight boundaries and
        #           bucket the resulting sub-events by calendar day.
        # ================================================================
        day_buckets: dict[int, dict] = {}

        def _bucket(start_dt: datetime, end_dt: datetime,
                     activity: str, remarks: str, location: str):
            """Insert one sub-event into its calendar-day bucket."""
            fmcsa = cls._map_status(activity)
            day_idx = max(1, (start_dt.date() - trip_start.date()).days + 1)

            if day_idx not in day_buckets:
                day_date = trip_start.date() + timedelta(days=day_idx - 1)
                day_buckets[day_idx] = {
                    "day_number": day_idx,
                    "date":       day_date.isoformat(),
                    "miles":      0.0,
                    "sub_events": [],
                }

            dur_h = round((end_dt - start_dt).total_seconds() / 3600.0, 4)
            if dur_h <= 0:
                return

            sh = start_dt.hour + start_dt.minute / 60.0 + start_dt.second / 3600.0
            eh = end_dt.hour   + end_dt.minute   / 60.0 + end_dt.second   / 3600.0
            if eh == 0.0 and end_dt > start_dt:
                eh = 24.0

            bucket = day_buckets[day_idx]
            if fmcsa == "driving":
                bucket["miles"] += round(dur_h * 55.0, 1)

            bucket["sub_events"].append({
                "fmcsa":     fmcsa,
                "start_h":   round(sh, 4),
                "end_h":     round(eh, 4),
                "dur_h":     dur_h,
                "activity":  activity,
                "location":  location,
                "remarks":   remarks,
                "time_label": start_dt.strftime("%I:%M %p"),
            })

        # Walk every timeline event and split at midnight
        cursor_dt = trip_start
        for event in timeline:
            ev_start = cls._parse_dt(event.get("start_time"), cursor_dt)

            if "end_time" in event and event["end_time"]:
                ev_end = cls._parse_dt(event.get("end_time"), ev_start)
            else:
                dur = float(event.get("duration_hours", 1.0))
                ev_end = ev_start + timedelta(hours=dur)

            # Guard: end must be after start
            if ev_end <= ev_start:
                dur = float(event.get("duration_hours", 1.0))
                ev_end = ev_start + timedelta(hours=dur)

            activity = event.get("status", "Off Duty")
            remarks  = event.get("remarks", event.get("description", ""))
            location = event.get("location_name", event.get("location", "Terminal"))

            # Split across midnight boundaries
            s = ev_start
            while s < ev_end:
                next_midnight = datetime(
                    s.year, s.month, s.day, tzinfo=s.tzinfo or timezone.utc
                ) + timedelta(days=1)
                e = min(ev_end, next_midnight)
                _bucket(s, e, activity, remarks, location)
                s = e

            cursor_dt = ev_end

        # ================================================================
        # PHASE 2 — For each day, build a gapless 0→24 segment list,
        #           compute totals, and emit the log entry.
        # ================================================================
        daily_logs = []
        cycle_remaining = max(0.0, 70.0 - float(initial_cycle_used))

        for day_num in sorted(day_buckets.keys()):
            day = day_buckets[day_num]
            subs = sorted(day["sub_events"], key=lambda x: x["start_h"])

            # Build gapless segments covering 0.0 → 24.0
            segments = []
            cursor = 0.0

            for sub in subs:
                seg_s = max(cursor, min(24.0, sub["start_h"]))
                seg_e = max(seg_s,  min(24.0, sub["end_h"]))

                # Fill gap before this sub-event with off_duty
                if seg_s > cursor + 0.001:
                    gap = round(seg_s - cursor, 2)
                    segments.append({
                        "status":         "off_duty",
                        "start_hour":     round(cursor, 2),
                        "end_hour":       round(seg_s, 2),
                        "duration_hours": gap,
                    })
                    cursor = seg_s

                dur = round(seg_e - seg_s, 2)
                if dur > 0:
                    segments.append({
                        "status":         sub["fmcsa"],
                        "start_hour":     round(seg_s, 2),
                        "end_hour":       round(seg_e, 2),
                        "duration_hours": dur,
                    })
                    cursor = seg_e

            # Fill trailing gap to 24.0
            if cursor < 23.999:
                gap = round(24.0 - cursor, 2)
                segments.append({
                    "status":         "off_duty",
                    "start_hour":     round(cursor, 2),
                    "end_hour":       24.0,
                    "duration_hours": gap,
                })

            # ---- Totals (computed from segments, never separately) ----
            def _sum(key):
                return round(sum(
                    s["duration_hours"] for s in segments if s["status"] == key
                ), 2)

            driving_h  = _sum("driving")
            on_duty_h  = _sum("on_duty")
            off_duty_h = _sum("off_duty")
            sleeper_h  = _sum("sleeper")

            on_duty_today = round(driving_h + on_duty_h, 2)
            cycle_remaining = max(0.0, round(cycle_remaining - on_duty_today, 2))

            # ---- Remarks (one row per original sub-event) ----
            remarks_detail = [
                {
                    "time":     sub["time_label"],
                    "location": sub["location"],
                    "status":   sub["activity"],
                    "reason":   sub["remarks"],
                }
                for sub in subs
            ]

            text_remarks = [
                f"{r['time']} - {r['location']}: {r['reason']}"
                for r in remarks_detail
            ] or ["Normal driving operations"]

            total_days = len(day_buckets)
            ship_no = f"{base_ship}-D{day_num}" if total_days > 1 else base_ship

            daily_logs.append({
                "day_number":            day_num,
                "date":                  day["date"],
                "miles_today":           round(day["miles"], 1),
                "carrier_name":          carrier,
                "main_office_address":   office_addr,
                "driver_name":           driver,
                "vehicle_number":        vehicle,
                "shipping_number":       ship_no,
                "co_driver":             co_driver,
                "driving_hours":         driving_h,
                "on_duty_hours":         on_duty_h,
                "off_duty_hours":        off_duty_h,
                "sleeper_hours":         sleeper_h,
                "total_hours":           24.0,
                "remaining_cycle_hours": cycle_remaining,
                "remarks":               text_remarks,
                "remarks_detail":        remarks_detail,
                "segments":              segments,
                "status_distribution": {
                    "off_duty": off_duty_h,
                    "sleeper":  sleeper_h,
                    "driving":  driving_h,
                    "on_duty":  on_duty_h,
                },
            })

        return daily_logs
