import os
import sys
import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import requests
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))

UTC_TZ = datetime.timezone.utc


def to_eastern_time(dt_utc):
    """Convert a UTC datetime to America/New_York (with pure-stdlib fallback if tzdata is absent)."""
    try:
        return dt_utc.astimezone(ZoneInfo("America/New_York"))
    except ZoneInfoNotFoundError:
        # US DST starts 2nd Sunday in March at 07:00 UTC, ends 1st Sunday in November at 06:00 UTC
        year = dt_utc.year
        mar1 = datetime.datetime(year, 3, 1, 7, 0, tzinfo=UTC_TZ)
        dst_start = mar1 + datetime.timedelta(days=(6 - mar1.weekday()) % 7 + 7)
        nov1 = datetime.datetime(year, 11, 1, 6, 0, tzinfo=UTC_TZ)
        dst_end = nov1 + datetime.timedelta(days=(6 - nov1.weekday()) % 7)
        if dst_start <= dt_utc < dst_end:
            return dt_utc.astimezone(datetime.timezone(datetime.timedelta(hours=-4), "EDT"))
        return dt_utc.astimezone(datetime.timezone(datetime.timedelta(hours=-5), "EST"))


def parse_cron_field(field_str, min_val, max_val):
    """Expand a cron field (e.g. '23,53', '0-5', '*') into a set of integers."""
    values = set()
    for part in field_str.split(","):
        part = part.strip()
        if part == "*":
            values.update(range(min_val, max_val + 1))
        elif "-" in part:
            start_s, end_s = part.split("-", 1)
            values.update(range(int(start_s), int(end_s) + 1))
        elif "/" in part:
            base, step_s = part.split("/", 1)
            step = int(step_s)
            start = min_val if base == "*" else int(base)
            values.update(range(start, max_val + 1, step))
        else:
            values.add(int(part))
    return values


def resolve_scheduled_utc(cron_expr, actual_start_utc):
    """
    Given the triggered GitHub Actions cron expression (e.g. '47 8 * 9-12,1 2')
    and the actual UTC start timestamp, find the most recent scheduled UTC minute
    at or before actual_start_utc that matches the cron minute and hour fields.
    """
    if not cron_expr or not cron_expr.strip():
        return None

    parts = cron_expr.strip().split()
    if len(parts) < 2:
        return None

    try:
        valid_minutes = parse_cron_field(parts[0], 0, 59)
        valid_hours = parse_cron_field(parts[1], 0, 23)
    except ValueError:
        return None

    candidate = actual_start_utc.replace(second=0, microsecond=0)
    # Search up to 24 hours (1440 minutes) backwards for the matching cron slot
    for _ in range(1440):
        if candidate.minute in valid_minutes and candidate.hour in valid_hours:
            return candidate
        candidate -= datetime.timedelta(minutes=1)

    return None


def format_duration(seconds):
    """Format a duration in seconds into a readable string like '12m 34s' or '1h 05m 12s'."""
    seconds = max(0, int(round(seconds)))
    hours, rem = divmod(seconds, 3600)
    minutes, secs = divmod(rem, 60)
    if hours > 0:
        return f"{hours}h {minutes:02d}m {secs:02d}s"
    if minutes > 0:
        return f"{minutes}m {secs:02d}s"
    return f"{secs}s"


def format_ts_et(dt_utc):
    """Format a UTC datetime into Eastern Time and UTC strings."""
    if dt_utc is None:
        return "N/A (Manual Run)", "N/A"
    dt_et = to_eastern_time(dt_utc)
    et_str = dt_et.strftime("%Y-%m-%d %I:%M:%S %p %Z")
    utc_str = dt_utc.strftime("%H:%M:%S UTC")
    return et_str, utc_str


def send_ntfy_notification(title, message, priority="default", tags="calendar"):
    """Send push notification via ntfy.sh using the established requests package."""
    topic = os.getenv("NTFY_TOPIC", "").strip()
    server_url = os.getenv("NTFY_SERVER", "https://ntfy.sh").strip().rstrip("/")

    if not topic:
        print("Notice: NTFY_TOPIC is not set. Skipping ntfy.sh push notification.")
        return

    url = f"{server_url}/{topic}"
    headers = {
        "Title": title,
        "Priority": priority,
        "Tags": tags,
    }

    run_url = os.getenv("GITHUB_RUN_URL", "").strip()
    if run_url:
        headers["Click"] = run_url

    try:
        resp = requests.post(url, data=message.encode("utf-8"), headers=headers, timeout=10)
        resp.raise_for_status()
        print(f"SUCCESS: Sent ntfy notification '{title}' to topic '{topic}'.")
    except Exception as exc:
        print(f"WARNING: Failed to send ntfy notification ({exc}). Continuing pipeline.")


def write_github_summary(
    tier_name,
    phase,
    event_name,
    cron_expr,
    scheduled_utc,
    actual_start_utc,
    delay_seconds,
    end_utc=None,
    job_status="RUNNING",
):
    """Write or update the Markdown timing table in $GITHUB_STEP_SUMMARY."""
    summary_path = os.getenv("GITHUB_STEP_SUMMARY", "").strip()
    if not summary_path:
        return

    sched_et, sched_utc_s = format_ts_et(scheduled_utc)
    start_et, start_utc_s = format_ts_et(actual_start_utc)

    if scheduled_utc is not None:
        delay_str = f"+{format_duration(delay_seconds)}"
        if delay_seconds >= 900:
            delay_badge = f"⚠️ **{delay_str}**"
        elif delay_seconds >= 300:
            delay_badge = f"🟡 **{delay_str}**"
        else:
            delay_badge = f"🟢 **{delay_str}**"
    else:
        delay_badge = "Manual Trigger (0s)"

    trigger_label = f"`schedule` (`{cron_expr}`)" if cron_expr else f"`{event_name or 'manual'}`"

    if phase == "start":
        status_badge = "⏳ **In Progress**"
        end_cell = "*Running...*"
        duration_cell = "*Running...*"
        heading = f"### 🚀 {tier_name} — Start Timing Log"
    else:
        status_upper = (job_status or "UNKNOWN").upper()
        if status_upper == "SUCCESS":
            status_badge = "✅ **Succeeded**"
        elif status_upper in ("FAILURE", "FAILED"):
            status_badge = "❌ **Failed**"
        elif status_upper == "CANCELLED":
            status_badge = "⚪ **Cancelled**"
        else:
            status_badge = f"ℹ️ **{status_upper}**"

        end_et, end_utc_s = format_ts_et(end_utc)
        end_cell = f"{end_et} (`{end_utc_s}`)"
        runtime_secs = (end_utc - actual_start_utc).total_seconds() if end_utc else 0
        duration_cell = f"**{format_duration(runtime_secs)}**"
        heading = f"### 📊 {tier_name} — Final Execution & Schedule Timing Summary"

    sched_cell = f"{sched_et} (`{sched_utc_s}`)" if scheduled_utc else "Manual Run (No Cron)"
    start_cell = f"{start_et} (`{start_utc_s}`)"

    markdown = (
        f"{heading}\n\n"
        f"| Metric | Details |\n"
        f"| :--- | :--- |\n"
        f"| **Pipeline / Job** | **{tier_name}** |\n"
        f"| **Status** | {status_badge} |\n"
        f"| **Trigger** | {trigger_label} |\n"
        f"| **Scheduled Start** | {sched_cell} |\n"
        f"| **Actual Runner Start** | {start_cell} |\n"
        f"| **GitHub Cron Delay** | {delay_badge} |\n"
        f"| **Completed At** | {end_cell} |\n"
        f"| **Total Runtime** | {duration_cell} |\n\n"
    )

    try:
        mode = "w" if phase == "end" else "a"
        with open(summary_path, mode, encoding="utf-8") as f:
            f.write(markdown)
        print(f"SUCCESS: Wrote {phase} timing table to GITHUB_STEP_SUMMARY.")
    except Exception as exc:
        print(f"WARNING: Could not write to GITHUB_STEP_SUMMARY ({exc}).")


def main():
    """
    CLI Usage:
      python vffl_pipeline_notifier.py <start|end> <tier_name> [actual_start_epoch] [job_status]
    Environment variables read:
      NTFY_TOPIC           - Private ntfy.sh topic name
      GITHUB_CRON_SCHEDULE - Cron string from github.event.schedule (if scheduled)
      GITHUB_EVENT_NAME    - 'schedule' or 'workflow_dispatch'
      GITHUB_RUN_URL       - Link to the GitHub Actions workflow run
      GITHUB_STEP_SUMMARY  - Path provided automatically by GitHub Actions
    """
    if len(sys.argv) < 3:
        print("Usage: python vffl_pipeline_notifier.py <start|end> <tier_name> [actual_start_epoch] [job_status]")
        sys.exit(1)

    phase = sys.argv[1].strip().lower()
    tier_name = sys.argv[2].strip()

    now_utc = datetime.datetime.now(UTC_TZ)

    if len(sys.argv) >= 4 and sys.argv[3].strip():
        try:
            actual_start_utc = datetime.datetime.fromtimestamp(int(sys.argv[3].strip()), tz=UTC_TZ)
        except ValueError:
            actual_start_utc = now_utc
    else:
        actual_start_utc = now_utc

    job_status = sys.argv[4].strip() if len(sys.argv) >= 5 else "SUCCESS"

    cron_expr = os.getenv("GITHUB_CRON_SCHEDULE", "").strip()
    event_name = os.getenv("GITHUB_EVENT_NAME", "manual").strip()

    scheduled_utc = resolve_scheduled_utc(cron_expr, actual_start_utc) if cron_expr else None
    if scheduled_utc is not None:
        delay_seconds = max(0, (actual_start_utc - scheduled_utc).total_seconds())
        delay_str = f"+{format_duration(delay_seconds)}"
    else:
        delay_seconds = 0
        delay_str = "0s (Manual Run)"

    sched_et, _ = format_ts_et(scheduled_utc)
    start_et, _ = format_ts_et(actual_start_utc)

    if phase == "start":
        title = f"[START] {tier_name}"
        priority = "high" if delay_seconds >= 900 else "default"
        tags = "warning,stopwatch" if delay_seconds >= 900 else "rocket,stopwatch"
        lines = [
            f"Pipeline: {tier_name}",
            f"Scheduled Start: {sched_et}",
            f"Actual Start:    {start_et}",
            f"Cron Delay:      {delay_str}",
        ]
        if cron_expr:
            lines.append(f"Schedule Rule:   {cron_expr} (UTC)")
        else:
            lines.append(f"Trigger:         {event_name}")

        message = "\n".join(lines)
        send_ntfy_notification(title, message, priority=priority, tags=tags)
        write_github_summary(
            tier_name=tier_name,
            phase="start",
            event_name=event_name,
            cron_expr=cron_expr,
            scheduled_utc=scheduled_utc,
            actual_start_utc=actual_start_utc,
            delay_seconds=delay_seconds,
        )

    elif phase == "end":
        end_utc = now_utc
        end_et, _ = format_ts_et(end_utc)
        runtime_secs = max(0, (end_utc - actual_start_utc).total_seconds())
        runtime_str = format_duration(runtime_secs)
        status_upper = job_status.upper()

        if status_upper == "SUCCESS":
            title = f"[DONE] {tier_name}"
            priority = "default"
            tags = "white_check_mark,checkered_flag"
        else:
            title = f"[{status_upper}] {tier_name}"
            priority = "urgent"
            tags = "rotating_light,x"

        lines = [
            f"Status:          {status_upper}",
            f"Scheduled Start: {sched_et}",
            f"Actual Start:    {start_et}",
            f"Cron Delay:      {delay_str}",
            f"Completed At:    {end_et}",
            f"Total Runtime:   {runtime_str}",
        ]
        message = "\n".join(lines)
        send_ntfy_notification(title, message, priority=priority, tags=tags)
        write_github_summary(
            tier_name=tier_name,
            phase="end",
            event_name=event_name,
            cron_expr=cron_expr,
            scheduled_utc=scheduled_utc,
            actual_start_utc=actual_start_utc,
            delay_seconds=delay_seconds,
            end_utc=end_utc,
            job_status=status_upper,
        )
    else:
        print(f"Error: Unknown phase '{phase}'. Expected 'start' or 'end'.")
        sys.exit(1)


if __name__ == "__main__":
    main()
