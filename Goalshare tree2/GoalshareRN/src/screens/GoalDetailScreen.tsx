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
  Easing
} from 'react-native';
import { Card, Title, Paragraph, Checkbox, useTheme, IconButton } from 'react-native-paper';
import { useGoals } from '../contexts/GoalContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'GoalDetail'>;

const GoalDetailScreen: React.FC<Props> = ({ route, navigation }: Props): React.ReactElement => {
  const { goalId } = route.params;
  const { goalState, fetchGoals, completeMilestone } = useGoals();
  const [goal, setGoal] = useState(goalState.goals.find((g) => g.id === goalId) || null);
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: Animated.Value}>({});
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

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

  const handleCompleteMilestone = (milestoneId: string, isCompleted: boolean): void => {
    if (!goal) return;

    // Animate the completion status change
    Animated.timing(animatedValues[milestoneId], {
      toValue: !isCompleted ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    completeMilestone(goal.id, milestoneId, !isCompleted);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with goal title and back button */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          color={theme.colors.primary}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>{goal.title}</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Goal Card with Gradient */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: cardTranslateY }]
        }}>
          <LinearGradient
            colors={['#FF5F5F', '#FF8C8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goalCard}
          >
            <View style={styles.goalCardContent}>
              <Text style={styles.goalCardTitle}>{goal.title}</Text>

              <View style={styles.goalInfoRow}>
                <FontAwesome5 name="calendar-alt" size={16} color="#FFF" />
                <Text style={styles.goalInfoText}>
                  {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No target date'}
                </Text>
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

        {/* Milestones section */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: cardTranslateY }]
        }}>
          <View style={styles.milestonesSection}>
            <Text style={styles.sectionTitle}>Your Milestones</Text>

            {/* Timeline View of Milestones with Photos */}
            <View style={styles.timelineContainer}>
              {sortedMilestones.map((milestone, index) => {
                // Create a staggered animation delay for each milestone
                const itemFadeAnim = useRef(new Animated.Value(0)).current;
                const itemTranslateY = useRef(new Animated.Value(50)).current;

                useEffect(() => {
                  // Stagger the animation with 100ms delay per item
                  const delay = 300 + (index * 100);

                  Animated.parallel([
                    Animated.timing(itemFadeAnim, {
                      toValue: 1,
                      duration: 500,
                      delay,
                      useNativeDriver: true,
                      easing: Easing.out(Easing.cubic),
                    }),
                    Animated.timing(itemTranslateY, {
                      toValue: 0,
                      duration: 700,
                      delay,
                      useNativeDriver: true,
                      easing: Easing.out(Easing.cubic),
                    }),
                  ]).start();
                }, []);

                return (
                  <Animated.View key={milestone.id}
                    style={[
                      styles.timelineItem,
                      {
                        opacity: itemFadeAnim,
                        transform: [{ translateY: itemTranslateY }]
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
                      {
                        backgroundColor: animatedValues[milestone.id]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [theme.colors.accent, theme.colors.success]
                        }) || (milestone.completed ? theme.colors.success : theme.colors.accent),
                        transform: [{
                          scale: animatedValues[milestone.id]?.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.2, 1]
                          }) || 1
                        }]
                      }
                    ]}>
                      {milestone.completed ? (
                        <FontAwesome5 name="check" size={14} color="#FFF" />
                      ) : (
                        <Text style={styles.timelineNodeText}>{index + 1}</Text>
                      )}
                    </Animated.View>

                    {/* Milestone content */}
                    <Card style={styles.milestoneCard}>
                      <Card.Content>
                        <View style={styles.milestoneHeader}>
                          <Title style={styles.milestoneTitle}>{milestone.title}</Title>
                          <TouchableOpacity
                            style={[
                              styles.checkboxContainer,
                              milestone.completed ? styles.checkboxCompleted : {}
                            ]}
                            onPress={() => handleCompleteMilestone(milestone.id, milestone.completed)}
                          >
                            {milestone.completed && <FontAwesome5 name="check" size={14} color="#FFF" />}
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
                      </Card.Content>
                    </Card>
                  </Animated.View>
                );
              })}

              {/* Add new milestone button in timeline */}
              <Animated.View
                style={[
                  styles.timelineItem,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: Animated.multiply(
                        cardTranslateY,
                        new Animated.Value(0.5)
                      )
                    }]
                  }
                ]}
              >
                <View style={styles.addMilestoneNodePlaceholder}></View>
                <TouchableOpacity
                  style={styles.addMilestoneCard}
                  onPress={() => navigation.navigate('AddMilestone', { goalId: goal.id })}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.05)']}
                    style={styles.addMilestoneGradient}
                  >
                    <Text style={styles.addMilestoneText}>Add New Milestone</Text>
                    <FontAwesome5 name="plus-circle" size={16} color={theme.colors.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
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
    paddingHorizontal: 8,
    paddingTop: 10,
    height: 60,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
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
    padding: 20,
  },
  goalCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  goalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfoText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 10,
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
    marginLeft: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#35CAFC',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
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
});

export default GoalDetailScreen;