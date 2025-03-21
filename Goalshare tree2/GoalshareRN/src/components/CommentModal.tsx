// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard
} from 'react-native';
import { useTheme, Avatar, IconButton } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

type CommentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  update: any;
};

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  update
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (commentText.trim()) {
      onSubmit(commentText.trim());
      setCommentText('');
    }
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      {item.user.photoURL ? (
        <Image source={{ uri: item.user.photoURL }} style={styles.commentAvatar} />
      ) : (
        <Avatar.Text
          size={36}
          label={item.user.displayName.substring(0, 1).toUpperCase()}
          style={styles.avatarText}
        />
      )}
      <View style={styles.commentContentContainer}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{item.user.displayName}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
        <Text style={styles.commentTime}>
          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
        </Text>
      </View>
    </View>
  );

  if (!update) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            <FlatList
              data={update.comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyCommentsContainer}>
                  <FontAwesome5 name="comments" size={40} color="#CCCCCC" />
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubText}>
                    Be the first to add a comment!
                  </Text>
                </View>
              }
            />

            <View style={styles.commentInputContainer}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
              ) : (
                <Avatar.Text
                  size={32}
                  label={user?.displayName?.substring(0, 1)?.toUpperCase() || '?'}
                  style={styles.avatarText}
                />
              )}
              <TextInput
                ref={inputRef}
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!commentText.trim()}
              >
                <FontAwesome5
                  name="paper-plane"
                  size={16}
                  color={commentText.trim() ? theme.colors.primary : '#CCCCCC'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 5,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    backgroundColor: '#35CAFC',
  },
  commentContentContainer: {
    marginLeft: 10,
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    padding: 12,
    maxWidth: '90%',
  },
  commentUsername: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  commentText: {
    fontSize: 15,
  },
  commentTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    marginLeft: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#777',
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});