/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardEvent,
} from 'react-native';
import { Card, IconButton, Avatar, Divider, useTheme } from 'react-native-paper';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const FeedScreen = () => {
  const { feedUpdates, likeFeedItem, unlikeFeedItem, addComment } = useSocial();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  // Animation values for each post
  const [itemAnimations, setItemAnimations] = useState({});
  const initializedItemsRef = useRef(new Set()).current; // Track which items have been initialized

  // Add this new animated value to track keyboard position
  const inputPositionY = useRef(new Animated.Value(0)).current;
  
  // Improve the keyboard animation synchronization
  useEffect(() => {
    // Better handling for keyboard events
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        
        // Use different animation configurations for iOS and Android
        if (Platform.OS === 'ios') {
          // iOS: Use the keyboard's native animation timing
          Animated.timing(inputPositionY, {
            toValue: -keyboardHeight,
            duration: event.duration || 250,
            useNativeDriver: true,
            // Use standard easing instead of bezier
            easing: Easing.out(Easing.ease),
          }).start();
        } else {
          // Android: Use a slightly faster animation with a spring finish
          Animated.spring(inputPositionY, {
            toValue: -keyboardHeight,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
        }
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        if (Platform.OS === 'ios') {
          Animated.timing(inputPositionY, {
            toValue: 0,
            duration: event.duration || 250,
            useNativeDriver: true,
            // Use standard easing instead of bezier
            easing: Easing.in(Easing.ease),
          }).start();
        } else {
          Animated.spring(inputPositionY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
        }
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [inputPositionY]);

  // Set up animations for feed items - only create animations for new items
  useEffect(() => {
    const newAnimations = { ...itemAnimations };
    let hasNewItems = false;

    feedUpdates.forEach((item, index) => {
      // Only initialize animations for new items
      if (!initializedItemsRef.has(item.id)) {
        hasNewItems = true;
        initializedItemsRef.add(item.id);
        
        newAnimations[item.id] = {
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(50),
        };

        // Start animations with staggered delay
        const delay = index * 100;
        Animated.parallel([
          Animated.timing(newAnimations[item.id].opacity, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(newAnimations[item.id].translateY, {
            toValue: 0,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Only update state if we have new items
    if (hasNewItems) {
      setItemAnimations(newAnimations);
    }
  }, [feedUpdates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, we would refresh the feed data here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  // Use a memoized handler for like/unlike to avoid re-renders
  const handleLikePress = useCallback((postId) => {
    const post = feedUpdates.find(update => update.id === postId);
    if (!post || !user) return;

    if (post.likes.includes(user.uid)) {
      unlikeFeedItem(postId);
    } else {
      likeFeedItem(postId);
    }
  }, [feedUpdates, likeFeedItem, unlikeFeedItem, user]);

  const handleAddComment = () => {
    if (commentText.trim() && activePostId) {
      addComment(activePostId, commentText);
      setCommentText('');
      setCommentModalVisible(false);
    }
  };

  const openCommentModal = (postId) => {
    setActivePostId(postId);
    setCommentModalVisible(true);
  };

  const renderItem = ({ item, index }) => {
    const isLiked = user ? item.likes.includes(user.uid) : false;
    const hasComments = item.comments && item.comments.length > 0;
    const isOwnPost = user && item.userId === user.uid;

    // Use existing animations or create default values for items that don't have animations
    const animations = itemAnimations[item.id] || { 
      opacity: new Animated.Value(1), 
      translateY: new Animated.Value(0) 
    };

    return (
      <Animated.View
        style={[
          styles.postContainer,
          {
            opacity: animations.opacity,
            transform: [{ translateY: animations.translateY }],
          },
        ]}
      >
        <Card style={styles.card}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <Avatar.Image
                size={40}
                source={{
                  uri: item.userId === 'user1' 
                    ? 'https://randomuser.me/api/portraits/men/1.jpg'
                    : item.userId === 'user2'
                    ? 'https://randomuser.me/api/portraits/women/2.jpg'
                    : user && isOwnPost 
                    ? (user.photoURL || 'https://randomuser.me/api/portraits/men/32.jpg')
                    : 'https://randomuser.me/api/portraits/men/3.jpg'
                }}
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.username}>
                  {isOwnPost ? 'You' : item.displayName}
                </Text>
                <Text style={styles.timestamp}>
                  {formatDistanceToNow(new Date(item.timestamp))} ago
                </Text>
              </View>
            </View>
            {isOwnPost && (
              <View style={styles.ownPostBadge}>
                <MaterialCommunityIcons name="account-circle" size={16} color="#4CAF50" />
              </View>
            )}
          </View>

          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>
              {isOwnPost ? '🎉 You completed' : `✨ ${item.displayName} completed`} a milestone for "{item.goalTitle}"
            </Text>
            <View style={styles.milestoneContainer}>
              <LinearGradient
                colors={isOwnPost ? ['#4CAF50', '#81C784'] : ['#2196F3', '#64B5F6']}
                style={styles.milestoneBadge}
              >
                <MaterialCommunityIcons 
                  name="flag-checkered" 
                  size={16} 
                  color="white" 
                  style={styles.milestoneIcon}
                />
                <Text style={styles.milestoneTitle}>{item.milestoneTitle}</Text>
              </LinearGradient>
            </View>
            {item.milestoneDescription && (
              <Text style={styles.milestoneDescription}>
                "{item.milestoneDescription}"
              </Text>
            )}
          </View>

          {item.imageUri && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.imageOverlay}
              />
            </View>
          )}

          <View style={styles.postActions}>
            <View style={styles.actionButton}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleLikePress(item.id)}
              >
                <FontAwesome
                  name={isLiked ? "heart" : "heart-o"}
                  size={22}
                  color={isLiked ? "#FF6B6B" : "#666"}
                />
                <Text style={[styles.likeCount, isLiked && styles.likedText]}>
                  {item.likes.length}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openCommentModal(item.id)}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={22}
                color="#666"
              />
              <Text style={styles.commentCount}>
                {item.comments.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons
                name="share-outline"
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {hasComments && (
            <View style={styles.commentsContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.commentsHeader}>
                Comments ({item.comments.length})
              </Text>
              {item.comments.slice(0, 2).map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentUsername}>
                    {comment.userId === user?.uid ? 'You' : comment.displayName}
                  </Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTimestamp}>
                    {formatDistanceToNow(new Date(comment.timestamp))} ago
                  </Text>
                </View>
              ))}
              {item.comments.length > 2 && (
                <TouchableOpacity
                  style={styles.viewMoreComments}
                  onPress={() => openCommentModal(item.id)}
                >
                  <Text style={styles.viewMoreCommentsText}>
                    View all {item.comments.length} comments
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  // use memoized renderItem to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback(renderItem, [itemAnimations, user, handleLikePress]);

  // Comment modal
  const renderCommentModal = () => {
    const post = feedUpdates.find(update => update.id === activePostId);
    if (!post) return null;

    return (
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setCommentModalVisible(false)}
              />
            </View>
            
            <View style={styles.modalHandle} />

            <FlatList
              data={post.comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.modalCommentItem}>
                  <View style={styles.modalCommentHeader}>
                    <Text style={styles.modalCommentUsername}>{item.displayName}</Text>
                    <Text style={styles.modalCommentTimestamp}>
                      {formatDistanceToNow(new Date(item.timestamp))} ago
                    </Text>
                  </View>
                  <Text style={styles.modalCommentText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              style={styles.modalCommentsList}
              contentContainerStyle={styles.modalCommentsContent}
            />

            {/* Wrap input in Animated.View to move with keyboard */}
            <Animated.View 
              style={[
                styles.inputWrapper,
                { 
                  transform: [{ translateY: inputPositionY }],
                  // Add hardware acceleration hint
                  backfaceVisibility: 'hidden'
                }
              ]}
            >
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  autoFocus={true}
                  textAlignVertical="center"
                />
                <IconButton
                  icon="send"
                  size={24}
                  color={theme.colors.primary}
                  disabled={!commentText.trim()}
                  onPress={handleAddComment}
                  style={styles.sendButton}
                />
              </View>
            </Animated.View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Activity Feed</Text>
      </View>

      <AnimatedFlatList
        data={feedUpdates}
        renderItem={memoizedRenderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group"
              size={60}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptyText}>
              Updates from friends will appear here. Start by adding some friends!
            </Text>
          </View>
        }
      />

      {renderCommentModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 100 : 85,
  },
  postContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  ownPostBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  goalInfo: {
    padding: 12,
    paddingTop: 0,
  },
  goalTitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  milestoneContainer: {
    marginBottom: 8,
  },
  milestoneBadge: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: 'white',
  },
  milestoneIcon: {
    marginRight: 8,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
    fontStyle: 'italic',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  postActions: {
    flexDirection: 'row',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  commentCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  commentsContainer: {
    padding: 12,
    paddingTop: 0,
  },
  divider: {
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  commentsHeader: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#444',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  viewMoreComments: {
    paddingVertical: 6,
  },
  viewMoreCommentsText: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCommentsList: {
    flex: 1,
    marginBottom: 60,
  },
  modalCommentsContent: {
    paddingBottom: 10,
  },
  modalCommentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 6,
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
    justifyContent: 'center',
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    marginLeft: 8,
  },
  emptyComments: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 10,
    paddingTop: 5,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 999,
    elevation: 5,
    transform: [{ translateZ: 0 }],
  },
  likedText: {
    color: '#FF6B6B',
  },
});

export default FeedScreen;