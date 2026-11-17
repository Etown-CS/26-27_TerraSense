# CS401 - TerraSense
![Static Badge](https://img.shields.io/badge/etown-capstone-blue)

TerraSense is a sensor network and predative analytics system that helps small scale growers make data-driven irrigation decisions instead of relying on a fixed schedule or visual inspection. The system will consist of several low-cost, wireless sensor nodes that continuously measure soil moisture, ambient light, and temperature/humidity across a growing area. Data will be transferred to a timetable data base and used to feed an AI model that can forecast when the soil moisture in each plot will cross a given critical threshold. This allows a grower to water proactively instead of reactively. A dashboard presents live and historical sensor data alongside the model’s current irrigation recommendations for each monitored plot.

Elizabethtown College | Computer Science Department | Capstone Projects

## Exploratory watering threshold

Run `python data/moisture_model.py` to load sensor readings from Firebase, match
each event in `data/water_log.csv` to the most recent earlier reading from that
node, and report a candidate moisture threshold per node.
The CSV contains `date`, `time`, and `node_id` columns.

The reported threshold is the median moisture reading before logged watering.
It reflects past watering decisions, not a validated plant-stress threshold for right now due to the current log being small, so we will collect more events and validate the estimate for
the plant, soil, and sensor calibration before using it for automatic irrigation.

