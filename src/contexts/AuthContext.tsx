import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Update this to match your backend URL
// Option 1: For development on same machine (USE FOR SIMULATOR)
// const API_URL = 'http://localhost:5001/api';
// Option 2: For physical device or networks where IP is needed (USE FOR IPHONE)
const API_URL = 'http://192.168.181.206:5001/api'; 
// Option 3: Alternative local address
// const API_URL = 'http://127.0.0.1:5001/api';

// Configure axios defaults
axios.defaults.timeout = 15000; // Increased timeout to 15 seconds

// Add request/response interceptors for debugging
axios.interceptors.request.use(request => {
  console.log('🚀 REQUEST:', {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers
  });
  return request;
}, error => {
  console.error('❌ REQUEST ERROR:', error);
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  console.log('✅ RESPONSE:', {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    headers: response.headers
  });
  return response;
}, error => {
  console.error('❌ RESPONSE ERROR:', {
    message: error.message,
    code: error.code,
    config: error.config ? {
      url: error.config.url,
      method: error.config.method,
      timeout: error.config.timeout
    } : 'No config',
    response: error.response ? {
      status: error.response.status,
      data: error.response.data
    } : 'No response'
  });
  return Promise.reject(error);
});

/**
 * Auth action types
 */
type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_TOKEN'; payload: string | null };

/**
 * Auth context interface with authentication methods
 */
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginDev: () => void;
}

/**
 * Initial auth state
 */
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
  token: null,
};

/**
 * Create a mock user for development purposes
 */
const devUser: User = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: null,
};

/**
 * Auth reducer for state management
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    default:
      return state;
  }
};

/**
 * Storage keys for persisting auth state
 */
const USER_STORAGE_KEY = '@goalshare:user';
const TOKEN_STORAGE_KEY = '@goalshare:token';

/**
 * Auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Setup axios auth header when token changes
  useEffect(() => {
    if (state.token) {
      console.log('🔑 AUTH: Setting auth header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      console.log('⚠️ AUTH: No token available to set auth header');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  /**
   * Load auth state from storage on initial render
   */
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        console.log('🔄 AUTH: Loaded token from storage:', storedToken ? 'Token exists' : 'No token');
        
        if (storedToken) {
          console.log('🔑 AUTH: Setting token from storage');
          dispatch({ type: 'SET_TOKEN', payload: storedToken });
          await fetchUserData(storedToken);
        } else {
          console.log('⚠️ AUTH: No token found in storage');
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    loadAuthState();
  }, []);

  /**
   * Fetch user data from the API
   */
  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert backend user to our User type
      const userData = response.data;
      const user: User = {
        uid: userData._id,
        email: userData.email,
        displayName: userData.name || userData.email.split('@')[0],
        photoURL: null,
      };
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // Token might be invalid/expired
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'SET_USER', payload: null });
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  /**
   * Login function
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔑 LOGIN: Attempt with email:', email);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Try connecting to the backend
      try {
        console.log('🔌 LOGIN: Connecting to backend at:', API_URL);
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log('✅ LOGIN: Backend connection successful');
        
        const { token, user: userData } = response.data;
        
        // Convert backend user to our User type
        const user: User = {
          uid: userData._id,
          email: userData.email,
          displayName: userData.name || userData.email.split('@')[0],
          photoURL: null,
        };
        
        console.log('💾 LOGIN: Saving token and user data to storage');
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
        console.log('✅ LOGIN: Process completed successfully');
      } catch (error: any) {
        console.error('❌ LOGIN: Connection error details:', error);
        console.error('❌ LOGIN: Error type:', typeof error);
        console.error('❌ LOGIN: Is AxiosError:', error.isAxiosError ? 'Yes' : 'No');
        console.error('❌ LOGIN: Error name:', error.name);
        console.error('❌ LOGIN: Error code:', error.code);
        console.error('❌ LOGIN: Error stack:', error.stack);
        
        if (error.config) {
          console.error('❌ LOGIN: Request config:', {
            url: error.config.url,
            method: error.config.method,
            timeout: error.config.timeout,
            headers: error.config.headers
          });
        }
        
        // Network connectivity check
        if (error.message?.includes('Network Error')) {
          console.error('❌ LOGIN: Network connectivity issue detected');
        }
        
        // Check for MongoDB connection errors
        const errorDetails = error.response?.data?.message || '';
        if (error.code === 'ECONNABORTED' || 
            error.message?.includes('timeout') || 
            errorDetails.includes('MongoDB') ||
            error.message?.includes('Network Error')) {
          
          // Show a more helpful error for MongoDB connection issues
          const errorMessage = 'Backend database connection error. Please try using the Direct Login button in Development Options.';
          console.error('❌ LOGIN: Database connection error detected');
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
          throw new Error(errorMessage);
        }
        
        const errorMessage = error.response?.data?.message || 
                            (error instanceof Error ? error.message : 'Login failed');
        console.error('❌ LOGIN: Error message set:', errorMessage);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // This will catch any errors from the first try block
      console.error('❌ LOGIN: Final error handler reached:', error.message);
      throw error; 
    } finally {
      console.log('🏁 LOGIN: Process finished (success or failure)');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Register function
   */
  const register = async (email: string, password: string, name?: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await axios.post(`${API_URL}/auth/register`, { 
        email, 
        password,
        name: name || email.split('@')[0]
      });
      
      const { token, user: userData } = response.data;
      
      // Convert backend user to our User type
      const user: User = {
        uid: userData._id,
        email: userData.email,
        displayName: userData.name || userData.email.split('@')[0],
        photoURL: null,
      };
      
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      
      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          (error instanceof Error ? error.message : 'Registration failed');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call the logout endpoint if token exists
      if (state.token) {
        try {
          await axios.post(`${API_URL}/auth/logout`);
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with local logout even if API call fails
        }
      }
      
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Development login (keep for testing)
   */
  const loginDev = (): void => {
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(devUser))
      .then(() => {
        dispatch({ type: 'SET_USER', payload: devUser });
        
        // For dev login, generate a fake token
        const fakeToken = 'dev-token-' + Date.now();
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, fakeToken);
        dispatch({ type: 'SET_TOKEN', payload: fakeToken });
      })
      .catch(error => {
        console.error('Failed to store dev user:', error);
      });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        initialized: state.initialized,
        token: state.token,
        login,
        register,
        logout,
        loginDev,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};