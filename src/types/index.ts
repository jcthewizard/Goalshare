// User types
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  token: string | null;
}

// Goal types
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  imageUri?: string;
  isMilestone?: boolean;
  createdAt: string | Date;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate?: string | Date | null;
  isPinned?: boolean;
  completed?: boolean;
  themeColors?: ThemeColors;
  milestones: Milestone[];
  createdAt: string | Date;
}

export type GoalState = {
  goals: Goal[];
  loading: boolean;
  error: string | null;
};

// Social features types
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: Date;
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  user: User;
};

export type MilestoneUpdate = {
  id: string;
  userId: string;
  goalId: string;
  goalTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDescription?: string;
  imageUri?: string;
  completed: boolean;
  timestamp: number;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  user: User;
};

export type SocialState = {
  friends: User[];
  friendRequests: FriendRequest[];
  feed: MilestoneUpdate[];
  loading: boolean;
  error: string | null;
};