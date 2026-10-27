"""
TerraSense - Pi Bridge
----------------------
Runs on the Raspberry Pi. Listens for readings from every ESP32 node over MQTT,
saves each one to a local SQLite database, and pushes it to Firebase.

If Firebase can't be reached (no internet), readings are still saved locally
and are re-sent automatically later.

SETUP (on the Pi):
    python3 -m venv ~/terrasense-venv
    source ~/terrasense-venv/bin/activate
    pip install paho-mqtt firebase-admin
    python terrasense_bridge.py

Start with FIREBASE_MODE = "off" to confirm local logging works first.
Then set it to "rtdb" (Realtime Database) or "firestore" and fill in the
Firebase settings below.
"""

import json
import os
import sqlite3
import time
from datetime import datetime
from zoneinfo import ZoneInfo  # Built-in python library for timezones

import paho.mqtt.client as mqtt

# ---------------- CONFIG ----------------
MQTT_HOST = "localhost"            # Mosquitto runs on this same Pi
MQTT_PORT = 1883
MQTT_TOPIC = "terrasense/+/telemetry"   # "+" matches every node ID

DB_PATH = os.path.expanduser("~/terrasense/readings.db")

FIREBASE_MODE = "rtdb"              # "off", "rtdb", or "firestore"
SERVICE_ACCOUNT_FILE = os.path.expanduser("~/terrasense/serviceAccountKey.json")
RTDB_URL = "https://terrasense-cs401-default-rtdb.firebaseio.com"   # rtdb mode only

RETRY_EVERY_S = 60                 # how often to retry unsent readings
RETRY_BATCH = 100                  # max readings to retry at once
# ----------------------------------------

FIELDS = ["ts", "node_id", "soil_raw", "soil_pct", "temp_c", "humidity", "lux"]
fb = None   # Firebase handle, set by init_firebase()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            node_id TEXT NOT NULL,
            soil_raw INTEGER,
            soil_pct INTEGER,
            temp_c REAL,
            humidity REAL,
            lux REAL,
            synced INTEGER NOT NULL DEFAULT 0
        )"""
    )
    conn.commit()
    return conn


def init_firebase():
    global fb
    if FIREBASE_MODE == "off":
        return
    import firebase_admin
    from firebase_admin import credentials

    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    if FIREBASE_MODE == "rtdb":
        from firebase_admin import db
        firebase_admin.initialize_app(cred, {"databaseURL": RTDB_URL})
        fb = db
    elif FIREBASE_MODE == "firestore":
        from firebase_admin import firestore
        firebase_admin.initialize_app(cred)
        fb = firestore.client()
    else:
        raise ValueError(f"Unknown FIREBASE_MODE: {FIREBASE_MODE}")


def push_to_firebase(data, update_latest):
    """Send one reading to Firebase. Raises an exception on failure."""
    node = data["node_id"]
    if FIREBASE_MODE == "rtdb":
        fb.reference(f"readings/{node}").push(data)
        if update_latest:
            fb.reference(f"nodes/{node}/latest").set(data)
    elif FIREBASE_MODE == "firestore":
        fb.collection("readings").add(data)
        if update_latest:
            fb.collection("nodes").document(node).set({"latest": data})


def retry_unsynced(conn):
    rows = conn.execute(
        "SELECT id, ts, node_id, soil_raw, soil_pct, temp_c, humidity, lux "
        "FROM readings WHERE synced = 0 ORDER BY id LIMIT ?",
        (RETRY_BATCH,),
    ).fetchall()
    for row in rows:
        data = dict(zip(FIELDS, row[1:]))
        try:
            push_to_firebase(data, update_latest=False)
            conn.execute("UPDATE readings SET synced = 1 WHERE id = ?", (row[0],))
            conn.commit()
        except Exception as e:
            print(f"Firebase retry failed ({e}); will try again later.")
            break

def handle_message(conn, state, topic, payload_bytes):
    try:
        p = json.loads(payload_bytes.decode())
    except ValueError:
        print(f"Ignoring bad payload on {topic}: {payload_bytes!r}")
        return

    node_id = p.get("node_id") or topic.split("/")[1]
    data = {
        "ts": datetime.now(ZoneInfo("America/New_York")).isoformat(timespec="seconds"),
        "node_id": node_id,
        "soil_raw": p.get("soil_raw"),
        "soil_pct": p.get("soil_pct"),
        "temp_c": p.get("temp_c"),
        "humidity": p.get("humidity"),
        "lux": p.get("lux"),
    }

    cur = conn.execute(
        "INSERT INTO readings (ts, node_id, soil_raw, soil_pct, temp_c, humidity, lux) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data[f] for f in FIELDS],
    )
    conn.commit()
    row_id = cur.lastrowid
    print(f"Saved #{row_id}: {data}")

    if FIREBASE_MODE == "off":
        return

    try:
        push_to_firebase(data, update_latest=True)
        conn.execute("UPDATE readings SET synced = 1 WHERE id = ?", (row_id,))
        conn.commit()
    except Exception as e:
        print(f"Firebase push failed ({e}); saved locally, will retry.")

    if time.time() - state["last_retry"] > RETRY_EVERY_S:
        state["last_retry"] = time.time()
        retry_unsynced(conn)

def handle_message(conn, state, topic, payload_bytes):
    try:
        p = json.loads(payload_bytes.decode())
    except ValueError:
        print(f"Ignoring bad payload on {topic}: {payload_bytes!r}")
        return

    node_id = p.get("node_id") or topic.split("/")[1]
    data = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "node_id": node_id,
        "soil_raw": p.get("soil_raw"),
        "soil_pct": p.get("soil_pct"),
        "temp_c": p.get("temp_c"),
        "humidity": p.get("humidity"),
        "lux": p.get("lux"),
    }

    cur = conn.execute(
        "INSERT INTO readings (ts, node_id, soil_raw, soil_pct, temp_c, humidity, lux) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data[f] for f in FIELDS],
    )
    conn.commit()
    row_id = cur.lastrowid
    print(f"Saved #{row_id}: {data}")

    if FIREBASE_MODE == "off":
        return

    try:
        push_to_firebase(data, update_latest=True)
        conn.execute("UPDATE readings SET synced = 1 WHERE id = ?", (row_id,))
        conn.commit()
    except Exception as e:
        print(f"Firebase push failed ({e}); saved locally, will retry.")

    if time.time() - state["last_retry"] > RETRY_EVERY_S:
        state["last_retry"] = time.time()
        retry_unsynced(conn)


def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected to MQTT broker (code: {reason_code}). Subscribing to {MQTT_TOPIC}")
    client.subscribe(MQTT_TOPIC)   # re-subscribes automatically after a reconnect


def on_message(client, userdata, msg):
    handle_message(userdata["conn"], userdata, msg.topic, msg.payload)


def main():
    conn = init_db()
    init_firebase()
    state = {"conn": conn, "last_retry": time.time()}

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, userdata=state)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_forever()


if __name__ == "__main__":
    main()
