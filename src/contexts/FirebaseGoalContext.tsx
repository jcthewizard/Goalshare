import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from './FirebaseAuthContext';
import { Goal, TimelineItem, Milestone } from '../types';

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  getGoals: () => Promise<void>;
  addGoal: (goalData: Partial<Goal>) => Promise<string>;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addTimelineItem: (goalId: string, itemData: Partial<TimelineItem>) => Promise<void>;
  deleteTimelineItem: (goalId: string, itemId: string) => Promise<void>;
  addMilestone: (goalId: string, milestoneData: Partial<Milestone>) => Promise<void>;
  updateMilestone: (goalId: string, milestoneId: string, milestoneData: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  uploadImage: (uri: string, path: string) => Promise<string>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

interface GoalProviderProps {
  children: ReactNode;
}

export const GoalProvider: React.FC<GoalProviderProps> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getGoals = async (): Promise<void> => {
    if (!user) {
      console.log('🎯 FIREBASE GOALS: No user logged in');
      setGoals([]);
      return;
    }

    try {
      console.log('🎯 FIREBASE GOALS: Fetching goals for user:', user.uid);
      setLoading(true);

      const goalsRef = collection(db, 'goals');
      const q = query(
        goalsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const goalsData: Goal[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        goalsData.push({
          id: doc.id,
          title: data.title,
          targetDate: data.targetDate?.toDate ? data.targetDate.toDate() : (data.targetDate ? new Date(data.targetDate) : null),
          isPinned: data.isPinned || false,
          isCompleted: data.isCompleted || false,
          completedDate: data.completedDate?.toDate ? data.completedDate.toDate() : (data.completedDate ? new Date(data.completedDate) : null),
          themeColors: data.themeColors || {
            primary: '#FF5F5F',
            secondary: '#FF8C8C',
            accent: '#FFD700'
          },
          milestones: data.milestones || [],
          timeline: data.timeline || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        });
      });

      console.log('✅ FIREBASE GOALS: Fetched', goalsData.length, 'goals');
      setGoals(goalsData);
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error fetching goals:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goalData: Partial<Goal>): Promise<string> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Adding new goal');
      const goalsRef = collection(db, 'goals');

      const newGoal = {
        ...goalData,
        userId: user.uid,
        isPinned: goalData.isPinned || false,
        isCompleted: false,
        milestones: [],
        timeline: [],
        themeColors: goalData.themeColors || {
          primary: '#FF5F5F',
          secondary: '#FF8C8C',
          accent: '#FFD700'
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(goalsRef, newGoal);
      console.log('✅ FIREBASE GOALS: Goal added with ID:', docRef.id);

      // Refresh goals
      await getGoals();

      return docRef.id;
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error adding goal:', error.message);
      throw new Error(error.message);
    }
  };

  const updateGoal = async (goalId: string, goalData: Partial<Goal>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Updating goal:', goalId);
      const goalRef = doc(db, 'goals', goalId);

      const updateData = {
        ...goalData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(goalRef, updateData);
      console.log('✅ FIREBASE GOALS: Goal updated successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error updating goal:', error.message);
      throw new Error(error.message);
    }
  };

  const deleteGoal = async (goalId: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Deleting goal:', goalId);
      const goalRef = doc(db, 'goals', goalId);
      await deleteDoc(goalRef);
      console.log('✅ FIREBASE GOALS: Goal deleted successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error deleting goal:', error.message);
      throw new Error(error.message);
    }
  };

  const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
      console.log('📷 FIREBASE STORAGE: Uploading image');

      // Validate URI
      if (!uri || !uri.startsWith('file://')) {
        throw new Error('Invalid image URI');
      }

      // Convert URI to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Invalid image data');
      }

      // Create storage reference
      const imageRef = ref(storage, `images/${user?.uid}/${path}/${Date.now()}.jpg`);

      // Upload image
      await uploadBytes(imageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      console.log('✅ FIREBASE STORAGE: Image uploaded successfully');

      return downloadURL;
    } catch (error: any) {
      console.error('❌ FIREBASE STORAGE: Error uploading image:', error.message);
      throw new Error(error.message);
    }
  };

  const addTimelineItem = async (goalId: string, itemData: Partial<TimelineItem>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Adding timeline item to goal:', goalId);

      let imageUrl = itemData.imageUri;

      // Upload image if it's a local file
      if (itemData.imageUri && itemData.imageUri.startsWith('file://')) {
        imageUrl = await uploadImage(itemData.imageUri, `timeline/${goalId}`);
      }

      const timelineItem = {
        id: Date.now().toString(), // Simple ID generation
        title: itemData.title || 'Timeline item',
        description: itemData.description || '',
        imageUri: imageUrl || null,
        isMilestone: itemData.isMilestone || false,
        createdAt: new Date()
      };

      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        timeline: arrayUnion(timelineItem)
      });

      console.log('✅ FIREBASE GOALS: Timeline item added successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error adding timeline item:', error.message);
      throw new Error(error.message);
    }
  };

  const deleteTimelineItem = async (goalId: string, itemId: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Deleting timeline item:', itemId);

      // Find the goal and timeline item
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const timelineItem = goal.timeline?.find(item => item.id === itemId);
      if (!timelineItem) throw new Error('Timeline item not found');

      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        timeline: arrayRemove(timelineItem)
      });

      console.log('✅ FIREBASE GOALS: Timeline item deleted successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error deleting timeline item:', error.message);
      throw new Error(error.message);
    }
  };

  const addMilestone = async (goalId: string, milestoneData: Partial<Milestone>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Adding milestone to goal:', goalId);

      let imageUrl = milestoneData.imageUri;

      // Upload image if it's a local file
      if (milestoneData.imageUri && milestoneData.imageUri.startsWith('file://')) {
        imageUrl = await uploadImage(milestoneData.imageUri, `milestones/${goalId}`);
      }

      const milestone = {
        id: Date.now().toString(), // Simple ID generation
        title: milestoneData.title || 'Milestone',
        description: milestoneData.description || '',
        imageUri: imageUrl || null,
        targetDate: milestoneData.targetDate || null,
        isMilestone: true,
        createdAt: new Date()
      };

      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        milestones: arrayUnion(milestone)
      });

      console.log('✅ FIREBASE GOALS: Milestone added successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error adding milestone:', error.message);
      throw new Error(error.message);
    }
  };

  const updateMilestone = async (goalId: string, milestoneId: string, milestoneData: Partial<Milestone>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Updating milestone:', goalId, milestoneId);

      // Find the goal and milestone
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const milestoneIndex = goal.milestones?.findIndex(m => m.id === milestoneId);
      if (milestoneIndex === -1 || milestoneIndex === undefined) throw new Error('Milestone not found');

      // Create updated milestones array
      const updatedMilestones = [...(goal.milestones || [])];
      updatedMilestones[milestoneIndex] = {
        ...updatedMilestones[milestoneIndex],
        ...milestoneData,
        id: milestoneId // Ensure ID is preserved
      };

      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        milestones: updatedMilestones,
        updatedAt: serverTimestamp()
      });

      console.log('✅ FIREBASE GOALS: Milestone updated successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error updating milestone:', error.message);
      throw new Error(error.message);
    }
  };

  const deleteMilestone = async (goalId: string, milestoneId: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🎯 FIREBASE GOALS: Deleting milestone:', milestoneId);

      // Find the goal and milestone
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const milestone = goal.milestones?.find(m => m.id === milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        milestones: arrayRemove(milestone)
      });

      console.log('✅ FIREBASE GOALS: Milestone deleted successfully');

      // Refresh goals
      await getGoals();
    } catch (error: any) {
      console.error('❌ FIREBASE GOALS: Error deleting milestone:', error.message);
      throw new Error(error.message);
    }
  };

  // Load goals when user changes
  useEffect(() => {
    if (user) {
      getGoals();
    } else {
      setGoals([]);
    }
  }, [user]);

  const value: GoalContextType = {
    goals,
    loading,
    getGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    addTimelineItem,
    deleteTimelineItem,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    uploadImage
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = (): GoalContextType => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};