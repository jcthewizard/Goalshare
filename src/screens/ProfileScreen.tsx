/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Image
} from 'react-native';
import {
  Avatar,
  Title,
  Button,
  Card,
  Divider,
  useTheme,
  Tabs,
  Tab
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useGoals } from '../contexts/GoalContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';


const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { goalState } = useGoals();
  const theme = useTheme();

  // Calculate stats
  const totalGoals = goalState.goals.length;
  const completedGoals = goalState.goals.filter(goal => goal.isCompleted).length;
  const totalMilestones = goalState.goals.reduce(
    (sum, goal) => sum + goal.milestones.length + (goal.timeline?.length || 0),
    0
  );
  // Timeline items represent completed items
  const completedMilestones = goalState.goals.reduce(
    (sum, goal) => sum + (goal.timeline?.length || 0),
    0
  );

  const goalCompletionRate = totalGoals > 0
    ? Math.round((completedGoals / totalGoals) * 100)
    : 0;

  const milestoneCompletionRate = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Logout Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Profile header with profile info
  const renderProfileHeader = () => (
    <LinearGradient
      colors={['#FF5F5F', '#FF8C8C']}
      style={styles.profileHeader}
    >
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatarImage}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={user?.displayName?.substring(0, 2)?.toUpperCase() || '?'}
              color="#FFF"
              style={styles.avatar}
              labelStyle={{ fontWeight: '700' }}
            />
          )}
        </View>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>
    </LinearGradient>
  );

  // Render the logout button
  const renderLogoutButton = () => (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleLogout}
    >
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>

          {/* Stats Cards */}
          <View style={styles.statsCards}>
            {/* Goals Card */}
            <Card style={styles.statsCard}>
              <LinearGradient
                colors={['#35CAFC', '#70D6FF']}
                style={styles.statsCardContent}
              >
                <View style={styles.statsIconContainer}>
                  <FontAwesome5 name="flag" size={22} color="#FFF" />
                </View>
                <Text style={styles.statsNumber}>{totalGoals}</Text>
                <Text style={styles.statsLabel}>Total Goals</Text>
              </LinearGradient>
            </Card>

            {/* Completed Goals Card */}
            <Card style={styles.statsCard}>
              <LinearGradient
                colors={['#4CD964', '#7CEC9F']}
                style={styles.statsCardContent}
              >
                <View style={styles.statsIconContainer}>
                  <FontAwesome5 name="check-circle" size={22} color="#FFF" />
                </View>
                <Text style={styles.statsNumber}>{completedGoals}</Text>
                <Text style={styles.statsLabel}>Completed</Text>
              </LinearGradient>
            </Card>
          </View>

          {/* Completion Rates */}
          <Card style={styles.completionCard}>
            <Card.Content>
              <View style={styles.completionHeader}>
                <Text style={styles.completionTitle}>Completion Rates</Text>
              </View>

              {/* Goals Completion */}
              <View style={styles.completionSection}>
                <View style={styles.completionLabelRow}>
                  <Text style={styles.completionLabel}>Goals</Text>
                  <Text style={styles.completionPercent}>{goalCompletionRate}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${goalCompletionRate}%`, backgroundColor: theme.colors.primary }
                    ]}
                  />
                </View>
              </View>

              {/* Milestones Completion */}
              <View style={styles.completionSection}>
                <View style={styles.completionLabelRow}>
                  <Text style={styles.completionLabel}>Milestones</Text>
                  <Text style={styles.completionPercent}>{milestoneCompletionRate}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${milestoneCompletionRate}%`, backgroundColor: theme.colors.accent }
                    ]}
                  />
                </View>
              </View>

              {/* Total Stats */}
              <View style={styles.totalStatsContainer}>
                <View style={styles.totalStatItem}>
                  <Text style={styles.totalStatLabel}>Total Milestones</Text>
                  <Text style={styles.totalStatValue}>{totalMilestones}</Text>
                </View>
                <View style={styles.totalStatDivider} />
                <View style={styles.totalStatItem}>
                  <Text style={styles.totalStatLabel}>Completed</Text>
                  <Text style={styles.totalStatValue}>{completedMilestones}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {renderLogoutButton()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 70, // Extra padding to ensure logout button is accessible above bottom navigation
  },
  profileHeader: {
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCardContent: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  statsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completionCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completionHeader: {
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
  },
  completionSection: {
    marginBottom: 16,
  },
  completionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 15,
    color: '#666',
  },
  completionPercent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  totalStatsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  totalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalStatLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  totalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#555',
  },
  totalStatDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },
  logoutButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5F5F',
  },
});

export default ProfileScreen;