import { Alert, Image, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Button from '@/components/ui/button';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

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
            <Text style={styles.modalTitle}>Add a plant!</Text>
            
            <TextInput
              placeholder="Enter plant name"
              style={styles.input}
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
                    onPress={() => setModalVisible(false)}
                    style={styles.cancelButton}
                />
                <Button
                    title="Save"
                    onPress={() => setModalVisible(false)}
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
    padding: 12,
    marginVertical:6,
    borderRadius: 8
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
    borderWidth: 1,
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
});
