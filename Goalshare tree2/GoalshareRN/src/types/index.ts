// User types
export type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

// Goal types
export type Milestone = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  imageUri?: string;
};

export type Goal = {
  id: string;
  userId: string;
  title: string;
  targetDate: Date | null;
  isPinned: boolean;
  createdAt: Date;
  completed: boolean;
  milestones: Milestone[];
};

export type GoalState = {
  goals: Goal[];
  loading: boolean;
  error: string | null;
};