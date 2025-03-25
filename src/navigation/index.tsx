// @ts-nocheck
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import AddMilestoneScreen from '../screens/AddMilestoneScreen';
import { IconButton } from 'react-native-paper';
import { Animated, StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

// Define our navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GoalDetail: { goalId: string };
  AddGoal: undefined;
  AddMilestone: { goalId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Home: undefined;
  Profile: undefined;
};

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom transition configuration
const customTransitionSpec = {
  open: {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
  close: {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
};

// Auth navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      transitionSpec: customTransitionSpec
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Custom Tab Bar Component for a modern look
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FF']}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Icon based on route name
            let iconName;
            if (route.name === 'Feed') {
              iconName = 'newspaper';
            } else if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Profile') {
              iconName = 'user';
            }

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
              >
                <View style={styles.tabButtonContent}>
                  {isFocused && (
                    <LinearGradient
                      colors={['#35CAFC', '#2D9BF0']}
                      style={styles.tabIndicator}
                    />
                  )}
                  <FontAwesome5
                    name={iconName}
                    size={20}
                    color={isFocused ? '#35CAFC' : '#AAAAAA'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? '#35CAFC' : '#AAAAAA' }
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

// Tab bar styles
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    height: Platform.OS === 'ios' ? 85 : 70,
  },
  tabBarGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabButtonContent: {
    alignItems: 'center',
    position: 'relative',
    paddingTop: 6,
  },
  tabIndicator: {
    position: 'absolute',
    top: -14,
    width: 30,
    height: 3,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

// Main tab navigator updated with custom tab bar
const MainTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
    initialRouteName="Home"
  >
    <Tab.Screen
      name="Feed"
      component={FeedScreen}
      options={{
        tabBarLabel: 'Feed',
      }}
    />
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

// Root navigator
const Navigation = () => {
  const { user, initialized } = useAuth();

  // Show loading screen while checking authentication
  if (!initialized) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...TransitionPresets.SlideFromRightIOS,
          cardStyle: { backgroundColor: 'white' }
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="GoalDetail"
              component={GoalDetailScreen}
              options={{
                ...TransitionPresets.SlideFromRightIOS,
                gestureResponseDistance: { horizontal: 100 }
              }}
            />
            <Stack.Screen
              name="AddGoal"
              component={AddGoalScreen}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureResponseDistance: { vertical: 200 }
              }}
            />
            <Stack.Screen
              name="AddMilestone"
              component={AddMilestoneScreen}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureResponseDistance: { vertical: 200 }
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;