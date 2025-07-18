/* eslint-disable */
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.181.206:5001/api' 
  : 'https://your-production-api.com/api';

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
  postType?: string;
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
  loading: boolean;
  error: string | null;
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
  refreshFeed: () => Promise<void>;
  getFriendCount: () => number;
  getIncomingRequestCount: () => number;
}

// Create the context
const SocialContext = createContext<SocialContextType | undefined>(undefined);

// API Helper Functions
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const apiRequest = async (endpoint: string, options: any = {}) => {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with data
  useEffect(() => {
    if (user) {
      loadSocialData();
      refreshFeed();
    }
  }, [user]);

  const loadSocialData = async () => {
    try {
      // Load friends and requests from AsyncStorage (keeping mock data for now)
      const storedFriends = await AsyncStorage.getItem('friends');
      const storedIncomingRequests = await AsyncStorage.getItem('incomingRequests');
      const storedOutgoingRequests = await AsyncStorage.getItem('outgoingRequests');

      if (storedFriends) setFriends(JSON.parse(storedFriends));
      if (storedIncomingRequests) setIncomingRequests(JSON.parse(storedIncomingRequests));
      if (storedOutgoingRequests) setOutgoingRequests(JSON.parse(storedOutgoingRequests));

      // If we haven't loaded any data yet, initialize with mock data
      if (!storedFriends && !storedIncomingRequests) {
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

        setFriends(mockFriends);
        setIncomingRequests(mockIncomingRequests);

        // Store in AsyncStorage
        await AsyncStorage.setItem('friends', JSON.stringify(mockFriends));
        await AsyncStorage.setItem('incomingRequests', JSON.stringify(mockIncomingRequests));
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      setError('Failed to load social data');
    }
  };

  // Fetch feed from backend
  const refreshFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest('/posts?limit=20&page=1');
      
      if (response.success && response.data.posts) {
        setFeedUpdates(response.data.posts);
      } else {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data');
        await loadMockFeedData();
      }
    } catch (error) {
      console.error('Error refreshing feed:', error);
      setError('Failed to load feed');
      // Fallback to mock data
      await loadMockFeedData();
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data loader
  const loadMockFeedData = async () => {
    try {
      const storedFeedUpdates = await AsyncStorage.getItem('feedUpdates');
      
      if (storedFeedUpdates) {
        setFeedUpdates(JSON.parse(storedFeedUpdates));
      } else {
        // Initialize with mock feed data
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
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
            milestoneDescription: 'Finished a 10k run in 55 minutes - feeling stronger every day!',
            imageUri: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cnVubmluZ3xlbnwwfHwwfHw%3D',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            likes: [MOCK_USERS[0].uid],
            comments: [
              {
                id: 'comment2',
                userId: MOCK_USERS[0].uid,
                displayName: MOCK_USERS[0].displayName,
                text: 'Amazing pace! You\'re going to crush that marathon!',
                timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: 'update3',
            userId: MOCK_USERS[2].uid,
            displayName: MOCK_USERS[2].displayName,
            goalId: 'goal3',
            goalTitle: 'Learn Guitar',
            milestoneId: 'milestone3',
            milestoneTitle: 'Play first song',
            milestoneDescription: 'Successfully played "Wonderwall" all the way through!',
            imageUri: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            likes: [MOCK_USERS[0].uid, MOCK_USERS[1].uid],
            comments: []
          },
          {
            id: 'update4',
            userId: MOCK_USERS[1].uid,
            displayName: MOCK_USERS[1].displayName,
            goalId: 'goal4',
            goalTitle: 'Read 50 Books This Year',
            milestoneId: 'milestone4',
            milestoneTitle: 'Finish book #10',
            milestoneDescription: 'Just finished "Atomic Habits" - highly recommend!',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            likes: [],
            comments: [
              {
                id: 'comment3',
                userId: MOCK_USERS[0].uid,
                displayName: MOCK_USERS[0].displayName,
                text: 'That book changed my life! What\'s next on your list?',
                timestamp: new Date(Date.now() - 9.5 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'comment4',
                userId: MOCK_USERS[2].uid,
                displayName: MOCK_USERS[2].displayName,
                text: 'You\'re flying through those books! 📚',
                timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
        ];

        setFeedUpdates(mockFeedUpdates);
        await AsyncStorage.setItem('feedUpdates', JSON.stringify(mockFeedUpdates));
      }
    } catch (error) {
      console.error('Error loading mock feed data:', error);
    }
  };

  // Helper to save data to AsyncStorage
  const saveSocialData = async () => {
    try {
      await AsyncStorage.setItem('friends', JSON.stringify(friends));
      await AsyncStorage.setItem('incomingRequests', JSON.stringify(incomingRequests));
      await AsyncStorage.setItem('outgoingRequests', JSON.stringify(outgoingRequests));
    } catch (error) {
      console.error('Error saving social data:', error);
    }
  };

  // Search for users (keeping mock implementation)
  const searchUsers = async (query: string): Promise<User[]> => {
    // In a real app, this would be an API call
    return MOCK_USERS.filter(
      u => u.displayName.toLowerCase().includes(query.toLowerCase()) &&
      u.uid !== user?.uid &&
      !friends.some(f => f.user.uid === u.uid) &&
      !outgoingRequests.some(r => r.from.uid === user?.uid && r.to === u.uid)
    );
  };

  // Friend requests (keeping mock implementation for now)
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

  // Feed updates - Now using backend API
  const addMilestoneCompletionUpdate = async (data: {
    goalId: string;
    goalTitle: string;
    milestoneId: string;
    milestoneTitle: string;
    milestoneDescription?: string;
    imageUri?: string;
  }): Promise<void> => {
    try {
      if (!user) return;

      // Create post via API
      const postData = {
        content: {
          text: `Completed milestone: ${data.milestoneTitle}`,
          imageUrl: data.imageUri
        },
        milestone: {
          goalId: data.goalId,
          goalTitle: data.goalTitle,
          milestoneId: data.milestoneId,
          milestoneTitle: data.milestoneTitle,
          milestoneDescription: data.milestoneDescription
        },
        postType: 'milestone'
      };

      const response = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });

      if (response.success) {
        // Add to local state immediately for instant UI update
        const newUpdate: MilestoneUpdate = {
          id: response.data.id,
          userId: user.uid || '',
          displayName: user.displayName || 'user',
          goalId: data.goalId,
          goalTitle: data.goalTitle,
          milestoneId: data.milestoneId,
          milestoneTitle: data.milestoneTitle,
          milestoneDescription: data.milestoneDescription,
          imageUri: data.imageUri,
          timestamp: response.data.timestamp,
          likes: [],
          comments: [],
          postType: 'milestone'
        };

        setFeedUpdates(prev => [newUpdate, ...prev]);
      }
    } catch (error) {
      console.error('Error creating milestone post:', error);
      // Fallback to local storage
      const newUpdate: MilestoneUpdate = {
        id: uuidv4(),
        userId: user?.uid || '',
        displayName: user?.displayName || 'user',
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

      setFeedUpdates(prev => [newUpdate, ...prev]);
    }
  };

  const likeFeedItem = async (updateId: string): Promise<void> => {
    try {
      if (!user) return;

      // Optimistic update
      setFeedUpdates(prev =>
        prev.map(update => {
          if (update.id === updateId && !update.likes.includes(user.uid)) {
            return { ...update, likes: [...update.likes, user.uid] };
          }
          return update;
        })
      );

      // API call
      await apiRequest(`/posts/${updateId}/like`, {
        method: 'PATCH'
      });

    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setFeedUpdates(prev =>
        prev.map(update => {
          if (update.id === updateId) {
            return { ...update, likes: update.likes.filter(id => id !== user?.uid) };
          }
          return update;
        })
      );
    }
  };

  const unlikeFeedItem = async (updateId: string): Promise<void> => {
    try {
      if (!user) return;

      // Optimistic update
      setFeedUpdates(prev =>
        prev.map(update => {
          if (update.id === updateId) {
            return { ...update, likes: update.likes.filter(id => id !== user.uid) };
          }
          return update;
        })
      );

      // API call
      await apiRequest(`/posts/${updateId}/like`, {
        method: 'PATCH'
      });

    } catch (error) {
      console.error('Error unliking post:', error);
      // Revert optimistic update on error
      setFeedUpdates(prev =>
        prev.map(update => {
          if (update.id === updateId && !update.likes.includes(user.uid)) {
            return { ...update, likes: [...update.likes, user.uid] };
          }
          return update;
        })
      );
    }
  };

  const addComment = async (updateId: string, text: string): Promise<void> => {
    try {
      if (!user || !text.trim()) return;

      const response = await apiRequest(`/posts/${updateId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() })
      });

      if (response.success) {
        // Update local state with new comment
        setFeedUpdates(prev =>
          prev.map(update => {
            if (update.id === updateId) {
              return {
                ...update,
                comments: [...update.comments, response.data.comment]
              };
            }
            return update;
          })
        );
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
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
    loading,
    error,
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
    refreshFeed,
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