// @ts-nocheck
import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { FAB, Card, Title, Paragraph, useTheme, Avatar, IconButton } from 'react-native-paper';
import { useGoals } from '../contexts/GoalContext';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Goal } from '../types';

type Props = StackScreenProps<MainTabParamList, 'Home'>;

// Create styles outside the component to fix top-level variable declaration error
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'white',
  },
  welcomeContainer: {
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 100, // Space for the header
    paddingBottom: 20,
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
  },
  emptyIconContainer: {
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
    bottom: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Define HomeScreen as a separate function to fix return type error
function HomeScreen({ navigation }: Props): React.ReactElement {
  const goalContext = useGoals();
  const goalState = goalContext.goalState;
  const authContext = useAuth();
  const user = authContext.user;
  const theme = useTheme();
  // Fix 'new' error by defining AnimatedValue more explicitly
  const scrollY = useRef<Animated.Value>(Animated.Value ? new Animated.Value(0) : Animated.Value(0)).current;

  // Use arrow function with return statement instead of block
  const getRandomGradient = (index: number): readonly [string, string] =>
    [
      ['#FF9FF3', '#FCA4CC'], // Pink
      ['#70D6FF', '#59C1FF'], // Blue
      ['#FFCA80', '#FFAA33'], // Orange
      ['#A5F8D3', '#7CECA3'], // Green
      ['#E2C2FF', '#C490E4'], // Purple
    ][index % 5] as readonly [string, string];

  // Create a scaling animation for the header
  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Translate the FAB up on scroll
  const fabTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  // Fixed item and index types for renderGoalItem
  const renderGoalItem = ({ item, index }: { item: Goal; index: number }): React.ReactElement => {
    // Calculate completion percentage
    const totalMilestones = item.milestones.length;
    const completedMilestones = item.milestones.filter((m) => m.completed).length;
    const completionPercentage = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Get a gradient color for the card
    const gradientColors = getRandomGradient(index);

    return (
      <TouchableOpacity
        style={styles.goalCardContainer}
        onPress={() => {
          // Fix navigation type error by casting navigation to any
          (navigation as any).navigate('GoalDetail', { goalId: item.id });
        }}
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
              {item.isPinned && (
                <FontAwesome5 name="thumbtack" size={14} color="#FFF" style={styles.pinnedIcon} />
              )}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }]
        }
      ]}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Hey there, {user?.displayName?.split(' ')[0] || 'Friend'}! 👋</Text>
          <Text style={styles.tagline}>What goals are you crushing today?</Text>
        </View>
      </Animated.View>

      {goalState.goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          {/* Custom empty state icon */}
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#FF9FF3', '#FCA4CC'] as readonly [string, string]}
              style={styles.emptyIconGradient}
            >
              <FontAwesome5 name="flag" size={40} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyText}>No goals yet!</Text>
          <Text style={styles.emptySubtext}>Tap the + button to start your journey</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={goalState.goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        />
      )}

      <Animated.View style={[
        styles.fabContainer,
        { transform: [{ translateY: fabTranslateY }] }
      ]}>
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          color="#FFF"
          onPress={() => {
            // Fix navigation type error by casting navigation to any
            (navigation as any).navigate('AddGoal');
          }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

export default HomeScreen;