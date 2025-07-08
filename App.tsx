import { GestureHandlerRootView } from 'react-native-gesture-handler';

// @ts-nocheck
import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Navigation from './src/navigation';
import { AuthProvider } from './src/contexts/FirebaseAuthContext';
import { GoalProvider } from './src/contexts/FirebaseGoalContext';
import { StatusBar, LogBox } from 'react-native';

// Ignore specific warnings for animation
LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'Animated: `useNativeDriver` was not specified'
]);

// Custom theme with playful colors inspired by Snapchat and BeReal
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF5F5F', // Playful coral color
    accent: '#35CAFC', // Bright blue accent
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#333333',
    placeholder: '#BBBBBB',
    success: '#4CD964', // iOS-inspired success green
    info: '#35CAFC',
    warning: '#FFCC00', // Snapchat yellow
    error: '#FF3B30', // iOS-inspired error red
    disabled: '#E5E5E5',
    card: '#FFFFFF',
    border: '#E5E5E5',
  },
  fonts: {
    ...DefaultTheme.fonts,
    // Make the font a bit more playful and rounded
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '600',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '200',
    },
  },
  roundness: 20, // More rounded corners
  animation: {
    scale: 1.0,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <GoalProvider>
          <PaperProvider theme={theme}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} animated={true} />
            <Navigation />
          </PaperProvider>
        </GoalProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
