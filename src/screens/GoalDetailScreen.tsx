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
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCROLL_THRESHOLD = 400; // The scroll distance where opacity transition completes

type Props = StackScreenProps<RootStackParamList, 'GoalDetail'>;

const GoalDetailScreen: React.FC<Props> = ({ route, navigation }: Props): React.ReactElement => {
  const { goalId } = route.params;
  const { goalState, fetchGoals, completeMilestone } = useGoals();
  const { user } = useAuth();
  const [goal, setGoal] = useState(goalState.goals.find((g) => g.id === goalId) || null);
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: Animated.Value}>({});
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

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
      fetchGoals();
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
        newAnimatedValues[milestone.id] = new Animated.Value(milestone.completed ? 1 : 0);
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
  const stepTranslateY = useRef(new Animated.Value(0)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const stepScale = useRef(new Animated.Value(1)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;

  // Get social context for sharing
  const { addMilestoneCompletionUpdate } = useSocial();

  // Update steps when goal changes
  useEffect(() => {
    if (goal) {
      const incomplete = goal.milestones.filter(m => !m.completed);
      const completed = goal.milestones.filter(m => m.completed);
      setStepsToComplete(incomplete);
      setCompletedSteps(completed);
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

  const handleCompleteMilestone = (milestoneId: string, isCompleted: boolean): void => {
    if (!goal) return;

    if (!isCompleted) {
      // Find the step being completed
      const step = stepsToComplete.find(s => s.id === milestoneId);
      setStepBeingCompleted(step);

      // Get the position of the timeline section for animation target
      const timelineSectionY = 300; // Default value, adjust based on layout

      // Animate the step moving to timeline
      Animated.sequence([
        // Initial feedback - pulse effect
        Animated.timing(stepScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Move to timeline with a nice arc motion
        Animated.parallel([
          // Move down to timeline
          Animated.timing(stepTranslateY, {
            toValue: timelineSectionY,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          // Move slightly to the side for arc effect
          Animated.timing(stepTranslateX, {
            toValue: -30,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
          // Scale down slightly as it moves
          Animated.timing(stepScale, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
          // Fade out gently at the end
          Animated.timing(stepOpacity, {
            toValue: 0,
            duration: 400,
            delay: 350, // Start fading after movement has begun
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
        ]),
      ]).start(() => {
        // Reset animation values
        stepTranslateY.setValue(0);
        stepTranslateX.setValue(0);
        stepScale.setValue(1);
        stepOpacity.setValue(1);
        setStepBeingCompleted(null);

        // Actually update the milestone state
        completeMilestone(goal.id, milestoneId, true);

        // Add to feed as a social update
        const milestone = goal.milestones.find(m => m.id === milestoneId);
        if (milestone && user) {
          try {
            addMilestoneCompletionUpdate({
              goalId: goal.id,
              goalTitle: goal.title,
              milestoneId: milestone.id,
              milestoneTitle: milestone.title,
              milestoneDescription: milestone.description,
              imageUri: milestone.imageUri
            });

            // REMOVE ALERT - This removes the popup
            // Alert.alert(
            //  "Milestone Completed!",
            //  "Your progress has been shared with your friends.",
            //  [{ text: "Great!" }],
            //  { cancelable: true }
            // );

          } catch (error) {
            console.error("Failed to share update:", error);
          }
        }
      });
    } else {
      // Simply uncomplete the milestone
      completeMilestone(goal.id, milestoneId, false);
    }
  };

  const handleDragEnd = ({ data }) => {
    // Update the order of steps
    setStepsToComplete(data);

    // Here you would typically update this order in your backend
    // For example: updateMilestoneOrder(goal.id, data.map(item => item.id));
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Goal not found</Text>
      </View>
    );
  }

  // Sort milestones by completion status (incomplete first)
  const sortedMilestones = goal.milestones.slice().sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  // Calculate progress percentage
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // Fix for the Animated.multiply issue
  const AnimatedMultiplyFix = ({ value, multiplier, children }) => {
    // Create the multiplied value safely
    const multValue = Animated.multiply(
      value,
      new Animated.Value(multiplier || 0)
    );

    const animatedStyle = {
      transform: [{
        translateY: multValue
      }]
    };

    return (
      <Animated.View style={animatedStyle}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} /> {/* Spacer */}

        <TouchableOpacity style={styles.headerActionButton}>
          <FontAwesome5 name="ellipsis-h" size={18} color="#777" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Goal Card with Gradient */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: cardTranslateY }],
          marginTop: 0,
        }}>
          <LinearGradient
            colors={['#FF5F5F', '#FF8C8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goalCard}
          >
            <View style={styles.goalCardContent}>
              <View style={styles.goalCardHeader}>
                <Text style={styles.goalCardTitle}>{goal.title}</Text>
                <View style={styles.dateContainer}>
                  <FontAwesome5 name="calendar-alt" size={14} color="#FFF" style={{marginRight: 6}} />
                  <Text style={styles.goalInfoText}>
                    {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No target date'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>
                  Progress: {completedMilestones}/{totalMilestones} ({progressPercentage}%)
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercentage}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Steps to Complete Section */}
        <Animated.View style={{
          opacity: stepsOpacity,
          transform: [{ translateY: cardTranslateY }],
          width: '100%'
        }}>
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>Steps to Complete</Text>
            {stepsToComplete.length === 0 ? (
              <View>
                <Text style={styles.emptyStateText}>All steps completed! 🎉</Text>
                <TouchableOpacity
                  style={styles.addStepButton}
                  onPress={() => navigation.navigate('AddMilestone', { goalId: goal.id })}
                >
                  <LinearGradient
                    colors={['#FF5F5F', '#FF8C8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addStepButtonGradient}
                  >
                    <Text style={styles.addStepButtonText}>Add New Step</Text>
                    <FontAwesome5 name="plus" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
                <View style={styles.stepsListContainer}>
                  <DraggableFlatList
                    data={stepsToComplete}
                    keyExtractor={item => item.id}
                    onDragEnd={handleDragEnd}
                    contentContainerStyle={styles.draggableListContent}
                    renderItem={({ item, drag, isActive }) => {
                      const isBeingCompleted = stepBeingCompleted?.id === item.id;

                      return (
                        <Animated.View style={[
                          styles.fullWidth,
                          isBeingCompleted ? {
                            zIndex: 1000,
                            opacity: stepOpacity,
                            transform: [
                              { translateY: stepTranslateY },
                              { translateX: stepTranslateX },
                              { scale: stepScale }
                            ]
                          } : null
                        ]}>
                          <TouchableOpacity
                            onLongPress={drag}
                            delayLongPress={150}
                            style={[
                              styles.stepCard,
                              isActive && styles.stepCardActive
                            ]}
                            disabled={isBeingCompleted}
                          >
                            <Card style={styles.fullWidth} elevation={isActive ? 4 : 2}>
                              <Card.Content style={styles.stepCardContent}>
                                <View style={styles.stepHeader}>
                                  <View style={styles.dragHandle}>
                                    <FontAwesome5 name="grip-lines" size={14} color="#aaa" />
                                  </View>
                                  <Title style={styles.stepTitle}>{item.title}</Title>
                                  <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => handleCompleteMilestone(item.id, item.completed)}
                                  >
                                    <FontAwesome5 name="check" size={14} color="transparent" />
                                  </TouchableOpacity>
                                </View>

                                {item.description && (
                                  <Paragraph style={styles.stepDescription}>
                                    {item.description}
                                  </Paragraph>
                                )}

                                {item.imageUri && (
                                  <View style={styles.imageContainer}>
                                    <Image
                                      source={{ uri: item.imageUri }}
                                      style={styles.stepImage}
                                    />
                                  </View>
                                )}
                              </Card.Content>
                            </Card>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addStepFAB}
                    onPress={() => navigation.navigate('AddMilestone', { goalId: goal.id })}
                  >
                    <LinearGradient
                      colors={['#FF5F5F', '#FF8C8C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addStepFABGradient}
                    >
                      <FontAwesome5 name="plus" size={20} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </GestureHandlerRootView>
            )}
          </View>
        </Animated.View>

        {/* Timeline Section */}
        <Animated.View style={{
          opacity: timelineOpacity,
          transform: [{ translateY: cardTranslateY }]
        }}>
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Timeline</Text>

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
                      {/* Timeline connector */}
                      {index > 0 && (
                        <View style={styles.timelineConnector} />
                      )}

                      {/* Milestone node */}
                      <Animated.View style={[
                        styles.timelineNode,
                        { backgroundColor: theme.colors.success }
                      ]}>
                        <FontAwesome5 name="check" size={14} color="#FFF" />
                      </Animated.View>

                      {/* Milestone content */}
                      <Card style={styles.milestoneCard}>
                        <Card.Content>
                          <View style={styles.milestoneHeader}>
                            <Title style={styles.milestoneTitle}>{milestone.title}</Title>
                            <TouchableOpacity
                              style={[styles.checkboxContainer, styles.checkboxCompleted]}
                              onPress={() => handleCompleteMilestone(milestone.id, milestone.completed)}
                            >
                              <FontAwesome5 name="check" size={14} color="#FFF" />
                            </TouchableOpacity>
                          </View>

                          {milestone.description && (
                            <Paragraph style={styles.milestoneDescription}>
                              {milestone.description}
                            </Paragraph>
                          )}

                          {/* Display milestone image if available */}
                          {milestone.imageUri && (
                            <View style={styles.imageContainer}>
                              <Image
                                source={{ uri: milestone.imageUri }}
                                style={styles.milestoneImage}
                              />
                            </View>
                          )}

                          {/* Completion date could be added here */}
                          <Text style={styles.completedDate}>
                            Completed {format(new Date(), 'MMM d, yyyy')}
                          </Text>
                        </Card.Content>
                      </Card>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 40,
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
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 25,
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
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
});

export default GoalDetailScreen;