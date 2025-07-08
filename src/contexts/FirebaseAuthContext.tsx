import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔑 FIREBASE AUTH: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔑 FIREBASE AUTH: Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔑 FIREBASE AUTH: Logging in user:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ FIREBASE AUTH: Login successful');

      // Store user info locally
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      }));
    } catch (error: any) {
      console.error('❌ FIREBASE AUTH: Login failed:', error.message);
      throw new Error(error.message);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      console.log('🔑 FIREBASE AUTH: Registering user:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's display name
      await updateProfile(result.user, { displayName: name });

      console.log('✅ FIREBASE AUTH: Registration successful');

      // Store user info locally
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: name
      }));
    } catch (error: any) {
      console.error('❌ FIREBASE AUTH: Registration failed:', error.message);
      throw new Error(error.message);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔑 FIREBASE AUTH: Logging out user');
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      console.log('✅ FIREBASE AUTH: Logout successful');
    } catch (error: any) {
      console.error('❌ FIREBASE AUTH: Logout failed:', error.message);
      throw new Error(error.message);
    }
  };

  const updateUserProfile = async (displayName: string): Promise<void> => {
    try {
      if (!user) throw new Error('No user logged in');

      console.log('🔑 FIREBASE AUTH: Updating user profile');
      await updateProfile(user, { displayName });

      // Update local storage
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: displayName
      }));

      console.log('✅ FIREBASE AUTH: Profile updated successfully');
    } catch (error: any) {
      console.error('❌ FIREBASE AUTH: Profile update failed:', error.message);
      throw new Error(error.message);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initialized: !loading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};