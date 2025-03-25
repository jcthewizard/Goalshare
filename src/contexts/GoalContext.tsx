import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { Goal, Milestone, GoalState } from '../types';

// Context type
type GoalContextType = {
  goalState: GoalState;
  fetchGoals: () => Promise<void>;
  addGoal: (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'milestones' | 'completed'>) => Promise<string>;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  completeGoal: (goalId: string) => Promise<void>;
  addMilestone: (goalId: string, milestoneData: Omit<Milestone, 'id' | 'completed'>) => Promise<string>;
  updateMilestone: (goalId: string, milestoneId: string, milestoneData: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  completeMilestone: (goalId: string, milestoneId: string, isCompleted: boolean) => Promise<void>;
};

// Initial state
const initialState: GoalState = {
  goals: [],
  loading: false,
  error: null,
};

// Mock data for development
const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-1',
    userId: 'dev-user-123',
    title: 'Learn React Native',
    targetDate: new Date(2024, 11, 31),
    isPinned: true,
    createdAt: new Date(2024, 5, 1),
    completed: false,
    milestones: [
      {
        id: 'milestone-1',
        title: 'Set up development environment',
        description: 'Install Node.js, expo CLI, and Android Studio',
        completed: true,
      },
      {
        id: 'milestone-2',
        title: 'Complete React Native tutorial',
        description: 'Follow the official React Native tutorial',
        completed: false,
      },
      {
        id: 'milestone-3',
        title: 'Build first app',
        description: 'Create a basic to-do app with React Native',
        completed: false,
      },
    ],
  },
  {
    id: 'goal-2',
    userId: 'dev-user-123',
    title: 'Get fit',
    targetDate: new Date(2024, 11, 31),
    isPinned: false,
    createdAt: new Date(2024, 5, 15),
    completed: false,
    milestones: [
      {
        id: 'milestone-4',
        title: 'Join a gym',
        description: 'Find a gym close to home and sign up',
        completed: true,
      },
      {
        id: 'milestone-5',
        title: 'Work out 3x per week',
        description: 'Establish a workout routine',
        completed: false,
      },
    ],
  },
];

// Action types
type GoalAction =
  | { type: 'FETCH_GOALS_INIT' }
  | { type: 'FETCH_GOALS_SUCCESS'; payload: Goal[] }
  | { type: 'FETCH_GOALS_ERROR'; payload: string }
  | { type: 'ADD_GOAL_SUCCESS'; payload: Goal }
  | { type: 'UPDATE_GOAL_SUCCESS'; payload: { goalId: string; data: Partial<Goal> } }
  | { type: 'DELETE_GOAL_SUCCESS'; payload: string }
  | { type: 'ADD_MILESTONE_SUCCESS'; payload: { goalId: string; milestone: Milestone } }
  | { type: 'UPDATE_MILESTONE_SUCCESS'; payload: { goalId: string; milestoneId: string; data: Partial<Milestone> } }
  | { type: 'DELETE_MILESTONE_SUCCESS'; payload: { goalId: string; milestoneId: string } };

// Reducer
const goalReducer = (state: GoalState, action: GoalAction): GoalState => {
  switch (action.type) {
    case 'FETCH_GOALS_INIT':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_GOALS_SUCCESS':
      return {
        ...state,
        goals: action.payload,
        loading: false,
        error: null,
      };
    case 'FETCH_GOALS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'ADD_GOAL_SUCCESS':
      return {
        ...state,
        goals: [...state.goals, action.payload],
        loading: false,
        error: null,
      };
    case 'UPDATE_GOAL_SUCCESS': {
      const { goalId, data } = action.payload;
      const updatedGoals = state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...data } : goal
      );
      return {
        ...state,
        goals: updatedGoals,
      };
    }
    case 'DELETE_GOAL_SUCCESS':
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload),
      };
    case 'ADD_MILESTONE_SUCCESS': {
      const { goalId, milestone } = action.payload;
      const updatedGoals = state.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, milestones: [...goal.milestones, milestone] }
          : goal
      );
      return {
        ...state,
        goals: updatedGoals,
      };
    }
    case 'UPDATE_MILESTONE_SUCCESS': {
      const { goalId, milestoneId, data } = action.payload;
      const updatedGoals = state.goals.map((goal) => {
        if (goal.id === goalId) {
          const updatedMilestones = goal.milestones.map((milestone) =>
            milestone.id === milestoneId ? { ...milestone, ...data } : milestone
          );
          return { ...goal, milestones: updatedMilestones };
        }
        return goal;
      });
      return {
        ...state,
        goals: updatedGoals,
      };
    }
    case 'DELETE_MILESTONE_SUCCESS': {
      const { goalId, milestoneId } = action.payload;
      const updatedGoals = state.goals.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            milestones: goal.milestones.filter((m) => m.id !== milestoneId),
          };
        }
        return goal;
      });
      return {
        ...state,
        goals: updatedGoals,
      };
    }
    default:
      return state;
  }
};

// Create context
const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Provider component
export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goalState, dispatch] = useReducer(goalReducer, initialState);
  const { user } = useAuth();

  // Fetch goals for the current user (mock implementation)
  const fetchGoals = async () => {
    try {
      dispatch({ type: 'FETCH_GOALS_INIT' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use mock data
      const filteredGoals = user ?
        MOCK_GOALS.filter(goal => goal.userId === user.uid) :
        [];

      dispatch({ type: 'FETCH_GOALS_SUCCESS', payload: filteredGoals });
    } catch (error) {
      let errorMessage = 'Failed to fetch goals';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'FETCH_GOALS_ERROR', payload: errorMessage });
    }
  };

  // Add a new goal
  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'milestones' | 'completed'>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newGoalId = `goal-${Date.now()}`;

      const goalWithId: Goal = {
        ...goalData,
        id: newGoalId,
        userId: user.uid,
        createdAt: new Date(),
        milestones: [],
        completed: false,
      };

      dispatch({ type: 'ADD_GOAL_SUCCESS', payload: goalWithId });

      return newGoalId;
    } catch (error) {
      let errorMessage = 'Failed to add goal';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Update a goal
  const updateGoal = async (goalId: string, goalData: Partial<Goal>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      dispatch({
        type: 'UPDATE_GOAL_SUCCESS',
        payload: { goalId, data: goalData },
      });
    } catch (error) {
      let errorMessage = 'Failed to update goal';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Delete a goal
  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      dispatch({ type: 'DELETE_GOAL_SUCCESS', payload: goalId });
    } catch (error) {
      let errorMessage = 'Failed to delete goal';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Complete a goal
  const completeGoal = async (goalId: string) => {
    return updateGoal(goalId, { completed: true });
  };

  // Add a milestone
  const addMilestone = async (goalId: string, milestoneData: Omit<Milestone, 'id' | 'completed'>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const milestoneId = `milestone-${Date.now()}`;

      const newMilestone: Milestone = {
        ...milestoneData,
        id: milestoneId,
        completed: false,
      };

      dispatch({
        type: 'ADD_MILESTONE_SUCCESS',
        payload: { goalId, milestone: newMilestone },
      });

      return milestoneId;
    } catch (error) {
      let errorMessage = 'Failed to add milestone';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Update a milestone
  const updateMilestone = async (
    goalId: string,
    milestoneId: string,
    milestoneData: Partial<Milestone>
  ) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      dispatch({
        type: 'UPDATE_MILESTONE_SUCCESS',
        payload: { goalId, milestoneId, data: milestoneData },
      });
    } catch (error) {
      let errorMessage = 'Failed to update milestone';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Delete a milestone
  const deleteMilestone = async (goalId: string, milestoneId: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      dispatch({
        type: 'DELETE_MILESTONE_SUCCESS',
        payload: { goalId, milestoneId },
      });
    } catch (error) {
      let errorMessage = 'Failed to delete milestone';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // Complete or uncomplete a milestone
  const completeMilestone = async (
    goalId: string,
    milestoneId: string,
    isCompleted: boolean
  ) => {
    return updateMilestone(goalId, milestoneId, { completed: isCompleted });
  };

  return (
    <GoalContext.Provider
      value={{
        goalState,
        fetchGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        completeGoal,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        completeMilestone,
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