import { FlatList, StyleSheet, Modal, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Button from '@/components/ui/button';

import { collection, getDocs } from 'firebase/firestore';
import { db, realtimeDb } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  
  type Plant = {
    plant_id: string;
    plant_name: string;
    ideal_humidity_pct: number;
    ideal_light_lvl: number;
    ideal_temp: number;
    ideal_moisture_lvl: number;
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
  const [readoutErrors, setReadoutErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nodeIds = ['node1', 'node2'] as const;

    const unsubscribe = nodeIds.map((nodeId) =>
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
      )
    );

    return () => unsubscribe.forEach((stop) => stop());
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPlants() {
      try {
        const snapshot = await getDocs(collection(db, 'plants'));
        const results = snapshot.docs.map((plantDoc) => ({
          ...plantDoc.data(),
          plant_id: plantDoc.id,
        })) as Plant[];

        if (active) setPlants(results);
      } catch (err) {
        if (active) setError("Could not load plants");
        console.error("Error loading plants:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlants();
    return () => {
      active = false;
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>

        <ThemedText type="subtitle" style={styles.title}>Your Plants</ThemedText>

        {(['node1', 'node2'] as const).map((nodeId) => {
          const readout = readouts[nodeId];

          return (
            <View key={nodeId} style={styles.plantCard}>
              <ThemedText type="smallBold">{nodeId}</ThemedText>
              {readoutErrors[nodeId] ? (
                <ThemedText>Could not load readout: {readoutErrors[nodeId]}</ThemedText>
              ) : readout ? (
                <ThemedText>
                  Humidity: {readout.humidity}% · Light: {readout.lux} lux ·
                  Temperature: {readout.temp_c} °C · Soil moisture: {readout.soil_pct}%
                </ThemedText>
              ) : (
                <ThemedText>Waiting for readout...</ThemedText>
              )}
            </View>
          );
        })}
        
        {loading ? (
          <ThemedText>Loading Plants...</ThemedText>
        ) : error ? (
          <ThemedText>{error}</ThemedText>
        ) : (
          <FlatList
            data={plants}
            keyExtractor={(plant) => plant.plant_id}
            ListEmptyComponent={<ThemedText>No plants</ThemedText>}
            renderItem={({ item }) => (
              <View style={styles.plantCard}>
                <ThemedText type="smallBold">{item.plant_name}</ThemedText>
                <ThemedText>
                  Ideal humidity: {item.ideal_humidity_pct}% · Light: {item.ideal_light_lvl} lumens ·
                  Temperature: {item.ideal_temp} C · Soil moisture: {item.ideal_moisture_lvl}%
                </ThemedText>
              </View>
            )}
            />
        )
      }

        <Button
          title="Add Plant"
          onPress={() => {setModalVisible(true);}}
          style={styles.addPlantButton}
        />

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text>Add a plant</Text>
            <Button
              title="Close"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
        </Modal>



          
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    padding: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  plantCard: {
    padding: 12,
    marginVertical:6,
    borderRadius: 8
  }
});
