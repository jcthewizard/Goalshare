// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Platform,
  Dimensions
} from 'react-native';
import { TextInput, Button, Title, useTheme, IconButton, Checkbox } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGoals } from '../contexts/FirebaseGoalContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'EditMilestone'>;

const EditMilestoneScreen: React.FC<Props> = ({ route, navigation }) => {
  const { goalId, milestoneId } = route.params;
  const { goals, updateMilestone } = useGoals();
  const goal = goals.find((g) => g.id === goalId);
  const milestone = goal?.milestones?.find((m) => m.id === milestoneId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const theme = useTheme();

  // Pre-populate form with existing milestone data
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title || '');
      setDescription(milestone.description || '');
      setImage(milestone.imageUri || null);
      setIsMilestone(milestone.isMilestone || false);
    }
  }, [milestone]);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  // Request photo library permissions
  const requestPhotoLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required to select photos');
      return false;
    }
    return true;
  };

  // Take a photo using camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to take photo');
      console.error(error);
    }
  };

  // Pick an image from photo library
  const pickImage = async () => {
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Photo Library Error', 'Failed to select image');
      console.error(error);
    }
  };

  // Save milestone
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your milestone');
      return;
    }

    if (!milestone || !goal) {
      Alert.alert('Error', 'Milestone or goal not found');
      return;
    }

    setLoading(true);

    try {
      await updateMilestone(goalId, milestoneId, {
        title,
        description,
        imageUri: image || undefined,
        isMilestone
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!goal || !milestone) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Milestone not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          color={theme.colors.primary}
        />
        <Text style={styles.headerTitle}>Edit Step</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Milestone Form */}
        <View style={styles.formContainer}>
          <TextInput
            label="Step Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            theme={{
              colors: {
                primary: theme.colors.primary,
                underlineColor: 'transparent'
              }
            }}
          />

          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
            theme={{
              colors: {
                primary: theme.colors.primary,
                underlineColor: 'transparent'
              }
            }}
          />

          <View style={styles.milestoneCheckboxContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.milestoneIconBackground}
            >
              <FontAwesome5 name="star" size={14} color="#FFF" />
            </LinearGradient>
            <View style={styles.milestoneInfoContainer}>
              <Text style={styles.milestoneLabel}>Mark as significant milestone</Text>
              <Text style={styles.milestoneSubtext}>
                Highlight this step with a special icon
              </Text>
            </View>
            <Checkbox
              status={isMilestone ? 'checked' : 'unchecked'}
              onPress={() => setIsMilestone(!isMilestone)}
              color="#FFD700"
            />
          </View>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Update Photo</Text>
          <Text style={styles.sectionSubtitle}>Capture your progress with a photo!</Text>

          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />

              {/* Image overlay with remove button */}
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoOptionsContainer}>
              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={takePhoto}
              >
                <LinearGradient
                  colors={['#FF5F5F', '#FF8C8C']}
                  style={styles.photoOptionGradient}
                >
                  <FontAwesome5 name="camera" size={24} color="#FFF" />
                  <Text style={styles.photoOptionText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={pickImage}
              >
                <LinearGradient
                  colors={['#35CAFC', '#70D6FF']}
                  style={styles.photoOptionGradient}
                >
                  <FontAwesome5 name="images" size={24} color="#FFF" />
                  <Text style={styles.photoOptionText}>Choose from Library</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Updating...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Update Step</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    height: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  photoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  photoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoOptionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoOptionGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    flex: 1,
  },
  photoOptionText: {
    color: 'white',
    marginTop: 12,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagePreview: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 12,
  },
  removeImageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#FF5F5F',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  milestoneCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  milestoneIconBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  milestoneInfoContainer: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  milestoneSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 40,
    color: '#666',
  },
});

export default EditMilestoneScreen;