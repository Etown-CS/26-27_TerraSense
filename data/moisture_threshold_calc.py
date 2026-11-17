from pathlib import Path

import pandas as pd


DATABASE_URL = "https://terrasense-cs401-default-rtdb.firebaseio.com/"
SERVICE_ACCOUNT_PATH = (
    Path(__file__).resolve().parent
    / "terrasense-cs401-firebase-adminsdk-fbsvc-2ddf7ce1b2.json"
)
WATERING_LOG_PATH = Path(__file__).resolve().parent / "water_log.csv"
LOCAL_TIMEZONE = "America/New_York"


def load_firebase_readings():
    import firebase_admin
    from firebase_admin import credentials, db

    try:
        firebase_admin.get_app()
    except ValueError:
        credential = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(
            credential,
            {"databaseURL": DATABASE_URL},
        )

    data = db.reference("/readings").get()
    if not data:
        raise ValueError("Firebase returned no readings at /readings.")

    frames = []
    for node_id, node_data in data.items():
        if not node_data:
            continue
        frame = pd.DataFrame.from_dict(node_data, orient="index")
        if "node_id" not in frame.columns:
            frame["node_id"] = node_id
        frames.append(frame)

    if not frames:
        raise ValueError("Firebase returned no readings for any sensor node.")

    readings = pd.concat(frames, ignore_index=True)
    required = {"node_id", "ts", "soil_pct"}
    missing = required.difference(readings.columns)
    if missing:
        raise ValueError(f"Firebase readings are missing required fields: {sorted(missing)}")
    return readings


def load_watering_events(path):
    events = pd.read_csv(path, skipinitialspace=True)
    events.columns = events.columns.str.strip()
    required = {"date", "time", "node_id"}
    missing = required.difference(events.columns)
    if missing:
        raise ValueError(f"Watering log is missing required columns: {sorted(missing)}")

    events["node_id"] = events["node_id"].astype("string").str.strip()
    events["event_ts"] = pd.to_datetime(
        events["date"].astype("string").str.strip()
        + " "
        + events["time"].astype("string").str.strip(),
        format="%m/%d/%y %I:%M %p",
        errors="coerce",
    )
    invalid = events["event_ts"].isna() | events["node_id"].isna() | events["node_id"].eq("")
    if invalid.any():
        raise ValueError(
            f"Watering log contains {int(invalid.sum())} row(s) with invalid "
            "date, time, or node_id."
        )
    return events[["node_id", "event_ts"]]


def match_pre_watering_readings(readings, events):
    required = {"node_id", "ts", "soil_pct"}
    missing = required.difference(readings.columns)
    if missing:
        raise ValueError(f"Readings are missing required fields: {sorted(missing)}")

    sensor_data = readings[["node_id", "ts", "soil_pct"]].copy()
    sensor_data["node_id"] = sensor_data["node_id"].astype("string").str.strip()
    sensor_data["reading_ts"] = pd.to_datetime(
        sensor_data.pop("ts"),
        errors="coerce",
        utc=True,
    )
    sensor_data["soil_pct"] = pd.to_numeric(sensor_data["soil_pct"], errors="coerce")

    invalid = (
        sensor_data["node_id"].isna()
        | sensor_data["node_id"].eq("")
        | sensor_data["reading_ts"].isna()
        | sensor_data["soil_pct"].isna()
    )
    if invalid.any():
        raise ValueError(
            f"Firebase readings contain {int(invalid.sum())} row(s) with invalid "
            "node_id, timestamp, or soil_pct."
        )

    sensor_data["reading_ts"] = (
        sensor_data["reading_ts"]
        .dt.tz_convert(LOCAL_TIMEZONE)
        .dt.tz_localize(None)
    )
    matched = pd.merge_asof(
        events.sort_values("event_ts"),
        sensor_data.sort_values("reading_ts"),
        left_on="event_ts",
        right_on="reading_ts",
        by="node_id",
        direction="backward"
    )

    unmatched = matched["reading_ts"].isna()
    if unmatched.any():
        missing_events = matched.loc[unmatched, ["node_id", "event_ts"]]
        details = ", ".join(
            f"{row.node_id} at {row.event_ts}"
            for row in missing_events.itertuples(index=False)
        )

    matched["minutes_before"] = (
        matched["event_ts"] - matched["reading_ts"]
    ).dt.total_seconds() / 60
    return matched


def estimate_thresholds(matched_events):
    if matched_events.empty:
        raise ValueError("Cannot estimate thresholds without matched watering events.")

    grouped = matched_events.groupby("node_id")["soil_pct"]
    summary = grouped.agg(
        event_count="count",
        threshold_pct="median",
        min_event_pct="min",
        max_event_pct="max",
    )
    summary["q25_pct"] = grouped.quantile(0.25)
    summary["q75_pct"] = grouped.quantile(0.75)
    return summary.reset_index()


def main():
    readings = load_firebase_readings()
    events = load_watering_events()
    matched = match_pre_watering_readings(readings, events)
    thresholds = estimate_thresholds(matched)

    print(
        matched[
            ["node_id", "event_ts", "reading_ts", "minutes_before", "soil_pct"]
        ].to_string(index=False)
    )
    print("\nExploratory candidate thresholds by node:")
    print(thresholds.to_string(index=False, float_format=lambda value: f"{value:.1f}"))
    print(
        "\nThresholds are the median sensor readings recorded before logged watering. "
    )


if __name__ == "__main__":
    main()