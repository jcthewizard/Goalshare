// @ts-nocheck
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

import GoalDetailScreen from '../screens/GoalDetailScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import AddMilestoneScreen from '../screens/AddMilestoneScreen';
import EditGoalScreen from '../screens/EditGoalScreen';
import EditMilestoneScreen from '../screens/EditMilestoneScreen';
import { IconButton } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity, Text, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import CameraScreen from '../screens/CameraScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define our navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GoalDetail: { goalId: string };
  AddGoal: undefined;
  AddMilestone: { goalId: string };
  EditGoal: { goalId: string };
  EditMilestone: { goalId: string; milestoneId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
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
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Camera') {
              iconName = 'camera';
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
    backgroundColor: '#35CAFC',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

// Hook for swipe navigation between tabs with smooth animations
const useSwipeNavigation = (navigation, currentTabName) => {
  const tabNames = ['Home', 'Camera', 'Profile'];
  const currentIndex = tabNames.indexOf(currentTabName);

  // Create a function that runs on JS thread for navigation
  const navigateToTab = (targetTab) => {
    console.log('📱 Running navigation on JS thread:', targetTab);
    try {
      if (navigation && typeof navigation.jumpTo === 'function') {
        console.log('✅ Using jumpTo:', targetTab);
        navigation.jumpTo(targetTab);
      } else if (navigation && typeof navigation.navigate === 'function') {
        console.log('✅ Using navigate:', targetTab);
        navigation.navigate(targetTab);
      } else {
        console.warn('⚠️ No valid navigation method found');
      }
    } catch (error) {
      console.error('❌ JS thread navigation error:', error);
    }
  };

  const swipeGesture = Gesture.Pan()
    .minDistance(30) // Require minimum distance to start
    .failOffsetY([-50, 50]) // Fail if too much vertical movement
    .activeOffsetX([-20, 20]) // Activate on horizontal movement
    .simultaneousWithExternalGesture() // Allow with other gestures
    .onEnd((event) => {
      'worklet';
      try {
        // Simple and reliable swipe detection
        const { velocityX, translationX } = event;
        const minSwipeDistance = 80;
        const minSwipeVelocity = 500;

        // Check for valid swipe
        const isValidSwipe = Math.abs(translationX) > minSwipeDistance || Math.abs(velocityX) > minSwipeVelocity;

        console.log('Swipe detected:', {
          currentTabName,
          currentIndex,
          translationX,
          velocityX,
          isValidSwipe,
          hasNavigation: !!navigation,
          hasNavigateMethod: !!navigation?.navigate,
          hasJumpToMethod: !!navigation?.jumpTo,
          navigationMethods: navigation ? Object.keys(navigation) : []
        });

        if (isValidSwipe && navigation) {
          let targetTab = null;

          if (translationX > 0 || velocityX > 0) {
            // Swipe right - go to previous tab
            if (currentIndex > 0) {
              targetTab = tabNames[currentIndex - 1];
              console.log('🔄 Attempting to navigate to previous tab:', targetTab);
            }
          } else {
            // Swipe left - go to next tab
            if (currentIndex < tabNames.length - 1) {
              targetTab = tabNames[currentIndex + 1];
              console.log('🔄 Attempting to navigate to next tab:', targetTab);
            }
          }

          if (targetTab) {
            console.log('🎯 Navigation worklet called for:', targetTab);
            // Use runOnJS to call the navigation function on JS thread
            runOnJS(navigateToTab)(targetTab);
          }
        }
      } catch (error) {
        console.error('❌ Swipe navigation error:', error);
      }
    });

  return swipeGesture;
};

// Swipe-enabled screen wrapper
const SwipeableScreen = ({ children, navigation, screenName }) => {
  // Safety check to ensure navigation exists
  if (!navigation || !screenName) {
    console.warn('SwipeableScreen: Missing navigation or screenName', { navigation: !!navigation, screenName });
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const swipeGesture = useSwipeNavigation(navigation, screenName);

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
};

// Animated Tab Navigator with smooth swipe transitions
const AnimatedTabNavigator = ({ navigation: stackNavigation, route }) => {
  const tabNames = ['Home', 'Camera', 'Profile'];
  const screenWidth = SCREEN_WIDTH; // Make screen width accessible in component scope
  const currentTabIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [activeTabIndex, setActiveTabIndex] = React.useState(0); // Track active tab for icons

  React.useEffect(() => {
    if (route.params?.screen) {
      const targetTabIndex = tabNames.indexOf(route.params.screen);
      if (targetTabIndex !== -1) {
        navigateToTab(targetTabIndex, true);
        // Important: clear the param to avoid re-triggering
        stackNavigation.setParams({ screen: undefined });
      }
    }
  }, [route.params?.screen]);

  // Navigation function that runs on JS thread
  const navigateToTab = (targetIndex, instant = false) => {
    console.log('📱 Navigating to tab index:', targetIndex, instant ? '(instant)' : '(animated)');
    currentTabIndex.value = targetIndex;
    setActiveTabIndex(targetIndex); // Update state for icon colors

    if (instant) {
      // Instant navigation for tab bar clicks
      translateX.value = -targetIndex * screenWidth;
    } else {
      // Animated navigation for swipes
      translateX.value = withSpring(-targetIndex * screenWidth, {
        damping: 30,        // Increased from 20 for quicker settling
        stiffness: 400,     // Increased from 90 for much snappier response
        mass: 0.8,          // Reduced mass for faster animation
      });
    }
  };

  // Pan gesture for smooth swiping
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
    })
    .onUpdate((event) => {
      'worklet';
      if (!isDragging.value) return;

      // Calculate the new position based on current tab and drag
      const baseOffset = -currentTabIndex.value * screenWidth;
      let newTranslateX = baseOffset + event.translationX;

      // Apply boundaries - don't let user drag beyond first/last tab
      const minTranslateX = -(tabNames.length - 1) * screenWidth;
      const maxTranslateX = 0;

      newTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, newTranslateX));

      translateX.value = newTranslateX;
    })
    .onEnd((event) => {
      'worklet';
      isDragging.value = false;

      const { translationX, velocityX } = event;
      const currentIndex = currentTabIndex.value;

      // Calculate which tab we should snap to
      let targetIndex = currentIndex;

      // 50% threshold logic
      const threshold = screenWidth * 0.5;
      const fastSwipeThreshold = 500; // velocity threshold for quick swipes

      if (Math.abs(velocityX) > fastSwipeThreshold) {
        // Fast swipe - respect the direction
        if (velocityX > 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        } else if (velocityX < 0 && currentIndex < tabNames.length - 1) {
          targetIndex = currentIndex + 1;
        }
      } else {
        // Slow swipe - use 50% threshold
        if (translationX > threshold && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        } else if (translationX < -threshold && currentIndex < tabNames.length - 1) {
          targetIndex = currentIndex + 1;
        }
      }

      console.log('Swipe ended:', {
        translationX,
        velocityX,
        currentIndex,
        targetIndex,
        threshold: threshold
      });

      // Animate to target tab
      runOnJS(navigateToTab)(targetIndex);
    });

  // Animated styles for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderTabContent = (tabName, index) => {
    const screenProps = {
      navigation: stackNavigation, // Pass the real stack navigation object
      route: { name: tabName },
    };

    switch (tabName) {
      case 'Home':
        return <HomeScreen {...screenProps} />;
      case 'Camera':
        return <CameraScreen {...screenProps} />;
      case 'Profile':
        return <ProfileScreen {...screenProps} />;
      default:
        return <View />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Re-enable GestureDetector for swiping functionality */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1, flexDirection: 'row', width: screenWidth * tabNames.length }, animatedStyle]}>
          {tabNames.map((tabName, index) => (
            <View
              key={tabName}
              style={{
                width: screenWidth,
                flex: 1
              }}
              pointerEvents={activeTabIndex === index ? 'auto' : 'none'} // Only allow touches on active tab
            >
              {renderTabContent(tabName, index)}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Custom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FF']}
          style={styles.tabBarGradient}
        >
          <View style={styles.tabBar}>
            {tabNames.map((tabName, index) => {
              const iconName = tabName === 'Home' ? 'home' : tabName === 'Camera' ? 'camera' : 'user';
              const isActive = activeTabIndex === index;

              // Create animated styles for each tab to show active state
              const tabAnimatedStyle = useAnimatedStyle(() => {
                const isActiveAnimated = currentTabIndex.value === index;
                return {
                  opacity: isActiveAnimated ? 1 : 0.6,
                  transform: [{ scale: isActiveAnimated ? 1.05 : 1 }],
                };
              });

              const tabIndicatorVisibility = useAnimatedStyle(() => {
                const isActiveAnimated = currentTabIndex.value === index;
                return {
                  opacity: isActiveAnimated ? 1 : 0,
                  transform: [{ scaleY: isActiveAnimated ? 1 : 0 }],
                };
              });

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.tabButton}
                  onPress={() => navigateToTab(index, true)} // Instant navigation for tab clicks
                >
                  <Animated.View style={[styles.tabButtonContent, tabAnimatedStyle]}>
                    {/* Individual tab indicator */}
                    <Animated.View style={[styles.tabIndicator, tabIndicatorVisibility]} />

                    <FontAwesome5
                      name={iconName}
                      size={20}
                      color={isActive ? '#35CAFC' : '#AAAAAA'}
                    />
                    <Text style={[styles.tabLabel, { color: isActive ? '#35CAFC' : '#AAAAAA' }]}>
                      {tabName}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

// Main tab navigator with swipe-enabled screens
const MainTabNavigator = ({ navigation, route }) => (
  <AnimatedTabNavigator navigation={navigation} route={route} />
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
                presentation: 'transparentModal',
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                gestureEnabled: false, // Disable default gesture since we're using custom
                cardStyle: {
                  backgroundColor: 'transparent',
                },
                cardOverlayEnabled: true,
                animationEnabled: true,
                transitionSpec: {
                  open: customTransitionSpec.open,
                  close: customTransitionSpec.close,
                }
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
            <Stack.Screen
              name="EditGoal"
              component={EditGoalScreen}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureResponseDistance: { vertical: 200 }
              }}
            />
            <Stack.Screen
              name="EditMilestone"
              component={EditMilestoneScreen}
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