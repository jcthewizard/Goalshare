// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Image,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList } from '../navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { Switch } from 'react-native-paper';
import { useGoals } from '../contexts/FirebaseGoalContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = BottomTabScreenProps<MainTabParamList, 'Camera'>;

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraFrozen, setIsCameraFrozen] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);  // Add this state for significant milestone toggle
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false); // Add state to track camera switching
  const isCancelledRef = useRef(false); // Use ref instead of state for reliable async checking
  const { goals, addTimelineItem } = useGoals();
  const cameraRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const captionInputRef = useRef<TextInput>(null);
  const goalPickerAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalOpacity = goalPickerAnim.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(10)
    .runOnJS(true)
    .onEnd(() => {
      try {
        if (!isCameraFrozen && cameraRef.current && !isSwitchingCamera) {
          setIsSwitchingCamera(true);
          setFacing(current => (current === 'back' ? 'front' : 'back'));
          setTimeout(() => {
            setIsSwitchingCamera(false);
          }, 500);
        }
      } catch (error) {
        console.log('Double tap error:', error);
        setIsSwitchingCamera(false);
      }
    });

  useEffect(() => {
    if (showGoalPicker) {
      Animated.timing(goalPickerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showGoalPicker]);

  const closeGoalPicker = () => {
    Animated.timing(goalPickerAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowGoalPicker(false);
    });
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCameraFrozen) {
      // Reset cancellation state
      isCancelledRef.current = false;

      // Immediately pause the camera preview for instant feedback
      try {
        await cameraRef.current.pausePreview();
      } catch (e) {
        // If pausePreview fails, continue anyway
        console.log('Could not pause preview:', e);
      }

      // Freeze the UI immediately
      setIsCameraFrozen(true);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
          skipProcessing: facing === 'front', // Prevent flipping for front camera
        });

        // Check if user cancelled during photo capture
        if (isCancelledRef.current) {
          // User clicked X, don't show the photo and return to camera mode
          console.log('Photo capture was cancelled by user');
          return;
        }

        if (photo && photo.uri) {
          setCapturedImage(photo.uri);
        } else {
          // Reset if photo capture failed
          setIsCameraFrozen(false);
          await cameraRef.current.resumePreview();
          console.log('Failed to capture photo - no photo data returned');
        }
      } catch (error) {
        console.error('Camera error:', error);
        setIsCameraFrozen(false);
        setCapturedImage(null);
        // Resume preview on error
        try {
          await cameraRef.current.resumePreview();
        } catch (e) {
          console.log('Could not resume preview:', e);
        }
        console.log('Failed to take picture:', error.message);
      }
    }
  };

  const pickImage = async () => {
    if (cameraRef.current) {
      try {
        // Pause preview to hold the frame
        await cameraRef.current.pausePreview();
      } catch (e) {
        console.log('Could not pause preview:', e);
      }
    }
    // Freeze UI to show the editing controls
    setIsCameraFrozen(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    } else {
      // User cancelled, so unfreeze and resume preview
      resetCapture();
    }
  };

  const handleAddToStory = async () => {
    if (!selectedGoalId) {
      Alert.alert('Select Goal', 'Please select a goal for this milestone');
      return;
    }

    try {
      await addTimelineItem(selectedGoalId, {
        title: caption || 'Photo milestone',
        description: '',
        imageUri: capturedImage,
        isMilestone: isMilestone  // Use the toggle state
      });

      resetCapture();
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error) {
      console.error('Failed to add to timeline:', error);
    }
  };

  const showCaptionInput = () => {
    setShowCaption(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        captionInputRef.current?.focus();
      }, 100);
    });
  };

  const hideCaptionInput = () => {
    Keyboard.dismiss();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCaption(false);
    });
  };

  const resetCapture = () => {
    isCancelledRef.current = true; // Mark as cancelled to prevent showing any photo currently being captured
    setCapturedImage(null);
    setIsCameraFrozen(false);
    setCaption('');
    setSelectedGoalId(null);
    setShowCaption(false);
    fadeAnim.setValue(0);

    // Resume camera preview
    if (cameraRef.current) {
      try {
        cameraRef.current.resumePreview();
      } catch (e) {
        console.log('Could not resume preview:', e);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <FontAwesome5 name="camera-retro" size={60} color="#999" />
          <Text style={styles.noPermissionText}>No access to camera</Text>
          <TouchableOpacity style={styles.grantPermissionButton} onPress={requestPermission}>
            <Text style={styles.grantPermissionText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Goal picker modal
  const renderGoalPicker = () => (
    <Modal
      visible={showGoalPicker}
      transparent
      animationType="none"
      onRequestClose={closeGoalPicker}
    >
      <TouchableWithoutFeedback onPress={closeGoalPicker}>
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.goalPickerContainer,
              { transform: [{ translateY: goalPickerAnim }] }
            ]}>
              <Text style={styles.goalPickerTitle}>Select Goal</Text>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalOption,
                    selectedGoalId === goal.id && styles.selectedGoalOption
                  ]}
                  onPress={() => {
                    setSelectedGoalId(goal.id);
                    closeGoalPicker();
                  }}
                >
                  <Text style={[
                    styles.goalOptionText,
                    selectedGoalId === goal.id && styles.selectedGoalOptionText
                  ]}>
                    {goal.title}
                  </Text>
                  {selectedGoalId === goal.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#35CAFC" />
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        animateShutter={false}
        mirror={facing === 'front'}
      />
      <GestureDetector gesture={doubleTap}>
        <View style={styles.cameraContainer}>
          {/* Captured image overlay - only show when we have the actual image */}
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.frozenImage} />
          )}

          {/* Camera controls - hide when frozen */}
          {!isCameraFrozen && (
            <>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                >
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                  <Ionicons name="images" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonOuter}>
                    <View style={styles.captureButtonInner} />
                  </View>
                </TouchableOpacity>

                <View style={{ width: 50 }} />
              </View>
            </>
          )}

          {/* Overlay controls - show when frozen */}
          {isCameraFrozen && (
            <>
              {/* Top bar with close and download */}
              <View style={styles.capturedTopBar}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={resetCapture}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                {/* Replace download button with significant milestone toggle */}
                <TouchableOpacity
                  style={[styles.iconButton, styles.milestoneToggle]}
                  onPress={() => setIsMilestone(!isMilestone)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={[styles.starButton, isMilestone && styles.starButtonActive]}>
                    <FontAwesome5
                      name="star"
                      size={20}
                      color={isMilestone ? "#FFD700" : "rgba(255,255,255,0.7)"}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Caption area */}
              {!showCaption && !caption ? (
                <TouchableOpacity
                  style={styles.captionTouchArea}
                  activeOpacity={1}
                  onPress={showCaptionInput}
                >
                  <View style={styles.captionHintContainer}>
                    <Text style={styles.captionHintText}>Tap to add caption</Text>
                  </View>
                </TouchableOpacity>
              ) : !showCaption && caption ? (
                <TouchableOpacity
                  style={styles.captionTouchArea}
                  activeOpacity={1}
                  onPress={showCaptionInput}
                >
                  <View style={styles.captionDisplayContainer}>
                    <Text style={styles.captionDisplayText}>{caption}</Text>
                    <Text style={styles.captionEditHint}>Tap to edit</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.captionTouchArea}
                  activeOpacity={1}
                  onPress={hideCaptionInput}
                >
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <Animated.View style={[styles.captionContainer, { opacity: fadeAnim }]}>
                      <TextInput
                        ref={captionInputRef}
                        style={styles.captionInput}
                        placeholder="Add caption..."
                        placeholderTextColor="#FFFFFF99"
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={100}
                        onSubmitEditing={hideCaptionInput}
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                      <Text style={styles.captionCounter}>{caption.length}/100</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </TouchableOpacity>
              )}

              {/* Bottom action bar */}
              <View style={styles.capturedBottomBar}>
                {/* Goal selector */}
                <TouchableOpacity
                  style={styles.goalSelectorCompact}
                  onPress={() => setShowGoalPicker(true)}
                >
                  <Text style={styles.goalSelectorCompactText}>
                    {selectedGoalId
                      ? goals.find(g => g.id === selectedGoalId)?.title.substring(0, 15) + '...'
                      : 'Goal'}
                  </Text>
                  <Ionicons name="chevron-up" size={14} color="white" />
                </TouchableOpacity>

                {/* Upload button - replacing story button */}
                <TouchableOpacity
                  style={[styles.uploadButton, !capturedImage && styles.disabledButton]}
                  onPress={handleAddToStory}
                  disabled={!capturedImage}
                >
                  <View style={[styles.uploadButtonCircle, !capturedImage && { backgroundColor: '#999' }]}>
                    <Ionicons name="arrow-up" size={24} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </GestureDetector>
      {renderGoalPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  cameraBottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 100, // Increased from 40 to account for tab bar
    paddingHorizontal: 20,
  },
  flipButton: {
    padding: 10,
  },
  galleryButton: {
    padding: 10,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureContainer: {
    flex: 1,
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  captionTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    paddingHorizontal: 20,
    maxWidth: SCREEN_WIDTH - 40,
  },
  captionInput: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 90, // Increased from 40 to account for tab bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  goalSelectorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#35CAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  noPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noPermissionText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  grantPermissionButton: {
    backgroundColor: '#35CAFC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  grantPermissionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  goalPickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  goalPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedGoalOption: {
    backgroundColor: '#E3F2FD',
  },
  goalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGoalOptionText: {
    fontWeight: '600',
    color: '#35CAFC',
  },
  tapToCaptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
  },
  tapToCaptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  captionDisplayContainer: {
    paddingHorizontal: 20,
    maxWidth: SCREEN_WIDTH - 40,
  },
  captionDisplayText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  frozenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    zIndex: 1,
  },
  capturedTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    padding: 10,
  },
  milestoneToggle: {
    padding: 10,
  },
  starButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  capturedBottomBar: {
    position: 'absolute',
    bottom: 90, // Increased from 40 to account for tab bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  goalSelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  goalSelectorCompactText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  captionHintContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    alignItems: 'center',
  },
  captionHintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  captionEditHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  captionCounter: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});