import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local IP address for physical device testing
const getApiUrl = () => {
  // For Expo development
  if (__DEV__) {
    // If running on a physical device, use your Mac's IP
    if (Platform.OS === 'ios' && !Constants.isDevice) {
      // iOS Simulator - can use localhost
      return 'http://localhost:5001/api';
    } else {
      // Physical device - use your Mac's IP address
      return 'http://192.168.181.206:5001/api';
    }
  }
  
  // Production API URL (when you deploy)
  return 'https://your-production-api.com/api';
};

export const API_URL = getApiUrl();

export default {
  API_URL,
}; 