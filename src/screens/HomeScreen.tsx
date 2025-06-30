// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Animated, Easing, Platform, StatusBar, Alert } from 'react-native';
import { FAB, Card, Title, Paragraph, useTheme, Avatar, IconButton, Surface } from 'react-native-paper';
import { useGoals } from '../contexts/GoalContext';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Goal } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import GoalCard from '../components/GoalCard';

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
  },
  deleteGoalButton: {
    marginLeft: 8,
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

// Define HomeScreen as a separate function to fix return type error
function HomeScreen({ navigation }: Props): React.ReactElement {
  const goalContext = useGoals();
  const { deleteGoal } = useGoals();
  const goals = goalContext.goalState ? goalContext.goalState.goals : [];
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const fabAnim = useRef(new Animated.Value(1)).current;
  const theme = useTheme();

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
      if (goalContext.getGoals) {
        goalContext.getGoals();
      }
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (goalContext.getGoals) {
      await goalContext.getGoals();
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

  const renderItem = ({ item, index }) => {
    // Calculate completion percentage
    const totalMilestones = item.milestones ? item.milestones.length : 0;
    const completedMilestones = item.milestones ? item.milestones.filter(m => m.completed).length : 0;
    const completionPercentage = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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
                <TouchableOpacity
                  style={styles.deleteGoalButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteGoal(item.id, item.title);
                  }}
                >
                  <FontAwesome5 name="trash" size={14} color="rgba(255, 255, 255, 0.8)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.goalInfoContainer}>
              <View style={styles.goalInfo}>
                <FontAwesome5 name="calendar-alt" size={14} color="#FFF" />
                <Text style={styles.goalInfoText}>
                  {item.targetDate ? new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
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

  return (
    <LinearGradient
      colors={['#F0F4FF', '#E6EEFF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={goals ? goals.sort((a, b) => (b.isPinned || 0) - (a.isPinned || 0)) : []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          ListHeaderComponent={<ListHeaderComponent user={user} />}
          ListEmptyComponent={ListEmptyComponent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />

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
      </SafeAreaView>
    </LinearGradient>
  );
}

export default HomeScreen;