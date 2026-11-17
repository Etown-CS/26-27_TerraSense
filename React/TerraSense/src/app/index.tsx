import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Button from '@/components/ui/button';

import { collection, getDocs } from 'firebase/firestore/lite';
import { db, realtimeDb } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';

export default function HomeScreen() {
  const router = useRouter();
  
  type Plant = {
    plant_id: string;
    plant_name: string;
    node_id?: string;
    ideal_humidity_pct?: number;
    ideal_light_lvl?: number;
    ideal_temp?: number;
    ideal_moisture_lvl?: number;
  }

  type Readout = {
      humidity: number;
      lux: number;
      node_id: string;
      soil_pct: number;
      temp_c: number;
  }

  const [plants, setPlants] = useState<Plant[]>([]);
  const [readouts, setReadouts] = useState<Record<string, Readout | null>>({});
  const [moistureThresholds, setMoistureThresholds] = useState<Record<string, number | null>>({});
  const [readoutErrors, setReadoutErrors] = useState<Record<string, string>>({});
  const [thresholdErrors, setThresholdErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousMoisture = useRef<Record<string, { soilPct: number; thresholdPct: number }>>({});

  useEffect(() => {
    const nodeIds = ['node1', 'node2'] as const;

    const unsubscribe = nodeIds.flatMap((nodeId) => [
      onValue(
        ref(realtimeDb, `nodes/${nodeId}/latest`),
        (snapshot) => {
          setReadouts((current) => ({
            ...current,
            [nodeId]: snapshot.val() as Readout | null,
          }));
        },
        (error) => {
          setReadoutErrors((current) => ({
            ...current,
            [nodeId]: error.message,
          }));
          console.error(`Could not read ${nodeId} data:`, error);
        }
      ),
      onValue(
        ref(realtimeDb, `thresholds/${nodeId}/soil_pct`),
        (snapshot) => {
          const value: unknown = snapshot.val();
          setThresholdErrors((current) => {
            const next = { ...current };
            delete next[nodeId];
            return next;
          });
          if (value === null) {
            setMoistureThresholds((current) => ({ ...current, [nodeId]: null }));
            return;
          }
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            setMoistureThresholds((current) => ({ ...current, [nodeId]: null }));
            setThresholdErrors((current) => ({
              ...current,
              [nodeId]: 'The configured moisture threshold is invalid.',
            }));
            console.error(`Invalid moisture threshold for ${nodeId}:`, value);
            return;
          }
          setMoistureThresholds((current) => ({ ...current, [nodeId]: value }));
        },
        (error) => {
          setThresholdErrors((current) => ({
            ...current,
            [nodeId]: error.message,
          }));
          console.error(`Could not read ${nodeId} moisture threshold:`, error);
        }
      ),
    ]);

    return () => unsubscribe.forEach((stop) => stop());
  }, []);

  useEffect(() => {
    for (const [nodeId, readout] of Object.entries(readouts)) {
      const thresholdPct = moistureThresholds[nodeId];
      if (
        !readout ||
        typeof readout.soil_pct !== 'number' ||
        !Number.isFinite(readout.soil_pct) ||
        typeof thresholdPct !== 'number'
      ) {
        continue;
      }

      const previous = previousMoisture.current[nodeId];
      if (
        previous &&
        previous.soilPct > previous.thresholdPct &&
        readout.soil_pct <= thresholdPct &&
        readout.soil_pct !== previous.soilPct
      ) {
        Alert.alert(
          'Plant may need water',
          `${nodeId} soil moisture is ${readout.soil_pct}%, at or below its ${thresholdPct}% threshold.`
        );
      }

      previousMoisture.current[nodeId] = {
        soilPct: readout.soil_pct,
        thresholdPct,
      };
    }
  }, [moistureThresholds, readouts]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPlants() {
        try {
          const snapshot = await getDocs(collection(db, 'plants'));
          const results: Plant[] = snapshot.docs.map((plantDoc) => {
            const data = plantDoc.data();
            return {
              plant_id: plantDoc.id,
              plant_name: typeof data.plant_name === 'string' ? data.plant_name : 'Unnamed plant',
              node_id: typeof data.node_id === 'string' ? data.node_id : undefined,
              ideal_humidity_pct:
                typeof data.ideal_humidity_pct === 'number'
                  ? data.ideal_humidity_pct
                  : undefined,
              ideal_light_lvl:
                typeof data.ideal_light_lvl === 'number' ? data.ideal_light_lvl : undefined,
              ideal_temp: typeof data.ideal_temp === 'number' ? data.ideal_temp : undefined,
              ideal_moisture_lvl:
                typeof data.ideal_moisture_lvl === 'number'
                  ? data.ideal_moisture_lvl
                  : undefined,
            };
          });

          if (active) {
            setPlants(results);
            setError(null);
          }
        } catch (err) {
          if (active) setError('Could not load plants');
          console.error('Error loading plants:', err);
        } finally {
          if (active) setLoading(false);
        }
      }

      void loadPlants();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>

        <ThemedText type="subtitle" style={styles.title}>Your Plants</ThemedText>

        {loading ? (
          <ThemedText>Loading Plants...</ThemedText>
        ) : error ? (
          <ThemedText>{error}</ThemedText>
        ) : (
          <FlatList
            data={plants}
            keyExtractor={(plant) => plant.plant_id}
            ListEmptyComponent={<ThemedText>No plants</ThemedText>}
            renderItem={({ item }) => {
              const nodeId = item.node_id;
              const readout = nodeId ? readouts[nodeId] : null;
              const thresholdPct = nodeId ? moistureThresholds[nodeId] : null;

              return (
                <View style={styles.plantCard}>
                  <ThemedText type="smallBold">{item.plant_name}</ThemedText>
                  {nodeId ? (
                    <>
                      <ThemedText>Node: {nodeId}</ThemedText>
                      {readoutErrors[nodeId] ? (
                        <ThemedText>Could not load readout: {readoutErrors[nodeId]}</ThemedText>
                      ) : readout ? (
                        <>
                          <ThemedText>
                            Humidity: {readout.humidity}% · Light: {readout.lux} lux ·
                            Temperature: {readout.temp_c} °C · Soil moisture: {readout.soil_pct}%
                          </ThemedText>
                          {thresholdErrors[nodeId] ? (
                            <ThemedText>
                              Could not load moisture threshold: {thresholdErrors[nodeId]}
                            </ThemedText>
                          ) : typeof thresholdPct === 'number' ? (
                            readout.soil_pct <= thresholdPct ? (
                              <ThemedText>
                                Watering may be needed: at or below the {thresholdPct}% threshold.
                              </ThemedText>
                            ) : (
                              <ThemedText>Moisture threshold: {thresholdPct}%</ThemedText>
                            )
                          ) : (
                            <ThemedText>Moisture threshold is not configured.</ThemedText>
                          )}
                        </>
                      ) : (
                        <ThemedText>Waiting for readout...</ThemedText>
                      )}
                    </>
                  ) : null}
                  {item.ideal_humidity_pct !== undefined ||
                  item.ideal_light_lvl !== undefined ||
                  item.ideal_temp !== undefined ||
                  item.ideal_moisture_lvl !== undefined ? (
                    <ThemedText>
                      {item.ideal_humidity_pct !== undefined
                        ? `Ideal humidity: ${item.ideal_humidity_pct}% · `
                        : ''}
                      {item.ideal_light_lvl !== undefined
                        ? `Light: ${item.ideal_light_lvl} lumens · `
                        : ''}
                      {item.ideal_temp !== undefined ? `Temperature: ${item.ideal_temp} C · ` : ''}
                      {item.ideal_moisture_lvl !== undefined
                        ? `Soil moisture: ${item.ideal_moisture_lvl}%`
                        : ''}
                    </ThemedText>
                  ) : null}
                </View>
              );
            }}
            />
        )
      }




          
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  title: {
    textAlign: 'left',
    paddingTop: Spacing.six,
    paddingLeft: Spacing.three,
    fontFamily: 'Arial',
  },
  addPlantButton: {
    alignSelf: 'center',
    borderRadius: 12,
  },
  plantCard: {
    padding: 12,
    marginVertical:6,
    borderRadius: 8
  }
});
