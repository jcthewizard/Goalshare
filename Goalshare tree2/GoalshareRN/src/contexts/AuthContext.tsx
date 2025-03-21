import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth action types
 */
type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean };

/**
 * Auth context interface with authentication methods
 */
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
    default:
      return state;
  }
};

/**
 * Storage key for persisting user
 */
const USER_STORAGE_KEY = '@goalshare:user';

/**
 * Auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Load user from storage on initial render
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedUser) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(storedUser) });
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    loadUser();
  }, []);

  /**
   * Login function
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      /**
       * For now, let's accept any email/password combo for development
       * In the future, integrate with real Firebase auth
       */
      if (email && password) {
        const user: User = {
          uid: 'user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
        };

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error('Email and password required');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Register function
   */
  const register = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      /**
       * For development, just create a user without real auth
       */
      if (email && password) {
        const user: User = {
          uid: 'user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
        };

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error('Email and password required');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
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
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
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
   * Development login
   */
  const loginDev = (): void => {
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(devUser))
      .then(() => {
        dispatch({ type: 'SET_USER', payload: devUser });
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