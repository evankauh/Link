import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSearchUsersQuery, useAddFriendMutation } from '../../store/api/friendsApi';
import type { User, FriendshipTier } from '../../types';

// Mock user ID - in production, get this from auth context
const MOCK_USER_ID = 'user-1';

const TIER_OPTIONS: { value: FriendshipTier; label: string; color: string }[] = [
  { value: 'best_friend', label: 'Best Friend', color: '#ff4757' },
  { value: 'close_friend', label: 'Close Friend', color: '#ffa502' },
  { value: 'good_friend', label: 'Good Friend', color: '#2ed573' },
  { value: 'acquaintance', label: 'Acquaintance', color: '#747d8c' },
];

export default function AddFriendScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<FriendshipTier>('good_friend');
  
  const {
    data: searchResults = [],
    isLoading: isSearching,
    isFetching
  } = useSearchUsersQuery(searchTerm, {
    skip: searchTerm.length < 2,
  });
  
  const [addFriend, { isLoading: isAdding }] = useAddFriendMutation();

  const handleAddFriend = async (user: User) => {
    try {
      await addFriend({
        userId: MOCK_USER_ID,
        friendId: user.id,
        tier: selectedTier,
      }).unwrap();
      
      Alert.alert(
        'Friend Request Sent!',
        `You've sent a friend request to ${user.firstName} ${user.lastName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send friend request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderUser = ({ item: user }: { item: User }) => (
    <View style={styles.userCard}>
      <Image 
        source={{ uri: user.profileImage || 'https://via.placeholder.com/50' }}
        style={styles.profileImage}
      />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddFriend(user)}
        disabled={isAdding}
      >
        <Ionicons name="person-add" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTierOption = (option: typeof TIER_OPTIONS[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.tierOption,
        selectedTier === option.value && { backgroundColor: option.color },
      ]}
      onPress={() => setSelectedTier(option.value)}
    >
      <Text style={[
        styles.tierOptionText,
        selectedTier === option.value && { color: 'white' },
      ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Friends</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {/* Friendship Tier Selection */}
          <Text style={styles.tierTitle}>Default Friendship Tier:</Text>
          <View style={styles.tierContainer}>
            {TIER_OPTIONS.map(renderTierOption)}
          </View>
        </View>

        {/* Search Results */}
        <View style={styles.resultsSection}>
          {searchTerm.length < 2 ? (
            <View style={styles.instructionsContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.instructionsTitle}>Search for Friends</Text>
              <Text style={styles.instructionsText}>
                Enter at least 2 characters to search for users by name or username
              </Text>
            </View>
          ) : isSearching || isFetching ? (
            <View style={styles.loadingContainer}>
              <Text>Searching...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="person-outline" size={48} color="#ccc" />
              <Text style={styles.emptyResultsText}>No users found</Text>
              <Text style={styles.emptyResultsSubtext}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderUser}
              keyExtractor={(user) => user.id}
              showsVerticalScrollIndicator={false}
              style={styles.resultsList}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  tierContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tierOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  resultsSection: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});