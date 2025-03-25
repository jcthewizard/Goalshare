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