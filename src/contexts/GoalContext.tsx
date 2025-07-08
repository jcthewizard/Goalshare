import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Goal } from '../types';

// Update this to match your backend URL
// Option 1: For development on same machine (USE FOR SIMULATOR)
// const API_URL = 'http://localhost:5001/api';
// Option 2: For physical device or networks where IP is needed (USE FOR IPHONE)
const API_URL = 'http://192.168.181.206:5001/api';
// Option 3: Alternative local address
// const API_URL = 'http://127.0.0.1:5001/api';

// Configure axios timeout for goal-related requests
axios.defaults.timeout = 15000; // 15 second timeout

// Goal state type
interface GoalState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
}

// Goal action types
type GoalAction =
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_MILESTONE'; payload: { goalId: string; milestone: any } }
  | { type: 'UPDATE_MILESTONE'; payload: { goalId: string; milestoneId: string; milestone: any } }
  | { type: 'DELETE_MILESTONE'; payload: { goalId: string; milestoneId: string } }
  | { type: 'ADD_TIMELINE_ITEM'; payload: { goalId: string; item: any } }
  | { type: 'DELETE_TIMELINE_ITEM'; payload: { goalId: string; itemId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Goal context type
interface GoalContextType {
  goalState: GoalState;
  getGoals: () => Promise<void>;
  getGoal: (id: string) => Promise<Goal>;
  addGoal: (goal: Partial<Goal>) => Promise<Goal>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  addMilestone: (goalId: string, milestone: any) => Promise<any>;
  updateMilestone: (goalId: string, milestoneId: string, milestone: any) => Promise<any>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  addTimelineItem: (goalId: string, item: any) => Promise<any>;
  deleteTimelineItem: (goalId: string, itemId: string) => Promise<void>;
}

// Initial state
const initialState: GoalState = {
  goals: [],
  loading: false,
  error: null
};

// Create context
const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Goal reducer
const goalReducer = (state: GoalState, action: GoalAction): GoalState => {
  switch (action.type) {
    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload,
        loading: false
      };
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [action.payload, ...state.goals],
        loading: false
      };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
        loading: false
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
        loading: false
      };
    case 'ADD_MILESTONE':
      return {
        ...state,
        goals: state.goals.map(goal => {
          if (goal.id === action.payload.goalId) {
            return {
              ...goal,
              milestones: [action.payload.milestone, ...(goal.milestones || [])]
            };
          }
          return goal;
        }),
        loading: false
      };
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        goals: state.goals.map(goal => {
          if (goal.id === action.payload.goalId) {
            return {
              ...goal,
              milestones: (goal.milestones || []).map(milestone =>
                milestone.id === action.payload.milestoneId
                  ? action.payload.milestone
                  : milestone
              )
            };
          }
          return goal;
        }),
        loading: false
      };
    case 'DELETE_MILESTONE':
      return {
        ...state,
        goals: state.goals.map(goal => {
          if (goal.id === action.payload.goalId) {
            return {
              ...goal,
              milestones: (goal.milestones || []).filter(
                milestone => milestone.id !== action.payload.milestoneId
              )
            };
          }
          return goal;
        }),
        loading: false
      };
    case 'ADD_TIMELINE_ITEM':
      return {
        ...state,
        goals: state.goals.map(goal => {
          if (goal.id === action.payload.goalId) {
            return {
              ...goal,
              timeline: [action.payload.item, ...(goal.timeline || [])]
            };
          }
          return goal;
        }),
        loading: false
      };
    case 'DELETE_TIMELINE_ITEM':
      return {
        ...state,
        goals: state.goals.map(goal => {
          if (goal.id === action.payload.goalId) {
            return {
              ...goal,
              timeline: (goal.timeline || []).filter(
                item => item.id !== action.payload.itemId
              )
            };
          }
          return goal;
        }),
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// Provider component
export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(goalReducer, initialState);
  const { token } = useAuth();

  // Set axios auth header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Get all goals for the current user
  const getGoals = async (): Promise<void> => {
    if (!token) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🔍 GOALS: Fetching goals with token:', token ? 'Token exists' : 'No token');

      // Explicitly set the auth header for this request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔑 GOALS: Using headers:', config.headers);
      const res = await axios.get(`${API_URL}/goals`, config);

      // Transform backend format to frontend format
      const transformedGoals = res.data.map((goal: any) => ({
        id: goal._id,
        title: goal.title,
        targetDate: goal.targetDate,
        isPinned: goal.isPinned,
        isCompleted: goal.completed || goal.isCompleted,
        completedDate: goal.completedDate,
        themeColors: goal.themeColors || {
          primary: '#FF5F5F',
          secondary: '#FF8C8C',
          accent: '#FFD700'
        },
        milestones: goal.milestones.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })),
        timeline: goal.timeline?.map((t: any) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          imageUri: t.imageUri,
          isMilestone: t.isMilestone,
          createdAt: t.createdAt
        })) || [],
        createdAt: goal.createdAt
      }));

      dispatch({ type: 'SET_GOALS', payload: transformedGoals });
    } catch (error) {
      console.error('Get goals error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error fetching goals' });
    }
  };

  // Get a single goal by ID
  const getGoal = async (id: string): Promise<Goal> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.get(`${API_URL}/goals/${id}`);

      // Transform backend format to frontend format
      const transformedGoal = {
        id: res.data._id,
        title: res.data.title,
        targetDate: res.data.targetDate,
        isPinned: res.data.isPinned,
        isCompleted: res.data.completed || res.data.isCompleted,
        completedDate: res.data.completedDate,
        themeColors: res.data.themeColors || {
          primary: '#FF5F5F',
          secondary: '#FF8C8C',
          accent: '#FFD700'
        },
        milestones: res.data.milestones.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })),
        timeline: res.data.timeline?.map((t: any) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          imageUri: t.imageUri,
          isMilestone: t.isMilestone,
          createdAt: t.createdAt
        })) || [],
        createdAt: res.data.createdAt
      };

      dispatch({ type: 'SET_LOADING', payload: false });
      return transformedGoal;
    } catch (error) {
      console.error('Get goal error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error fetching goal' });
      throw error;
    }
  };

  // Add a new goal
  const addGoal = async (goal: Partial<Goal>): Promise<Goal> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.post(`${API_URL}/goals`, goal);

      // Transform backend format to frontend format
      const transformedGoal = {
        id: res.data._id,
        title: res.data.title,
        targetDate: res.data.targetDate,
        isPinned: res.data.isPinned,
        isCompleted: res.data.completed || res.data.isCompleted,
        completedDate: res.data.completedDate,
        themeColors: res.data.themeColors || {
          primary: '#FF5F5F',
          secondary: '#FF8C8C',
          accent: '#FFD700'
        },
        milestones: res.data.milestones?.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })) || [],
        timeline: res.data.timeline?.map((t: any) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          imageUri: t.imageUri,
          isMilestone: t.isMilestone,
          createdAt: t.createdAt
        })) || [],
        createdAt: res.data.createdAt
      };

      dispatch({ type: 'ADD_GOAL', payload: transformedGoal });
      return transformedGoal;
    } catch (error) {
      console.error('Add goal error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adding goal' });
      throw error;
    }
  };

  // Update an existing goal
  const updateGoal = async (id: string, goal: Partial<Goal>): Promise<Goal> => {
    try {
      console.log('🔄 Updating goal:', id, 'with data:', goal);
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.put(`${API_URL}/goals/${id}`, goal);
      console.log('📥 Update goal response:', res.data);

      // Transform backend format to frontend format
      const transformedGoal = {
        id: res.data._id,
        title: res.data.title,
        targetDate: res.data.targetDate,
        isPinned: res.data.isPinned,
        isCompleted: res.data.completed || res.data.isCompleted,
        completedDate: res.data.completedDate,
        themeColors: res.data.themeColors || {
          primary: '#FF5F5F',
          secondary: '#FF8C8C',
          accent: '#FFD700'
        },
        milestones: res.data.milestones?.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })) || [],
        timeline: res.data.timeline?.map((t: any) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          imageUri: t.imageUri,
          isMilestone: t.isMilestone,
          createdAt: t.createdAt
        })) || [],
        createdAt: res.data.createdAt
      };

      dispatch({ type: 'UPDATE_GOAL', payload: transformedGoal });
      return transformedGoal;
    } catch (error) {
      console.error('Update goal error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating goal' });
      throw error;
    }
  };

  // Delete a goal
  const deleteGoal = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await axios.delete(`${API_URL}/goals/${id}`);
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error) {
      console.error('Delete goal error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting goal' });
      throw error;
    }
  };

  // Add a milestone to a goal
  const addMilestone = async (goalId: string, milestone: any): Promise<any> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.post(`${API_URL}/goals/${goalId}/milestones`, milestone);

      // Transform backend format to frontend format
      const transformedMilestone = {
        id: res.data._id,
        title: res.data.title,
        description: res.data.description,
        imageUri: res.data.imageUri,
        isMilestone: res.data.isMilestone,
        createdAt: res.data.createdAt
      };

      dispatch({
        type: 'ADD_MILESTONE',
        payload: { goalId, milestone: transformedMilestone }
      });

      return transformedMilestone;
    } catch (error) {
      console.error('Add milestone error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adding milestone' });
      throw error;
    }
  };

  // Update a milestone
  const updateMilestone = async (goalId: string, milestoneId: string, milestone: any): Promise<any> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.put(`${API_URL}/goals/${goalId}/milestones/${milestoneId}`, milestone);

      // Transform backend format to frontend format
      const transformedMilestone = {
        id: res.data._id,
        title: res.data.title,
        description: res.data.description,
        imageUri: res.data.imageUri,
        isMilestone: res.data.isMilestone,
        createdAt: res.data.createdAt
      };

      dispatch({
        type: 'UPDATE_MILESTONE',
        payload: { goalId, milestoneId, milestone: transformedMilestone }
      });

      return transformedMilestone;
    } catch (error) {
      console.error('Update milestone error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating milestone' });
      throw error;
    }
  };

  // Delete a milestone
  const deleteMilestone = async (goalId: string, milestoneId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await axios.delete(`${API_URL}/goals/${goalId}/milestones/${milestoneId}`);
      dispatch({
        type: 'DELETE_MILESTONE',
        payload: { goalId, milestoneId }
      });
    } catch (error) {
      console.error('Delete milestone error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting milestone' });
      throw error;
    }
  };

  // Add a timeline item to a goal
  const addTimelineItem = async (goalId: string, item: any): Promise<any> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.post(`${API_URL}/goals/${goalId}/timeline`, item);

      // Transform backend format to frontend format
      const transformedItem = {
        id: res.data._id,
        title: res.data.title,
        description: res.data.description,
        imageUri: res.data.imageUri,
        isMilestone: res.data.isMilestone,
        createdAt: res.data.createdAt
      };

      dispatch({
        type: 'ADD_TIMELINE_ITEM',
        payload: { goalId, item: transformedItem }
      });

      return transformedItem;
    } catch (error) {
      console.error('Add timeline item error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adding timeline item' });
      throw error;
    }
  };

  // Delete a timeline item
  const deleteTimelineItem = async (goalId: string, itemId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await axios.delete(`${API_URL}/goals/${goalId}/timeline/${itemId}`);
      dispatch({
        type: 'DELETE_TIMELINE_ITEM',
        payload: { goalId, itemId }
      });
    } catch (error) {
      console.error('Delete timeline item error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting timeline item' });
      throw error;
    }
  };

  return (
    <GoalContext.Provider
      value={{
        goalState: state,
        getGoals,
        getGoal,
        addGoal,
        updateGoal,
        deleteGoal,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addTimelineItem,
        deleteTimelineItem
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

// Hook to use goal context
export const useGoals = (): GoalContextType => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};