// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Animated, Easing, Platform, StatusBar, Alert, TouchableWithoutFeedback } from 'react-native';
import { FAB, Card, Title, Paragraph, useTheme, Avatar, IconButton, Surface } from 'react-native-paper';
import { useGoals } from '../contexts/FirebaseGoalContext';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Goal } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import GoalCard from '../components/GoalCard';
import { Ionicons } from '@expo/vector-icons';

type Props = StackScreenProps<MainTabParamList, 'Home'>;

// Collection of motivational quotes
const motivationalQuotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
  { text: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
];

// Simple hash function to get consistent quote based on date
const getHashForDate = (date) => {
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Styles for the quote component
const quoteStyles = StyleSheet.create({
  quoteContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteGradient: {
    borderRadius: 16,
  },
  quoteContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  quoteMarkContainer: {
    marginRight: 10,
  },
  quoteMark: {
    fontSize: 50,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 'bold',
    lineHeight: 60,
    height: 40,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    marginBottom: 4,
  },
  quoteAuthor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

// Create styles outside the component to fix top-level variable declaration error
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  welcomeContainer: {
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    overflow: 'visible',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTextContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  goalCardContainer: {
    marginVertical: 8,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalCard: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 130,
  },
  goalCardContent: {
    padding: 16,
    overflow: 'visible',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  pinnedIcon: {
    marginLeft: 8,
    transform: [{ rotateZ: '30deg' }],
  },
  goalInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  goalInfoText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 6,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -18,
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  emptyIconContainer: {
    marginTop: 40,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderRadius: 50,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 9999,
    elevation: 10,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  dropdownButton: {
    padding: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    minWidth: 160,
    zIndex: 10000,
    overflow: 'visible',
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dropdownOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  dropdownOverlay: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    minWidth: 160,
    zIndex: 10000,
  },
  completedGoalsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  completedGoalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedGoalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  completedGoalsContainer: {
    overflow: 'hidden',
  },
  completedGoalCardContainer: {
    opacity: 0.8,
  },
  completedGoalTitle: {
    color: '#666',
  },
  completedGoalInfoText: {
    color: '#666',
  },
  completedProgressBar: {
    backgroundColor: '#4CAF50',
  },
  completedProgressText: {
    color: '#666',
  },
});

// Daily Quote Component with improved design
const DailyQuote = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Get today's date and select a quote based on the date hash
  const today = new Date();
  const quoteIndex = getHashForDate(today) % motivationalQuotes.length;
  const quote = motivationalQuotes[quoteIndex];

  return (
    <Animated.View
      style={[
        quoteStyles.quoteContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#35CAFC', '#2D9BF0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={quoteStyles.quoteGradient}
      >
        <View style={quoteStyles.quoteContent}>
          <View style={quoteStyles.quoteMarkContainer}>
            <Text style={quoteStyles.quoteMark}>"</Text>
          </View>
          <View style={quoteStyles.quoteTextContainer}>
            <Text style={quoteStyles.quoteText}>{quote.text}</Text>
            <Text style={quoteStyles.quoteAuthor}>— {quote.author}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const ListHeaderComponent = ({ user }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerTextContainer}>
      <Text style={styles.headerTitle}>Hello, {user?.displayName || 'Friend'}!</Text>
      <Text style={styles.headerSubtitle}>Track your progress and stay focused</Text>
    </View>
    <DailyQuote />
  </View>
);

// Helper function to get the latest activity date for a goal
const getLatestActivityDate = (goal: Goal): Date => {
  const dates = [];

  // Add goal creation date
  if (goal.createdAt) {
    dates.push(new Date(goal.createdAt));
  }

  // Add milestone dates - with null check
  if (goal.milestones && Array.isArray(goal.milestones) && goal.milestones.length > 0) {
    goal.milestones.forEach(milestone => {
      if (milestone && milestone.createdAt) {
        dates.push(new Date(milestone.createdAt));
      }
    });
  }

  // Add timeline item dates (these represent completed activities) - with null check
  if (goal.timeline && Array.isArray(goal.timeline) && goal.timeline.length > 0) {
    goal.timeline.forEach(item => {
      if (item && item.createdAt) {
        dates.push(new Date(item.createdAt));
      }
    });
  }

  // Return the most recent date, or goal creation date as fallback
  if (dates.length === 0) {
    return goal.createdAt ? new Date(goal.createdAt) : new Date();
  }

  return new Date(Math.max(...dates.map(date => date.getTime())));
};

// Define HomeScreen as a separate function to fix return type error
function HomeScreen({ navigation }: Props): React.ReactElement {
  const { goals, getGoals, deleteGoal, updateGoal } = useGoals(); // Use Firebase context directly
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{[key: string]: {top: number, right: number, position: 'below' | 'above'}}>({});
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const fabAnim = useRef(new Animated.Value(1)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const completedDropdownAnim = useRef(new Animated.Value(0)).current;
  const completedSectionAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  // Filter goals into active and completed - sort unpinned by latest activity
  const activeGoals = (() => {
    if (!goals || !Array.isArray(goals)) return [];

    const active = goals.filter(g => g && !g.isCompleted);
    const pinned = active.filter(g => g.isPinned);
    const unpinned = active.filter(g => !g.isPinned);

    // Sort unpinned goals by latest activity (most recent first)
    const sortedUnpinned = unpinned.sort((a, b) => {
      try {
        const aLatest = getLatestActivityDate(a);
        const bLatest = getLatestActivityDate(b);
        return bLatest.getTime() - aLatest.getTime();
      } catch (error) {
        console.warn('Error sorting goals by activity:', error);
        return 0; // Keep original order if there's an error
      }
    });

    // Return pinned goals first, then sorted unpinned goals
    return [...pinned, ...sortedUnpinned];
  })();
  const completedGoals = goals.filter(g => g && g.isCompleted);

  useFocusEffect(
    React.useCallback(() => {
      // Animate FAB when screen comes into focus
      Animated.sequence([
        Animated.timing(fabAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(fabAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        })
      ]).start();

      // Call getGoals from context if it exists
      if (getGoals) {
        getGoals();
      }
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (getGoals) {
      await getGoals();
    }
    setRefreshing(false);
  };

  // Delete handler
  const handleDeleteGoal = (goalId: string, goalTitle: string): void => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`,
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
              await deleteGoal(goalId);
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Pin/Unpin handler
  const handleTogglePin = async (goalId: string, currentPinStatus: boolean): Promise<void> => {
    try {
      await updateGoal(goalId, { isPinned: !currentPinStatus });
    } catch (error) {
      Alert.alert("Error", "Failed to update goal pin status. Please try again.");
    }
  };

  // Complete Goal handler
  const handleCompleteGoal = (goalId: string, goalTitle: string): void => {
    Alert.alert(
      "Complete Goal",
      `Are you sure you want to mark "${goalTitle}" as completed? This will celebrate your achievement!`,
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
              await updateGoal(goalId, {
                completed: true, // Use 'completed' for backend compatibility
                isCompleted: true, // Keep both for safety
                completedDate: new Date()
              });
              // Refresh goals to update UI
              if (getGoals) {
                await getGoals();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to complete goal. Please try again.");
            }
          }
        }
      ]
    );
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

  // Toggle dropdown for goal actions
  const toggleDropdown = (goalId: string, index: number) => {
    if (activeDropdown === goalId) {
      // Close dropdown with spring animation
      closeDropdown();
    } else {
      // Close any open dropdown first
      if (activeDropdown) {
        setActiveDropdown(null);
        dropdownAnim.setValue(0);
      }

      // Determine if dropdown should appear above or below based on position in list
      const totalGoals = goals.length;
      const shouldShowAbove = index >= Math.floor(totalGoals / 2) && index >= totalGoals - 3;

      // Calculate approximate position based on index and card height
      const headerHeight = 220; // Approximate header height
      const cardHeight = 160; // Approximate card height including margins
      const cardSpacing = 16;
      const estimatedTop = headerHeight + (index * (cardHeight + cardSpacing)) + 60;

      setDropdownPosition(prev => ({
        ...prev,
        [goalId]: {
          top: shouldShowAbove ? estimatedTop - 200 : estimatedTop,
          right: 16,
          position: shouldShowAbove ? 'above' : 'below'
        }
      }));

      // Open dropdown with spring animation
      setActiveDropdown(goalId);
      Animated.spring(dropdownAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Auto-close dropdown after 10 seconds
      setTimeout(() => {
        if (activeDropdown === goalId) {
          closeDropdown();
        }
      }, 10000);
    }
  };

  const renderItem = ({ item, index }) => {
    // Calculate completion percentage
    const totalMilestones = (item.milestones?.length || 0) + (item.timeline?.length || 0);
    const completedMilestones = item.timeline?.length || 0;
    const completionPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Get gradient colors based on index
    const gradientColors = [
      ['#FF9FF3', '#FCA4CC'], // Pink
      ['#70D6FF', '#59C1FF'], // Blue
      ['#FFCA80', '#FFAA33'], // Orange
      ['#A5F8D3', '#7CECA3'], // Green
      ['#E2C2FF', '#C490E4'], // Purple
    ][index % 5];

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.goalCardContainer}
        onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.goalCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.goalCardContent}>
            <View style={styles.goalTitleRow}>
              <Text style={styles.goalTitle}>{item.title}</Text>
              <View style={styles.goalActions}>
                {item.isPinned && (
                  <FontAwesome5 name="thumbtack" size={14} color="#FFF" style={styles.pinnedIcon} />
                )}
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleDropdown(item.id, index);
                    }}
                  >
                    <FontAwesome5 name="ellipsis-h" size={16} color="rgba(255, 255, 255, 0.8)" />
                  </TouchableOpacity>

                </View>
              </View>
            </View>

            <View style={styles.goalInfoContainer}>
              <View style={styles.goalInfo}>
                <FontAwesome5 name="calendar-alt" size={14} color="#FFF" />
                <Text style={styles.goalInfoText}>
                  {item.targetDate && !isNaN(new Date(item.targetDate).getTime())
                    ? new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'No date'}
                </Text>
              </View>

              <View style={styles.goalInfo}>
                <FontAwesome5 name="tasks" size={14} color="#FFF" />
                <Text style={styles.goalInfoText}>
                  {completedMilestones}/{totalMilestones}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
              <Text style={styles.progressText}>{completionPercentage}%</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render function for completed goals - non-clickable and greyed out
  const renderCompletedItem = ({ item, index }) => {
    // Calculate completion percentage (should be 100% for completed goals)
    const totalMilestones = (item.milestones?.length || 0) + (item.timeline?.length || 0);
    const completedMilestones = item.timeline?.length || 0;
    const completionPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 100;

    return (
      <View
        key={item.id}
        style={[styles.goalCardContainer, styles.completedGoalCardContainer]}
      >
        <LinearGradient
          colors={['#E0E0E0', '#F5F5F5']} // Grey gradient for completed goals
          style={styles.goalCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.goalCardContent}>
            <View style={styles.goalTitleRow}>
              <Text style={[styles.goalTitle, styles.completedGoalTitle]}>{item.title}</Text>
              <View style={styles.goalActions}>
                <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
              </View>
            </View>

            <View style={styles.goalInfoContainer}>
              <View style={styles.goalInfo}>
                <FontAwesome5 name="calendar-check" size={14} color="#666" />
                <Text style={[styles.goalInfoText, styles.completedGoalInfoText]}>
                  Completed {item.completedDate && !isNaN(new Date(item.completedDate).getTime())
                    ? new Date(item.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </Text>
              </View>

              <View style={styles.goalInfo}>
                <FontAwesome5 name="tasks" size={14} color="#666" />
                <Text style={[styles.goalInfoText, styles.completedGoalInfoText]}>
                  {completedMilestones}/{totalMilestones}
                </Text>
              </View>
            </View>

            {/* Progress bar - always 100% for completed goals */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.completedProgressBar, { width: '100%' }]} />
              <Text style={[styles.progressText, styles.completedProgressText]}>✓ Complete</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={['#FF9FF3', '#FCA4CC']}
          style={styles.emptyIconGradient}
        >
          <FontAwesome5 name="flag" size={40} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyText}>No goals yet!</Text>
      <Text style={styles.emptySubtext}>Tap the + button to start your journey</Text>
    </View>
  );

  // Completed goals section component
  const CompletedGoalsSection = () => {
    React.useEffect(() => {
      // Animate chevron rotation with native driver
      Animated.timing(completedDropdownAnim, {
        toValue: showCompletedGoals ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate height without native driver
      Animated.timing(completedSectionAnim, {
        toValue: showCompletedGoals ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, [showCompletedGoals]);

    if (completedGoals.length === 0) return null;

    return (
      <View style={styles.completedGoalsSection}>
        <TouchableOpacity
          style={styles.completedGoalsHeader}
          onPress={() => setShowCompletedGoals(!showCompletedGoals)}
        >
          <Text style={styles.completedGoalsTitle}>Completed Goals ({completedGoals.length})</Text>
          <Animated.View
            style={{
              transform: [{
                rotate: completedDropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg']
                })
              }]
            }}
          >
            <Ionicons name="chevron-down" size={20} color="#666" />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.completedGoalsContainer,
            {
              maxHeight: completedSectionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000]
              }),
              opacity: completedSectionAnim
            }
          ]}
        >
          {showCompletedGoals && completedGoals.map((item, index) => renderCompletedItem({ item, index }))}
        </Animated.View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#F0F4FF', '#E6EEFF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={closeDropdown} disabled={!activeDropdown}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={activeGoals}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
              ListHeaderComponent={<ListHeaderComponent user={user} />}
              ListEmptyComponent={ListEmptyComponent}
              ListFooterComponent={<CompletedGoalsSection />}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              showsVerticalScrollIndicator={false}
              onScroll={() => closeDropdown()}
              scrollEventThrottle={100}
            />

            {/* Global Dropdown Overlay */}
            {activeDropdown && dropdownPosition[activeDropdown] && (
              <Animated.View style={[
                styles.dropdownOverlay,
                {
                  top: dropdownPosition[activeDropdown].top,
                  right: dropdownPosition[activeDropdown].right,
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
                        outputRange: [dropdownPosition[activeDropdown].position === 'above' ? 5 : -5, 0],
                      })
                    }
                  ]
                }
              ]}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={(e) => {
                    e.stopPropagation();
                    const goalData = goals.find(g => g.id === activeDropdown);
                    console.log('✅ Completing goal:', activeDropdown, goalData?.title);
                    closeDropdown();
                    setTimeout(() => {
                      if (goalData) {
                        handleCompleteGoal(activeDropdown, goalData.title);
                      }
                    }, 200);
                  }}
                >
                  <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
                  <Text style={[styles.dropdownOptionText, { color: '#4CAF50' }]}>Complete Goal</Text>
                </TouchableOpacity>

                <View style={styles.dropdownSeparator} />

                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={(e) => {
                    e.stopPropagation();
                    console.log('✏️ Editing goal:', activeDropdown);
                    closeDropdown();
                    setTimeout(() => {
                      navigation.navigate('EditGoal', { goalId: activeDropdown });
                    }, 200);
                  }}
                >
                  <FontAwesome5 name="edit" size={14} color="#666" />
                  <Text style={styles.dropdownOptionText}>Edit Goal</Text>
                </TouchableOpacity>

                <View style={styles.dropdownSeparator} />

                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={(e) => {
                    e.stopPropagation();
                    const goalData = goals.find(g => g.id === activeDropdown);
                    console.log('📌 Toggling pin for goal:', activeDropdown, 'Current pin status:', goalData?.isPinned);
                    closeDropdown();
                    setTimeout(() => {
                      if (goalData) {
                        handleTogglePin(activeDropdown, goalData.isPinned);
                      }
                    }, 200);
                  }}
                >
                  <FontAwesome5
                    name="thumbtack"
                    size={14}
                    color={goals.find(g => g.id === activeDropdown)?.isPinned ? "#000000" : "#666"}
                  />
                  <Text style={[styles.dropdownOptionText, { color: goals.find(g => g.id === activeDropdown)?.isPinned ? "#000000" : "#666" }]}>
                    {goals.find(g => g.id === activeDropdown)?.isPinned ? "Unpin Goal" : "Pin Goal"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dropdownSeparator} />

                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={(e) => {
                    e.stopPropagation();
                    const goalData = goals.find(g => g.id === activeDropdown);
                    console.log('🗑️ Deleting goal:', activeDropdown, goalData?.title);
                    closeDropdown();
                    setTimeout(() => {
                      if (goalData) {
                        handleDeleteGoal(activeDropdown, goalData.title);
                      }
                    }, 200);
                  }}
                >
                  <FontAwesome5 name="trash-alt" size={14} color="#FF3B30" />
                  <Text style={[styles.dropdownOptionText, { color: '#FF3B30' }]}>Delete Goal</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View
              style={[
                styles.fabContainer,
                {
                  transform: [{ scale: fabAnim }]
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('AddGoal')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF5F5F', '#FF8C8C']}
                  style={styles.fab}
                >
                  <FontAwesome5 name="plus" size={24} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default HomeScreen;