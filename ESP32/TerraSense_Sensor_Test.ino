/*
  TerraSense - Sensor Test Sketch (TEMPORARY, no IR sensor)
  ---------------------------------------------------------
  Quick bring-up test for one node's sensors:
    - Capacitive soil moisture sensor (analog, ADC1 pin)
    - SHT31 temperature/humidity sensor (I2C)
    - BH1750 light sensor (I2C)

  Prints raw readings to the Serial Monitor (115200 baud) every 2 seconds.

  REQUIRED LIBRARIES (Arduino IDE > Manage Libraries):
    - "Adafruit SHT31 Library" by Adafruit
    - "BH1750" by Christopher Laws

  WIRING:
    - Soil moisture sensor: VCC -> 3.3V, GND -> GND, AOUT -> GPIO34
    - SHT31 and BH1750 share the I2C bus:
        SDA -> GPIO21, SCL -> GPIO22, VCC -> 3.3V, GND -> GND
*/

#include <Wire.h>
#include "Adafruit_SHT31.h"
#include <BH1750.h>

const int SOIL_MOISTURE_PIN = 19;

Adafruit_SHT31 sht31 = Adafruit_SHT31();
BH1750 lightMeter;

// Soil calibration placeholders: read the raw value in open air (dry) and
// in a cup of water (wet), then update these two numbers.
const int SOIL_DRY_RAW = 3000;
const int SOIL_WET_RAW = 1200;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- TerraSense Sensor Test ---");

  Wire.begin(21, 22);  // SDA, SCL

  if (!sht31.begin(0x44)) {
    Serial.println("WARNING: SHT31 not found at 0x44 - check wiring.");
  } else {
    Serial.println("SHT31 OK.");
  }

  if (!lightMeter.begin()) {
    Serial.println("WARNING: BH1750 not found - check wiring.");
  } else {
    Serial.println("BH1750 OK.");
  }

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  Serial.println("--- Starting readings (every 2s) ---\n");
}

void loop() {
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int soilPercent = map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  float tempC = sht31.readTemperature();
  float humidity = sht31.readHumidity();
  float lux = lightMeter.readLightLevel();

  Serial.println("----------------------------------------");
  Serial.print("Soil Moisture: raw=");
  Serial.print(soilRaw);
  Serial.print("  approx %=");
  Serial.println(soilPercent);

  if (!isnan(tempC) && !isnan(humidity)) {
    Serial.print("Air Temp: ");
    Serial.print(tempC);
    Serial.print(" C   Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  } else {
    Serial.println("SHT31 read failed (NaN) - check wiring.");
  }

  if (lux >= 0) {
    Serial.print("Light: ");
    Serial.print(lux);
    Serial.println(" lux");
  } else {
    Serial.println("BH1750 read failed - check wiring.");
  }

  delay(2000);
}
