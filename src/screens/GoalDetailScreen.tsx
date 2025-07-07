// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  Easing,
  Alert
} from 'react-native';
import { Card, Title, Paragraph, Checkbox, useTheme, IconButton } from 'react-native-paper';
import { useGoals } from '../contexts/GoalContext';
import { ThemeColors } from '../types';

import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCROLL_THRESHOLD = 400; // The scroll distance where opacity transition completes

type Props = StackScreenProps<RootStackParamList, 'GoalDetail'>;

const GoalDetailScreen: React.FC<Props> = ({ route, navigation }: Props): React.ReactElement => {
  const { goalId } = route.params;
  const { goalState, getGoals, deleteGoal, deleteMilestone, deleteTimelineItem, updateGoal, addTimelineItem } = useGoals();
  const { user } = useAuth();
  const [goal, setGoal] = useState(goalState.goals.find((g) => g.id === goalId) || null);
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: Animated.Value}>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    primary: '#FF5F5F',
    secondary: '#FF8C8C',
    accent: '#FFD700'
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isScreenSliding, setIsScreenSliding] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const colorPickerAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;
  const pageTranslateX = useRef(new Animated.Value(0)).current;

  // Create refs for milestone animations - moved outside the render
  const milestoneAnimRefs = useRef({});

  // Pre-create all the animation values for each milestone
  useEffect(() => {
    if (goal && goal.milestones) {
      // Initialize animation refs for all milestones
      const milestonesAnimations = {};
      goal.milestones.forEach((milestone, index) => {
        if (!milestoneAnimRefs.current[milestone.id]) {
          milestonesAnimations[milestone.id] = {
            fade: new Animated.Value(0),
            translateY: new Animated.Value(50)
          };
        }
      });
      milestoneAnimRefs.current = {...milestoneAnimRefs.current, ...milestonesAnimations};

      // Start the animations
      goal.milestones.forEach((milestone, index) => {
        const delay = 300 + (index * 100);
        const animations = milestoneAnimRefs.current[milestone.id];

        if (animations) {
          Animated.parallel([
            Animated.timing(animations.fade, {
              toValue: 1,
              duration: 500,
              delay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(animations.translateY, {
              toValue: 0,
              duration: 700,
              delay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]).start();
        }
      });
    }
  }, [goal?.milestones]);

  // Use this effect only once to fetch goals if needed
  useEffect(() => {
    if (goalState.goals.length === 0) {
      getGoals();
    }
  }, []); // Empty dependency array so it only runs once

  // Update goal when goalState changes
  useEffect(() => {
    const updatedGoal = goalState.goals.find((g) => g.id === goalId) || null;
    setGoal(updatedGoal);
  }, [goalState.goals, goalId]);

  // Initialize animated values for milestones
  useEffect(() => {
    if (goal) {
      const newAnimatedValues: {[key: string]: Animated.Value} = {};
      goal.milestones.forEach(milestone => {
        newAnimatedValues[milestone.id] = new Animated.Value(0);
      });
      setAnimatedValues(newAnimatedValues);
    }
  }, [goal?.milestones]);

  // Use this effect to animate elements when screen loads
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const [stepsToComplete, setStepsToComplete] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepBeingCompleted, setStepBeingCompleted] = useState(null);
  const [stepAnimations, setStepAnimations] = useState<{[key: string]: Animated.Value}>({});
  const [animatingSteps, setAnimatingSteps] = useState<Set<string>>(new Set());
  const stepTranslateY = useRef(new Animated.Value(0)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const stepScale = useRef(new Animated.Value(1)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;



  // Delete handlers
  const handleDeleteGoal = (): void => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteMilestone = (milestoneId: string, milestoneTitle: string): void => {
    Alert.alert(
      "Delete Step",
      `Are you sure you want to delete "${milestoneTitle}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMilestone(goal.id, milestoneId);
            } catch (error) {
              Alert.alert("Error", "Failed to delete step. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Update steps when goal changes
  useEffect(() => {
    if (goal) {
      // All milestones go to todo list
      setStepsToComplete(goal.milestones || []);
      // Timeline items are separate (for now, empty until we implement timeline properly)
      setCompletedSteps(goal.timeline || []);
    }
  }, [goal]);

  // Calculate section opacities based on scroll position
  const stepsOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0.2],
    extrapolate: 'clamp'
  });

  const timelineOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0.4, 1],
    extrapolate: 'clamp'
  });

  const handleCompleteMilestone = async (milestoneId: string): void => {
    if (!goal) return;
    
    // Find the milestone
    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    try {
      // Add to timeline
      await addTimelineItem(goal.id, {
        title: milestone.title,
        description: milestone.description,
        imageUri: milestone.imageUri,
        isMilestone: milestone.isMilestone
      });
      
      // Remove from milestones
      await deleteMilestone(goal.id, milestoneId);
      
      // Refresh the goal
      await getGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to move to timeline');
    }
  };

  // Add this after your other useRefs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Add this useEffect for the pulsing animation
  useEffect(() => {
    // Create a loop animation for the pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // Add this useEffect for the shimmer animation
  useEffect(() => {
    // Create a loop animation for the shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  // Toggle color picker
  const toggleColorPicker = () => {
    const toValue = showColorPicker ? 0 : 1;
    Animated.spring(colorPickerAnim, {
      toValue,
      tension: 40,
      friction: 7,
      useNativeDriver: true
    }).start();
    setShowColorPicker(!showColorPicker);
  };

  // Change theme colors
  const changeThemeColors = async (primary: string, secondary: string, accent: string) => {
    console.log('🎨 Changing theme colors:', { primary, secondary, accent });
    
    const newThemeColors = {
      primary,
      secondary,
      accent
    };
    
    // Update state immediately for instant UI feedback
    setThemeColors(newThemeColors);
    console.log('🎨 Theme colors updated in state:', newThemeColors);
    toggleColorPicker();
    
    // For now, just keep it in local state until database issues are resolved
    // TODO: Re-enable database saving once backend is stable
    /*
    if (goal) {
      try {
        console.log('💾 Saving theme colors to database for goal:', goal.id);
        updateGoal(goal.id, { themeColors: newThemeColors }).then(() => {
          console.log('✅ Theme colors saved successfully');
        }).catch((error) => {
          console.error('❌ Error saving theme colors:', error);
        });
      } catch (error) {
        console.error('❌ Error saving theme colors:', error);
      }
    }
    */
  };

  // NEW: function to handle page transition
  const navigateToPage = (pageIndex) => {
    if (pageIndex === currentPage) return;

    // Animate to the selected page
    Animated.spring(pageTranslateX, {
      toValue: pageIndex === 0 ? 0 : -SCREEN_WIDTH,
      tension: 70,
      friction: 12,
      useNativeDriver: true
    }).start();

    setCurrentPage(pageIndex);
  };

  // Close dropdown with animation
  const closeDropdown = () => {
    if (activeDropdown) {
      Animated.spring(dropdownAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        setActiveDropdown(null);
      });
    }
  };

  // Toggle dropdown for milestone actions
  const toggleDropdown = (milestoneId: string) => {
    if (activeDropdown === milestoneId) {
      // Close dropdown with spring animation
      closeDropdown();
    } else {
      // Close any open dropdown first
      if (activeDropdown) {
        setActiveDropdown(null);
        dropdownAnim.setValue(0);
      }
      // Open dropdown with spring animation
      setActiveDropdown(milestoneId);
      Animated.spring(dropdownAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Auto-close dropdown after 10 seconds
      setTimeout(() => {
        if (activeDropdown === milestoneId) {
          closeDropdown();
        }
      }, 10000);
    }
  };

  // Create a pan gesture handler for swiping between pages
  const panGesture = Gesture.Pan()
    .runOnJS(true)  // Add this to ensure the callbacks run on the JS thread
    .onTouchesDown((e) => {
      // Only activate page gesture if NOT starting from the left edge (to avoid conflicts with screen slide gesture)
      // AND if screen is not currently being slid
      const startX = e.changedTouches[0].x;
      if (startX <= 50 || isScreenSliding) {
        return false; // Don't handle page switching if starting from left edge or screen is sliding
      }
      return true;
    })
    .onUpdate((e) => {
      // Don't update page position if screen is sliding
      if (isScreenSliding) {
        return;
      }
      
      // During active gesture, directly follow finger position
      const dragX = e.translationX;

      // Calculate the new position, constrained to prevent dragging beyond page boundaries
      let newPosition = currentPage === 0 ?
        Math.max(-SCREEN_WIDTH, Math.min(0, dragX)) : // If on first page, can only drag left (negative)
        Math.max(-SCREEN_WIDTH, Math.min(0, -SCREEN_WIDTH + dragX)); // If on second page, can only drag right (positive)

      // Update the position in real-time
      pageTranslateX.setValue(newPosition);
    })
    .onEnd((e) => {
      // Don't process page switching if screen is sliding
      if (isScreenSliding) {
        return;
      }
      
      // When gesture ends, decide whether to snap to next page or return to current
      const dragX = e.translationX;
      const dragVelocity = e.velocityX;

      // Determine threshold - either we've dragged more than halfway, or with sufficient velocity
      const hasMovedOverThreshold = Math.abs(dragX) > SCREEN_WIDTH / 3;
      const hasMovedWithVelocity = Math.abs(dragVelocity) > 100;

      let targetPage = currentPage;

      if (currentPage === 0) {
        // If on first page and dragged left significantly, move to next page
        if ((dragX < 0 && hasMovedOverThreshold) || (dragX < 0 && hasMovedWithVelocity)) {
          targetPage = 1;
        }
      } else {
        // If on second page and dragged right significantly, move to previous page
        if ((dragX > 0 && hasMovedOverThreshold) || (dragX > 0 && hasMovedWithVelocity)) {
          targetPage = 0;
        }
      }

      // Animate to the target page
      Animated.spring(pageTranslateX, {
        toValue: targetPage === 0 ? 0 : -SCREEN_WIDTH,
        tension: 70,
        friction: 12,
        useNativeDriver: true
      }).start();

      setCurrentPage(targetPage);
    });

  // Animation value for screen slide gesture
  const screenTranslateX = useRef(new Animated.Value(0)).current;

  // Track if the gesture should be allowed based on start position
  const gestureStartPosition = useRef({ x: 0, shouldAllow: false });

  // Create a pan gesture handler for screen slide dismissal
  // This allows users to drag from anywhere along the left edge to dismiss the screen
  const screenSlideGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX(5) // Gesture becomes active after 5 points of horizontal movement
    .failOffsetY([-100, 100]) // Allow more vertical movement before failing the gesture
    .shouldCancelWhenOutside(false) // Don't cancel when finger moves outside
    .onBegin((e) => {
      // Store the start position for filtering
      gestureStartPosition.current = {
        x: e.x,
        shouldAllow: e.x <= 50 // Only allow if starting within 50 pixels of left edge (removed y restriction)
      };
      
      // Set screen sliding state if gesture is allowed
      if (gestureStartPosition.current.shouldAllow) {
        setIsScreenSliding(true);
      }
    })
    .onUpdate((e) => {
      // Only respond if the gesture started from the correct area and is a rightward swipe
      if (gestureStartPosition.current.shouldAllow && e.translationX > 0) {
        // Update screen position in real-time, with some resistance
        const translateX = Math.min(e.translationX * 1, SCREEN_WIDTH);
        screenTranslateX.setValue(translateX);
        
        // Add subtle opacity effect based on drag progress
        const progress = Math.min(translateX / (SCREEN_WIDTH * 0.6), 1);
        fadeAnim.setValue(1 - progress * 0.2);
      }
    })
    .onEnd((e) => {
      // Only process end if the gesture was allowed
      if (!gestureStartPosition.current.shouldAllow) {
        return;
      }

      const dragX = e.translationX;
      const dragVelocity = e.velocityX;
      
      // Threshold for dismissing the screen (40% of screen width or fast velocity)
      const dismissThreshold = SCREEN_WIDTH * 0.4;
      const shouldDismiss = (dragX > dismissThreshold) || (dragVelocity > 800);

      if (shouldDismiss) {
        // Animate screen out to the right and navigate back
        Animated.parallel([
          Animated.timing(screenTranslateX, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start(() => {
          navigation.goBack();
        });
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(screenTranslateX, {
            toValue: 0,
            tension: 300,
            friction: 30,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start(() => {
          // Reset screen sliding state when animation completes
          setIsScreenSliding(false);
        });
      }
      
      // Reset screen sliding state when gesture ends (for cases where animation doesn't run)
      if (!gestureStartPosition.current.shouldAllow) {
        setIsScreenSliding(false);
      }
    })
    .onFinalize(() => {
      // Always reset screen sliding state when gesture is finalized
      setIsScreenSliding(false);
    });

  // Complete Goal handler
  const handleCompleteGoal = (): void => {
    Alert.alert(
      "Complete Goal",
      `Are you sure you want to mark "${goal.title}" as completed? This will celebrate your achievement!`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            try {
              await updateGoal(goal.id, { isCompleted: true, completedDate: new Date() });
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to complete goal. Please try again.");
            }
          }
        }
      ]
    );
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Goal not found</Text>
      </View>
    );
  }

  // Sort milestones by creation date (newest first)
  const sortedMilestones = goal.milestones.slice();

  // Calculate progress percentage based on timeline items instead of completed milestones
  const completedMilestones = goal.timeline?.length || 0;
  const totalMilestones = goal.milestones.length + (goal.timeline?.length || 0);
  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;



  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor: 'transparent' }, // Fully transparent to show HomeScreen behind
      { transform: [{ translateX: screenTranslateX }] }
    ]}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={Gesture.Simultaneous(screenSlideGesture, panGesture)}>
        <SafeAreaView style={[styles.screenContainer, { backgroundColor: theme.colors.background, marginLeft: 0, marginRight: 0 }]}>
          {/* Header with back button */}
          <View style={[styles.header, { paddingHorizontal: 16, marginHorizontal: 0 }]}>
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="arrow-left" size={18} color={theme.colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} /> {/* Spacer */}

            <View style={styles.colorPickerContainer}>
              {/* Color options */}
              <Animated.View style={[
                styles.colorOptions,
                {
                  opacity: colorPickerAnim,
                  transform: [{
                    translateX: colorPickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  },
                  {
                    scale: colorPickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }]
                }
              ]}>
                {/* Red theme */}
                <TouchableOpacity
                  style={[styles.colorOption, { backgroundColor: '#FF5F5F' }]}
                  onPress={() => changeThemeColors('#FF5F5F', '#FF8C8C', '#FFD700')}
                />
                {/* Blue theme */}
                <TouchableOpacity
                  style={[styles.colorOption, { backgroundColor: '#35CAFC' }]}
                  onPress={() => changeThemeColors('#35CAFC', '#70D6FF', '#FFD700')}
                />
                {/* Purple theme */}
                <TouchableOpacity
                  style={[styles.colorOption, { backgroundColor: '#9C27B0' }]}
                  onPress={() => changeThemeColors('#9C27B0', '#BA68C8', '#E1BEE7')}
                />
                {/* Green theme */}
                <TouchableOpacity
                  style={[styles.colorOption, { backgroundColor: '#4CAF50' }]}
                  onPress={() => changeThemeColors('#4CAF50', '#81C784', '#C8E6C9')}
                />
                {/* Orange theme */}
                <TouchableOpacity
                  style={[styles.colorOption, { backgroundColor: '#FFA500' }]}
                  onPress={() => changeThemeColors('#FF9800', '#FFCC80', '#FFE082')}
                />
              </Animated.View>

              {/* Color wheel button */}
              <TouchableOpacity
                style={[
                  styles.headerActionButton,
                  showColorPicker ? {backgroundColor: '#f0f0f0'} : null
                ]}
                onPress={toggleColorPicker}
              >
                <FontAwesome5 name="palette" size={18} color={showColorPicker ? themeColors.primary : "#777"} />
              </TouchableOpacity>
            </View>

            {/* Complete Goal Button */}
            <TouchableOpacity
              style={[styles.headerActionButton, { marginLeft: 8, backgroundColor: '#4CD964' }]}
              onPress={handleCompleteGoal}
            >
              <FontAwesome5 name="check" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Goal Card with Gradient - always visible at the top */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: cardTranslateY }],
            marginTop: 0,
            marginHorizontal: 16,
          }}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goalCard}
            >
              <View style={styles.goalCardContent}>
                <View style={styles.goalCardHeader}>
                  <Text style={styles.goalCardTitle}>{goal.title}</Text>
                  <View style={styles.dateContainer}>
                    <FontAwesome5 name="calendar-alt" size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.goalInfoText}>
                      {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No target date'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>
                    {totalMilestones - completedMilestones} steps left
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>





          {/* Swipeable Content Container */}
            <Animated.View style={{ flex: 1 }}>
              <Animated.View style={[styles.pagesContainer, {
                width: SCREEN_WIDTH * 2,
                transform: [{ translateX: pageTranslateX }]
              }]}>
                {/* Timeline Page (now first) */}
                <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                  <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    alwaysBounceVertical={false}
                    onScroll={() => closeDropdown()}
                    scrollEventThrottle={100}
                  >
                  <View style={styles.timelineSection}>
                    <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Timeline</Text>

                    {completedSteps.length === 0 ? (
                      <Text style={styles.emptyStateText}>Complete steps to see your progress here</Text>
                    ) : (
                      <View style={styles.timelineContainer}>
                        {completedSteps.map((milestone, index) => {
                          // Get pre-created animation values for this milestone
                          const animations = milestoneAnimRefs.current[milestone.id] || {
                            fade: new Animated.Value(1),
                            translateY: new Animated.Value(0)
                          };

                          return (
                            <Animated.View key={milestone.id}
                              style={[
                                styles.timelineItem,
                                {
                                  opacity: animations.fade,
                                  transform: [{ translateY: animations.translateY }]
                                }
                              ]}
                            >
                              {/* Timeline connector - show only if not the last item */}
                              {index < completedSteps.length - 1 ? (
                                <View style={styles.timelineConnector} />
                              ) : null}

                              {/* Milestone node */}
                              <Animated.View style={[
                                styles.timelineNode,
                                milestone.isMilestone ? styles.milestoneTimelineNode : null,
                                {
                                  backgroundColor: milestone.isMilestone ? themeColors.accent : themeColors.primary
                                }
                              ]}>
                                {milestone.isMilestone ? (
                                  <Animated.View style={[
                                    styles.shimmerOverlay,
                                    {
                                      opacity: shimmerAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.1, 0.3, 0.1]
                                      })
                                    }
                                  ]} />
                                ) : null}
                                {milestone.isMilestone ? (
                                  <FontAwesome5 name="star" size={16} color={themeColors.accent} />
                                ) : (
                                  <FontAwesome5 name="check" size={14} color="#FFF" />
                                )}
                              </Animated.View>

                              {/* Milestone content */}
                              <Card style={[
                                styles.milestoneCard,
                                milestone.isMilestone ? [
                                  styles.milestoneTimelineCard,
                                  { borderLeftColor: themeColors.accent }
                                ] : null
                              ]}>
                                {milestone.isMilestone ? (
                                  <>
                                                        <LinearGradient
                        colors={[themeColors.accent + '20', '#FFFCF3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.milestoneCardGradient}
                      />
                                      <Animated.View
                                        style={[
                                          styles.milestoneFireBorder,
                                          { transform: [{ scale: pulseAnim }] }
                                        ]}
                                      >
                                        <LinearGradient
                                          colors={[themeColors.primary, themeColors.secondary, themeColors.accent]}
                                          start={{ x: 0, y: 0 }}
                                          end={{ x: 0, y: 1 }}
                                          style={styles.fireGradient}
                                        />
                                      </Animated.View>

                                      {/* Sparkle effects for milestone */}
                                      <View style={styles.sparkleContainer}>
                                        <Animated.View style={[
                                          styles.sparkle,
                                          styles.sparkleTopRight,
                                          {
                                            opacity: shimmerAnim.interpolate({
                                              inputRange: [0, 0.3, 0.6, 1],
                                              outputRange: [0, 1, 0.5, 0]
                                            }),
                                            transform: [{
                                              scale: shimmerAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0.7, 1.2, 0.7]
                                              })
                                            }]
                                          }
                                        ]}>
                                          <FontAwesome5 name="sparkles" size={16} color={themeColors.accent} />
                                        </Animated.View>

                                        <Animated.View style={[
                                          styles.sparkle,
                                          styles.sparkleBottomLeft,
                                          {
                                            opacity: shimmerAnim.interpolate({
                                              inputRange: [0, 0.5, 0.8, 1],
                                              outputRange: [0, 0.5, 1, 0]
                                            }),
                                            transform: [{
                                              scale: shimmerAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0.8, 1.1, 0.8]
                                              })
                                            }]
                                          }
                                        ]}>
                                          <FontAwesome5 name="star" size={12} color={themeColors.accent} />
                                        </Animated.View>
                                      </View>
                                    </>
                                ) : null}
                                <Card.Content>
                                  <View style={styles.milestoneHeader}>
                                    <Title style={[
                                      styles.milestoneTitle,
                                      milestone.isMilestone ? { color: themeColors.accent } : null
                                    ]}>
                                      {milestone.title}
                                    </Title>
                                    <View style={styles.milestoneActions}>
                                      <View style={styles.dropdownContainer}>
                                        <TouchableOpacity
                                          style={styles.dropdownButton}
                                          onPress={() => toggleDropdown(milestone.id)}
                                        >
                                          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                                        </TouchableOpacity>
                                        
                                        {activeDropdown === milestone.id && (
                                          <Animated.View style={[
                                            styles.dropdownMenu,
                                            {
                                              opacity: dropdownAnim,
                                              transform: [
                                                {
                                                  scale: dropdownAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.3, 1],
                                                  })
                                                },
                                                {
                                                  translateY: dropdownAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [-5, 0],
                                                  })
                                                }
                                              ]
                                            }
                                          ]}>
                                            {/* Remove the edit milestone option */}
                                            
                                            <TouchableOpacity
                                              style={styles.dropdownOption}
                                              onPress={() => {
                                                // Remove from timeline
                                                deleteTimelineItem(goal.id, milestone.id);
                                                closeDropdown();
                                              }}
                                            >
                                              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                              <Text style={[styles.dropdownOptionText, { color: '#FF3B30' }]}>Remove from Timeline</Text>
                                            </TouchableOpacity>
                                          </Animated.View>
                                        )}
                                      </View>
                                    </View>
                                  </View>

                                  {milestone.description ? (
                                    <Paragraph style={styles.milestoneDescription}>
                                      {milestone.description}
                                    </Paragraph>
                                  ) : null}

                                  {/* Display milestone image if available */}
                                  {milestone.imageUri ? (
                                    <View style={styles.imageContainer}>
                                      <Image
                                        source={{ uri: milestone.imageUri }}
                                        style={styles.milestoneImage}
                                      />
                                    </View>
                                  ) : null}

                                  {/* Completion date could be added here */}
                                  <Text style={styles.completedDate}>
                                    Added {format(new Date(milestone.createdAt || new Date()), 'MMM d, yyyy')}
                                  </Text>
                                </Card.Content>
                              </Card>
                            </Animated.View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  </ScrollView>
                </View>

                {/* Steps/Todo Page (now second) */}
                <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.stepsSection}>
                    <Text style={styles.sectionTitle}>Todo List</Text>
                  {stepsToComplete.length === 0 ? (
                    <View>
                      <Text style={styles.emptyStateText}>All steps completed! 🎉</Text>
                      <TouchableOpacity
                        style={styles.addStepButton}
                        onPress={() => navigation.navigate('AddMilestone', { goalId: goal.id })}
                      >
                        <Ionicons name="add" size={16} color="#35CAFC" />
                        <Text style={styles.addStepText}>Add New Step</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.simpleStepsContainer}>
                      {stepsToComplete.map((step, index) => (
                        <Animated.View 
                          key={step.id}
                          style={{
                            opacity: stepAnimations[step.id] || 1,
                            transform: [
                              {
                                scale: stepAnimations[step.id]?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1],
                                }) || 1
                              },
                              {
                                translateY: stepAnimations[step.id]?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0],
                                }) || 0
                              }
                            ]
                          }}
                        >
                          <TouchableOpacity
                            style={styles.stepContainer}
                            onPress={() => handleCompleteMilestone(step.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.stepRow}>
                              {/* Checkbox */}
                              <TouchableOpacity
                                style={[
                                  styles.checkbox,
                                  step.isMilestone ? styles.milestoneCheckbox : styles.stepCheckbox,
                                ]}
                                onPress={() => handleCompleteMilestone(step.id)}
                                activeOpacity={0.7}
                              >
                                {/* Empty checkbox for todo items */}
                              </TouchableOpacity>

                              {/* Step Content */}
                              <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                {step.description ? (
                                  <Text style={styles.stepDescription}>{step.description}</Text>
                                ) : null}
                              </View>

                              {/* Milestone Badge */}
                              {step.isMilestone ? (
                                <View style={styles.milestoneBadge}>
                                  <Ionicons name="star" size={16} color="#FFD700" />
                                </View>
                              ) : null}

                              {/* Delete Button */}
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteMilestone(step.id, step.title)}
                                activeOpacity={0.7}
                              >
                                <FontAwesome5 name="trash" size={16} color="#FF3B30" />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      ))}
                      
                      {/* Add Step Button */}
                      <TouchableOpacity
                        style={styles.addStepButton}
                        onPress={() => navigation.navigate('AddMilestone', { goalId: goal.id })}
                      >
                        <Ionicons name="add" size={16} color="#35CAFC" />
                        <Text style={styles.addStepText}>Add New Step</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                  </ScrollView>
                </View>
            </Animated.View>

            {/* Page indicator dots */}
            <View style={styles.pageDotsContainer}>
              <View style={[
                styles.pageDot, 
                currentPage === 0 ? styles.activePageDot : null, 
                { backgroundColor: currentPage === 0 ? themeColors.primary : '#e0e0e0' }
              ]} />
              <View style={[
                styles.pageDot, 
                currentPage === 1 ? styles.activePageDot : null, 
                { backgroundColor: currentPage === 1 ? themeColors.primary : '#e0e0e0' }
              ]} />
            </View>
          </Animated.View>
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  colorOptions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 35,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    width: 210,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 4,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
    flexGrow: 1,
  },
  notFoundText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 40,
    color: '#666',
  },
  goalCard: {
    borderRadius: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalCardContent: {
    padding: 16,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalInfoText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 0,
  },
  progressLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
  },
  milestonesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  timelineContainer: {
    marginLeft: 8,
    paddingBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 30,
    width: 2,
    height: '100%',
    backgroundColor: '#ddd',
    zIndex: 1,
  },
  timelineNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    zIndex: 2,
  },
  timelineNodeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  milestoneCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneTitle: {
    flex: 1,
    fontSize: 18,
    marginRight: 10,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#35CAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    alignSelf: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CD964',
    borderColor: '#4CD964',
  },
  milestoneDescription: {
    marginBottom: 10,
    color: '#666',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 5,
  },
  milestoneImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  addMilestoneNodePlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  addMilestoneCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addMilestoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    height: 60,
  },
  addMilestoneText: {
    fontSize: 16,
    color: '#666',
  },
  stepsSection: {
    marginBottom: 0,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
  },
  timelineSection: {
    marginBottom: 0,
    borderTopWidth: 0,
    borderTopColor: '#f0f0f0',
    paddingTop: 0,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
  },
  stepCard: {
    marginTop: 0,
    borderRadius: 10,
    width: '105%',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepCardActive: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    transform: [{ scale: 1.02 }],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    height: 30,
    paddingVertical: 2,
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    alignSelf: 'center',
    textAlignVertical: 'center',
    textAlign: 'left',
    lineHeight: 20,
    paddingVertical: 0,
    marginVertical: 0,
  },
  stepDescription: {
    marginBottom: 4,
    color: '#666',
    paddingLeft: 24,
    lineHeight: 18,
    fontSize: 14,
  },
  dragHandle: {
    width: 24,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 20,
    fontSize: 16,
  },
  stepImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  completedDate: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
  stepsListContainer: {
    position: 'relative',
    paddingBottom: 80,
    marginTop: -10,
    width: '100%',
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#35CAFC',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addStepButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  addStepButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  addStepFAB: {
    position: 'absolute',
    bottom: 20,
    right: 5,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  addStepFABGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCardContent: {
    padding: 8,
    paddingVertical: 6,
  },
  fullWidth: {
    width: '100%',
  },
  draggableListContent: {
    width: '100%',
    paddingHorizontal: 6,
    paddingTop: 3,
    paddingBottom: 0,
  },
  milestoneCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
  milestoneTimelineCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    borderRadius: 16,
    overflow: 'visible',
  },
  milestoneTimelineTitle: {
    color: '#B8860B',
    fontWeight: '700',
  },
  milestoneFireBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 18,
    overflow: 'hidden',
    zIndex: -1,
  },
  fireGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  milestoneTimelineNode: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 3,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTopRight: {
    top: -10,
    right: -10,
  },
  sparkleBottomLeft: {
    bottom: -8,
    left: -8,
  },
  milestoneCheckboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#35CAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    alignSelf: 'center',
  },
  milestoneIcon: {
    marginRight: 4,
  },
  pageDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  pageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activePageDot: {
    backgroundColor: '#35CAFC',
  },
  pagesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    flex: 1,
    position: 'relative',
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  milestoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
    minWidth: 160,
    zIndex: 1001,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dropdownOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    marginVertical: 4,
  },

  simpleStepsContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepCheckbox: {
    borderColor: '#35CAFC',
    backgroundColor: 'white',
  },
  milestoneCheckbox: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFDF6',
  },
  checkboxCompleted: {
    backgroundColor: '#35CAFC',
    borderColor: '#35CAFC',
  },
  stepContent: {
    flex: 1,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  milestoneBadge: {
    marginRight: 12,
    padding: 4,
  },
  addStepText: {
    color: '#35CAFC',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

});

export default GoalDetailScreen;