import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Button from '@/components/ui/button';
import PlantDropdown from '@/components/ui/PlantDropdown';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [plantName, setPlantName] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [plants, setPlants] = useState<{ name: string; node: string; imageUri: string | null }[]>([]);

  const handleCancelModal = () => {
    setPlantName('');
    setSelectedNode(null);
    setImageUri(null);
    setModalVisible(false);
  }

  const handleAddModal = () => {
    const name = plantName.trim();
    if (!name) {
      Alert.alert('Plant name required', 'Enter a name before saving the plant.');
      return;
    }
    if (!selectedNode) {
      Alert.alert('Node required', 'Select a node before saving the plant.');
      return;
    }

    setPlants(currentPlants => [
      ...currentPlants,
      { name, node: selectedNode, imageUri },
    ]);
    handleCancelModal();
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Unable to select an image:', error);
      Alert.alert('Image selection failed', 'Please try selecting the image again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>

        <ThemedText type="subtitle" style={styles.title}>Your Plants</ThemedText>

        <ScrollView style={styles.plantList} contentContainerStyle={styles.plantListContent}>
          {plants.map((plant, index) => (
            <View key={index} style={styles.plantCard}>
              {plant.imageUri && (
                <Image source={{ uri: plant.imageUri }} style={styles.plantCardImage} />
              )}
              <View style={styles.plantDetails}>
                <ThemedText type="smallBold">{plant.name}</ThemedText>
                {plant.node && <ThemedText type="small">Node {plant.node}</ThemedText>}
              </View>
            </View>
          ))}
        </ScrollView>

        <Button
          title="Add Plant"
          onPress={() => {setModalVisible(true);}}
          style={styles.addPlantButton}
        />

        

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelModal}
        >
          <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a plant!</Text>
            
            <TextInput
              placeholder="Enter plant name"
              style={styles.input}
              value={plantName}
              onChangeText={setPlantName}
            />

            <PlantDropdown 
              style={styles.dropdown}
              pStyle={styles.placeholderStyle}
              stStyle={styles.selectedTextStyle}
              inStyle={styles.inputSearchStyle}
              iStyle={styles.iconStyle}
              value={selectedNode}
              onChange={setSelectedNode}
            />    
            
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageActions}>
                  <Button
                    title="Change image"
                    onPress={pickImage}
                    style={styles.imageButton}
                  />
                  <Button
                    title="Remove image"
                    onPress={() => setImageUri(null)}
                    style={styles.removeImageButton}
                  />
                </View>
              </View>
            ) : (
              <Button
                title="Add a Photo"
                onPress={pickImage}
                style={styles.addPhotoButton}
              />
            )}
            <View style={styles.modalFooter}>
                <Button
                    title="Cancel"
                    onPress={handleCancelModal}
                    style={styles.cancelButton}
                />
                <Button
                    title="Save"
                    onPress={handleAddModal}
                    style={styles.saveButton}
                />
            </View>
            
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
    justifyContent: 'flex-start',
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
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingTop: Spacing.six,
    paddingLeft: Spacing.three,
    paddingBottom: Spacing.three,
    fontFamily: 'Arial',
  },
  addPlantButton: {
    alignSelf: 'center',
    borderRadius: 12,
    marginTop: 'auto',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalFooter:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
  },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f6ef74',
  },
  plantList: {
    alignSelf: 'stretch',
    flex: 1,
  },
  plantListContent: {
    paddingBottom: Spacing.three,
  },
  plantCardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  plantDetails: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#a70000',
  },
  saveButton: {
    flex: 1,
  },
  input: {
    height: 40,
    width: '50%',
    borderColor: 'green',
    alignSelf: 'center',
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  photoLabel: {
    color: '#315b3c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageButton: {
    flex: 1,
    paddingHorizontal: 10,
  },
  addPhotoButton: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  removeImageButton: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#a70000',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f6ef',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  imagePreview: {
    width: 104,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#dce8da',
  },
  imageActions: {
    flex: 1,
    gap: 8,
    marginLeft: 12,
  },
  dropdown: {
    height: 40,
    width: '50%',
    alignSelf: 'center',
    borderColor: 'green',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  placeholderStyle: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
});
