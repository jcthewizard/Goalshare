/* eslint-disable */
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Types
interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface FriendRequest {
  id: string;
  from: User;
  to: string; // userId
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface Friend {
  id: string;
  user: User;
  since: string;
}

interface MilestoneUpdate {
  id: string;
  userId: string;
  displayName: string;
  goalId: string;
  goalTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDescription?: string;
  imageUri?: string;
  timestamp: string;
  likes: string[]; // array of userIds
  comments: Comment[];
}

interface Comment {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: string;
}

interface SocialContextType {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  feedUpdates: MilestoneUpdate[];
  searchUsers: (query: string) => Promise<User[]>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  addMilestoneCompletionUpdate: (data: {
    goalId: string;
    goalTitle: string;
    milestoneId: string;
    milestoneTitle: string;
    milestoneDescription?: string;
    imageUri?: string;
  }) => Promise<void>;
  likeFeedItem: (updateId: string) => Promise<void>;
  unlikeFeedItem: (updateId: string) => Promise<void>;
  addComment: (updateId: string, text: string) => Promise<void>;
  deleteComment: (updateId: string, commentId: string) => Promise<void>;
  getFriendCount: () => number;
  getIncomingRequestCount: () => number;
}

// Create the context
const SocialContext = createContext<SocialContextType | undefined>(undefined);

// Mock server data - in a real app, this would come from a backend
const MOCK_USERS: User[] = [
  { uid: 'user1', displayName: 'alexsmith', email: 'alex@example.com', photoURL: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { uid: 'user2', displayName: 'sarahlee', email: 'sarah@example.com', photoURL: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { uid: 'user3', displayName: 'mikejones', email: 'mike@example.com', photoURL: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { uid: 'user4', displayName: 'emmawilson', email: 'emma@example.com', photoURL: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { uid: 'user5', displayName: 'davidpark', email: 'david@example.com', photoURL: 'https://randomuser.me/api/portraits/men/5.jpg' },
];

// Provider component
export const SocialProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [feedUpdates, setFeedUpdates] = useState<MilestoneUpdate[]>([]);

  // Initialize with mock data
  useEffect(() => {
    if (user) {
      loadSocialData();
    }
  }, [user]);

  const loadSocialData = async () => {
    try {
      // Load friends, requests, and feed from AsyncStorage
      const storedFriends = await AsyncStorage.getItem('friends');
      const storedIncomingRequests = await AsyncStorage.getItem('incomingRequests');
      const storedOutgoingRequests = await AsyncStorage.getItem('outgoingRequests');
      const storedFeedUpdates = await AsyncStorage.getItem('feedUpdates');

      if (storedFriends) setFriends(JSON.parse(storedFriends));
      if (storedIncomingRequests) setIncomingRequests(JSON.parse(storedIncomingRequests));
      if (storedOutgoingRequests) setOutgoingRequests(JSON.parse(storedOutgoingRequests));
      if (storedFeedUpdates) setFeedUpdates(JSON.parse(storedFeedUpdates));

      // If we haven't loaded any data yet, initialize with mock data
      if (!storedFriends && !storedIncomingRequests && !storedFeedUpdates) {
        // Add some mock friends
        const mockFriends: Friend[] = [
          {
            id: 'friend1',
            user: {
              uid: MOCK_USERS[0].uid,
              displayName: MOCK_USERS[0].displayName,
              email: MOCK_USERS[0].email,
              photoURL: MOCK_USERS[0].photoURL
            },
            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
          },
          {
            id: 'friend2',
            user: {
              uid: MOCK_USERS[1].uid,
              displayName: MOCK_USERS[1].displayName,
              email: MOCK_USERS[1].email,
              photoURL: MOCK_USERS[1].photoURL
            },
            since: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
          }
        ];

        // Add some mock incoming requests
        const mockIncomingRequests: FriendRequest[] = [
          {
            id: 'request1',
            from: {
              uid: MOCK_USERS[2].uid,
              displayName: MOCK_USERS[2].displayName,
              email: MOCK_USERS[2].email,
              photoURL: MOCK_USERS[2].photoURL
            },
            to: user?.uid || '',
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
          }
        ];

        // Add some mock feed updates
        const mockFeedUpdates: MilestoneUpdate[] = [
          {
            id: 'update1',
            userId: MOCK_USERS[0].uid,
            displayName: MOCK_USERS[0].displayName,
            goalId: 'goal1',
            goalTitle: 'Learn Spanish',
            milestoneId: 'milestone1',
            milestoneTitle: 'Complete first 10 lessons',
            milestoneDescription: 'Finished the basic introduction to Spanish grammar and vocabulary',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            likes: [],
            comments: [
              {
                id: 'comment1',
                userId: MOCK_USERS[1].uid,
                displayName: MOCK_USERS[1].displayName,
                text: 'Great job! Keep it up!',
                timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: 'update2',
            userId: MOCK_USERS[1].uid,
            displayName: MOCK_USERS[1].displayName,
            goalId: 'goal2',
            goalTitle: 'Run a Marathon',
            milestoneId: 'milestone2',
            milestoneTitle: 'Complete 10k training run',
            milestoneDescription: 'Finished a 10k run in 55 minutes',
            imageUri: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cnVubmluZ3xlbnwwfHwwfHw%3D',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            likes: [MOCK_USERS[0].uid],
            comments: []
          }
        ];

        setFriends(mockFriends);
        setIncomingRequests(mockIncomingRequests);
        setFeedUpdates(mockFeedUpdates);

        // Store in AsyncStorage
        await AsyncStorage.setItem('friends', JSON.stringify(mockFriends));
        await AsyncStorage.setItem('incomingRequests', JSON.stringify(mockIncomingRequests));
        await AsyncStorage.setItem('feedUpdates', JSON.stringify(mockFeedUpdates));
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      Alert.alert('Error', 'Failed to load social data');
    }
  };

  // Helper to save data to AsyncStorage
  const saveSocialData = async () => {
    try {
      await AsyncStorage.setItem('friends', JSON.stringify(friends));
      await AsyncStorage.setItem('incomingRequests', JSON.stringify(incomingRequests));
      await AsyncStorage.setItem('outgoingRequests', JSON.stringify(outgoingRequests));
      await AsyncStorage.setItem('feedUpdates', JSON.stringify(feedUpdates));
    } catch (error) {
      console.error('Error saving social data:', error);
    }
  };

  // Search for users
  const searchUsers = async (query: string): Promise<User[]> => {
    // In a real app, this would be an API call
    return MOCK_USERS.filter(
      u => u.displayName.toLowerCase().includes(query.toLowerCase()) &&
      u.uid !== user?.uid &&
      !friends.some(f => f.user.uid === u.uid) &&
      !outgoingRequests.some(r => r.from.uid === user?.uid && r.to === u.uid)
    );
  };

  // Friend requests
  const sendFriendRequest = async (userId: string): Promise<void> => {
    const targetUser = MOCK_USERS.find(u => u.uid === userId);
    if (!targetUser || !user) return;

    const newRequest: FriendRequest = {
      id: uuidv4(),
      from: {
        uid: user.uid || '',
        displayName: user.displayName || 'user',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
      },
      to: targetUser.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setOutgoingRequests([...outgoingRequests, newRequest]);
    await saveSocialData();
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) return;

    // Create new friend
    const newFriend: Friend = {
      id: uuidv4(),
      user: request.from,
      since: new Date().toISOString(),
    };

    // Update state
    setFriends([...friends, newFriend]);
    setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
    await saveSocialData();
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
    await saveSocialData();
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    setFriends(friends.filter(f => f.id !== friendId));
    await saveSocialData();
  };

  // Feed updates
  const addMilestoneCompletionUpdate = async (data: {
    goalId: string;
    goalTitle: string;
    milestoneId: string;
    milestoneTitle: string;
    milestoneDescription?: string;
    imageUri?: string;
  }): Promise<void> => {
    if (!user) return;

    const newUpdate: MilestoneUpdate = {
      id: uuidv4(),
      userId: user.uid || '',
      displayName: user.displayName || 'user',
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      milestoneId: data.milestoneId,
      milestoneTitle: data.milestoneTitle,
      milestoneDescription: data.milestoneDescription,
      imageUri: data.imageUri,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    setFeedUpdates([newUpdate, ...feedUpdates]);
    await saveSocialData();
  };

  const likeFeedItem = async (updateId: string): Promise<void> => {
    if (!user) return;

    setFeedUpdates(
      feedUpdates.map(update => {
        if (update.id === updateId && !update.likes.includes(user.uid)) {
          return { ...update, likes: [...update.likes, user.uid] };
        }
        return update;
      })
    );
    await saveSocialData();
  };

  const unlikeFeedItem = async (updateId: string): Promise<void> => {
    if (!user) return;

    setFeedUpdates(
      feedUpdates.map(update => {
        if (update.id === updateId) {
          return { ...update, likes: update.likes.filter(id => id !== user.uid) };
        }
        return update;
      })
    );
    await saveSocialData();
  };

  const addComment = async (updateId: string, text: string): Promise<void> => {
    if (!user || !text.trim()) return;

    const newComment: Comment = {
      id: uuidv4(),
      userId: user.uid || '',
      displayName: user.displayName || 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setFeedUpdates(
      feedUpdates.map(update => {
        if (update.id === updateId) {
          return {
            ...update,
            comments: [...update.comments, newComment]
          };
        }
        return update;
      })
    );
    await saveSocialData();
  };

  const deleteComment = async (updateId: string, commentId: string): Promise<void> => {
    if (!user) return;

    setFeedUpdates(
      feedUpdates.map(update => {
        if (update.id === updateId) {
          return {
            ...update,
            comments: update.comments.filter(c => c.id !== commentId)
          };
        }
        return update;
      })
    );
    await saveSocialData();
  };

  // Utility functions
  const getFriendCount = (): number => {
    return friends.length;
  };

  const getIncomingRequestCount = (): number => {
    return incomingRequests.length;
  };

  // Context value
  const value = {
    friends,
    incomingRequests,
    outgoingRequests,
    feedUpdates,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    addMilestoneCompletionUpdate,
    likeFeedItem,
    unlikeFeedItem,
    addComment,
    deleteComment,
    getFriendCount,
    getIncomingRequestCount,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

// Custom hook for using the context
export const useSocial = (): SocialContextType => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};