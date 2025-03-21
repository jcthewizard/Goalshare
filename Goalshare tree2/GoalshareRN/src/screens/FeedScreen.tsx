/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
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

  // Set up animations for feed items
  useEffect(() => {
    const animations = {};
    feedUpdates.forEach((item, index) => {
      animations[item.id] = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(50),
      };

      // Start animations with staggered delay
      const delay = index * 100;
      Animated.parallel([
        Animated.timing(animations[item.id].opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animations[item.id].translateY, {
          toValue: 0,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    setItemAnimations(animations);
  }, [feedUpdates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, we would refresh the feed data here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleLikePress = (postId) => {
    const post = feedUpdates.find(update => update.id === postId);
    if (!post || !user) return;

    if (post.likes.includes(user.uid)) {
      unlikeFeedItem(postId);
    } else {
      likeFeedItem(postId);
    }
  };

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

    // Get animations for this item
    const animations = itemAnimations[item.id] || { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };

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
                  uri: 'https://randomuser.me/api/portraits/men/1.jpg'
                }}
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.username}>{item.displayName}</Text>
                <Text style={styles.timestamp}>
                  {formatDistanceToNow(new Date(item.timestamp))} ago
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>
              Completed a milestone for "{item.goalTitle}"
            </Text>
            <View style={styles.milestoneContainer}>
              <LinearGradient
                colors={['#f0f0f0', '#e0e0e0']}
                style={styles.milestoneBadge}
              >
                <Text style={styles.milestoneTitle}>{item.milestoneTitle}</Text>
              </LinearGradient>
            </View>
            {item.milestoneDescription && (
              <Text style={styles.milestoneDescription}>
                {item.milestoneDescription}
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
                  color={isLiked ? theme.colors.primary : "#666"}
                />
                <Text style={styles.likeCount}>
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
                    {comment.displayName}
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setCommentModalVisible(false)}
              />
            </View>

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
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
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
          </View>
        </SafeAreaView>
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
        renderItem={renderItem}
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
  },
  milestoneTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#555',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    flex: 1,
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
    maxHeight: '70%',
  },
  modalCommentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalCommentUsername: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  modalCommentTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  modalCommentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
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
});

export default FeedScreen;