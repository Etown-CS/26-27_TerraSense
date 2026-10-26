import { StyleSheet, Modal, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Button from '@/components/ui/button';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>

        <ThemedText type="subtitle" style={styles.title}>Your Plants</ThemedText>
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
});
