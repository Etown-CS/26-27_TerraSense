/*
  TerraSense - MQTT Node Firmware (first version)
  -----------------------------------------------
  Reads soil moisture, SHT31 and BH1750, then publishes one JSON message
  every PUBLISH_INTERVAL_MS to the MQTT broker running on the Raspberry Pi.

  REQUIRED LIBRARIES (Arduino IDE > Manage Libraries):
    - "Adafruit SHT31 Library" by Adafruit
    - "BH1750" by Christopher Laws
    - "PubSubClient" by Nick O'Leary

  BEFORE UPLOADING, edit the CONFIG section below:
    - WIFI_SSID / WIFI_PASSWORD  (must be a 2.4 GHz network)
    - MQTT_BROKER_IP             (the Pi's IP address, from "hostname -I" on the Pi)
    - SDA_PIN / SCL_PIN / SOIL_MOISTURE_PIN  (match how you actually wired it)

  MQTT topic:   terrasense/<NODE_ID>/telemetry
  Payload:      {"node_id":"node1","soil_raw":3500,"soil_pct":12,
                 "temp_c":24.9,"humidity":78.1,"lux":340.0}
*/

#include <WiFi.h>
#include <Wire.h>
#include <PubSubClient.h>
#include "Adafruit_SHT31.h"
#include <BH1750.h>

// ---------------- CONFIG ----------------
const char* WIFI_SSID      = "WIFI NAME";
const char* WIFI_PASSWORD  = "PASSWORD";

const char* MQTT_BROKER_IP = "ENTER IP HERE";   // the Pi's IP address
const int   MQTT_PORT      = 1883;

const char* NODE_ID        = "node#";          // give each ESP32 a unique ID change # to next node
//const unsigned long PUBLISH_INTERVAL_MS = 10000;  // 10 s for testing; use minutes in deployment
const unsigned long PUBLISH_INTERVAL_MS = 30UL * 60UL * 1000UL;  // 30 minutes

const int SDA_PIN = 21;
const int SCL_PIN = 22;
const int SOIL_MOISTURE_PIN = 34;              // must be an ADC1 pin

// Soil calibration: raw reading in open air (dry) and in water (wet)
const int SOIL_DRY_RAW = 3500;
const int SOIL_WET_RAW = 1200;
// ----------------------------------------

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
Adafruit_SHT31 sht31 = Adafruit_SHT31();
BH1750 lightMeter;

char topic[64];
unsigned long lastPublish = 0;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\nWiFi connected. ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT broker... ");
    if (mqtt.connect(NODE_ID)) {
      Serial.println("connected.");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" - retrying in 3 s");
      delay(3000);
    }
  }
}

// Writes a float as JSON, or null if the reading is invalid (NaN)
void appendFloat(char* buf, size_t size, const char* key, float value, int decimals, bool last) {
  char part[48];
  if (isnan(value)) {
    snprintf(part, sizeof(part), "\"%s\":null%s", key, last ? "" : ",");
  } else {
    snprintf(part, sizeof(part), "\"%s\":%.*f%s", key, decimals, value, last ? "" : ",");
  }
  strncat(buf, part, size - strlen(buf) - 1);
}

void publishReading() {
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int soilPct = constrain(map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100), 0, 100);
  float tempC = sht31.readTemperature();
  float humidity = sht31.readHumidity();
  float lux = lightMeter.readLightLevel();
  if (lux < 0) lux = NAN;   // BH1750 returns a negative number on failure

  char payload[256];
  snprintf(payload, sizeof(payload),
           "{\"node_id\":\"%s\",\"soil_raw\":%d,\"soil_pct\":%d,", NODE_ID, soilRaw, soilPct);
  appendFloat(payload, sizeof(payload), "temp_c", tempC, 2, false);
  appendFloat(payload, sizeof(payload), "humidity", humidity, 2, false);
  appendFloat(payload, sizeof(payload), "lux", lux, 1, true);
  strncat(payload, "}", sizeof(payload) - strlen(payload) - 1);

  bool ok = mqtt.publish(topic, payload);
  Serial.print(ok ? "Published: " : "PUBLISH FAILED: ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- TerraSense MQTT Node ---");

  Wire.begin(SDA_PIN, SCL_PIN);
  if (!sht31.begin(0x44)) Serial.println("WARNING: SHT31 not found.");
  if (!lightMeter.begin()) Serial.println("WARNING: BH1750 not found.");
  pinMode(SOIL_MOISTURE_PIN, INPUT);

  snprintf(topic, sizeof(topic), "terrasense/%s/telemetry", NODE_ID);

  connectWiFi();
  mqtt.setServer(MQTT_BROKER_IP, MQTT_PORT);
  mqtt.setBufferSize(512);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  if (lastPublish == 0 || millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
  lastPublish = millis();
  publishReading();
}
}
