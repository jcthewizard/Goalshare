/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Card, Avatar, Button, IconButton, useTheme } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSocial } from '../contexts/SocialContext';

export const FriendsList = () => {
  const theme = useTheme();
  const {
    friends,
    incomingRequests,
    removeFriend,
    acceptFriendRequest,
    declineFriendRequest,
    searchUsers,
    sendFriendRequest
  } = useSocial();

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleRemoveFriend = (friendId) => {
    removeFriend(friendId);
  };

  const handleAcceptRequest = (requestId) => {
    acceptFriendRequest(requestId);
  };

  const handleDeclineRequest = (requestId) => {
    declineFriendRequest(requestId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = (userId) => {
    sendFriendRequest(userId);
    // Close the modal after sending a request
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Helper function to get initials safely
  const getInitials = (name) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  const renderFriendItem = ({ item }) => (
    <Card style={styles.friendCard}>
      <View style={styles.friendItem}>
        {item.user?.photoURL ? (
          <Image source={{ uri: item.user.photoURL }} style={styles.avatar} />
        ) : (
          <Avatar.Text
            size={50}
            label={getInitials(item.user?.displayName)}
            style={styles.avatarText}
          />
        )}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.user?.displayName || 'Unknown User'}</Text>
          <Text style={styles.friendEmail}>{item.user?.email || ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveFriend(item.id)}
        >
          <FontAwesome5 name="user-minus" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRequestItem = ({ item }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestItem}>
        {item.from?.photoURL ? (
          <Image source={{ uri: item.from.photoURL }} style={styles.avatar} />
        ) : (
          <Avatar.Text
            size={50}
            label={getInitials(item.from?.displayName)}
            style={styles.avatarText}
          />
        )}
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.from?.displayName || 'Unknown User'}</Text>
          <Text style={styles.requestText}>sent you a friend request</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSendRequest(item.uid)}
    >
      {item?.photoURL ? (
        <Image source={{ uri: item.photoURL }} style={styles.searchAvatar} />
      ) : (
        <Avatar.Text
          size={40}
          label={getInitials(item?.displayName)}
          style={styles.avatarText}
        />
      )}
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item?.displayName || 'Unknown User'}</Text>
        <Text style={styles.searchResultEmail}>{item?.email || ''}</Text>
      </View>
      <IconButton
        icon="account-plus"
        color={theme.colors.primary}
        size={24}
        onPress={() => handleSendRequest(item.uid)}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Friend Requests Section */}
      {incomingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          <FlatList
            data={incomingRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.requestsList}
          />
        </View>
      )}

      {/* Friends Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <FontAwesome5 name="user-plus" size={14} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="users" size={40} color="#CCCCCC" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubText}>
              Add friends to see their goals and progress
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.friendsList}
          />
        )}
      </View>

      {/* Search Users Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Find Friends</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  setSearchModalVisible(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              />
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  !searchQuery.trim() && styles.searchButtonDisabled
                ]}
                onPress={handleSearch}
                disabled={!searchQuery.trim() || searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <FontAwesome5
                    name="search"
                    size={16}
                    color={searchQuery.trim() ? theme.colors.primary : '#CCCCCC'}
                  />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.searchResultsList}
              />
            ) : (
              <View style={styles.emptySearchContainer}>
                {searching ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : searchQuery.trim() ? (
                  <>
                    <FontAwesome5 name="search" size={40} color="#CCCCCC" />
                    <Text style={styles.emptySearchText}>No results found</Text>
                    <Text style={styles.emptySearchSubText}>Try a different search term</Text>
                  </>
                ) : (
                  <>
                    <FontAwesome5 name="user-friends" size={40} color="#CCCCCC" />
                    <Text style={styles.emptySearchText}>Search for friends</Text>
                    <Text style={styles.emptySearchSubText}>Find friends by name or email</Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: '#FF5F5F',
  },
  friendsList: {
    paddingBottom: 8,
  },
  requestsList: {
    paddingBottom: 8,
  },
  friendCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    backgroundColor: '#35CAFC',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: 14,
    color: '#888',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CD964',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
  },
  declineButtonText: {
    color: '#888',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    color: '#777',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: '80%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchResultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#888',
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    color: '#777',
  },
  emptySearchSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});