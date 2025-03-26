import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Goal } from '../types';

// Update this to match your backend URL
// Option 1: For emulator or dev on same machine (DON'T USE THIS - DOESN'T WORK ON REAL DEVICES) 
// const API_URL = 'http://localhost:5001/api'; 
// Option 2: For physical device or networks where IP is needed (USE THIS ONE)
const API_URL = `http://${process.env.IP}:5001/api`;
// Option 3: If running on the same device
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
  toggleMilestoneCompletion: (goalId: string, milestoneId: string, isCompleted: boolean) => Promise<any>;
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
        completed: goal.completed,
        milestones: goal.milestones.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          completed: m.completed,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })),
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
        completed: res.data.completed,
        milestones: res.data.milestones.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          completed: m.completed,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
        })),
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
        completed: res.data.completed,
        milestones: res.data.milestones?.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          completed: m.completed,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
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
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await axios.put(`${API_URL}/goals/${id}`, goal);
      
      // Transform backend format to frontend format
      const transformedGoal = {
        id: res.data._id,
        title: res.data.title,
        targetDate: res.data.targetDate,
        isPinned: res.data.isPinned,
        completed: res.data.completed,
        milestones: res.data.milestones?.map((m: any) => ({
          id: m._id,
          title: m.title,
          description: m.description,
          completed: m.completed,
          imageUri: m.imageUri,
          isMilestone: m.isMilestone,
          createdAt: m.createdAt
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
        completed: res.data.completed,
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
        completed: res.data.completed,
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

  // Toggle milestone completion
  const toggleMilestoneCompletion = async (goalId: string, milestoneId: string, isCompleted: boolean): Promise<any> => {
    try {
      return updateMilestone(goalId, milestoneId, { completed: isCompleted });
    } catch (error) {
      console.error('Toggle milestone completion error:', error);
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
        toggleMilestoneCompletion
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