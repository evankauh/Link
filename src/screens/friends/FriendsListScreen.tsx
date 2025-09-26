import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FriendsStackParamList } from '../../types';

import { useGetFriendsQuery, useUpdateFriendshipTierMutation } from '../../store/api/friendsApi';
import type { Friend, FriendshipTier } from '../../types';

// Mock user ID - in production, get this from auth context
const MOCK_USER_ID = 'user-1';

const TIER_COLORS: Record<FriendshipTier, string> = {
  best_friend: '#ff4757',
  close_friend: '#ffa502',
  good_friend: '#2ed573',
  acquaintance: '#747d8c',
};

const TIER_LABELS: Record<FriendshipTier, string> = {
  best_friend: 'Best Friend',
  close_friend: 'Close Friend',
  good_friend: 'Good Friend',
  acquaintance: 'Acquaintance',
};

export default function FriendsListScreen() {
  const navigation = useNavigation<StackNavigationProp<FriendsStackParamList, 'FriendsList'>>();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data: friends = [],
    isLoading,
    refetch
  } = useGetFriendsQuery({ userId: MOCK_USER_ID });
  
  const [updateFriendshipTier] = useUpdateFriendshipTierMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTierChange = (friend: Friend) => {
    const tierOptions = Object.keys(TIER_LABELS) as FriendshipTier[];
    
    Alert.alert(
      'Update Friendship Tier',
      `Change ${friend.friend.firstName}'s friendship tier:`,
      [
        ...tierOptions.map(tier => ({
          text: TIER_LABELS[tier],
          onPress: () => updateFriendshipTier({ 
            friendshipId: friend.id, 
            tier 
          }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getLastContactedText = (lastContacted?: string) => {
    if (!lastContacted) return 'Never';
    
    const date = new Date(lastContacted);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
    );
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const renderFriend = ({ item: friend }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => navigation.navigate('FriendProfile', { friendId: friend.friendId })}
    >
      <View style={styles.friendInfo}>
        <Image 
          source={{ uri: friend.friend.profileImage || 'https://via.placeholder.com/60' }}
          style={styles.profileImage}
        />
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {friend.friend.firstName} {friend.friend.lastName}
          </Text>
          <Text style={styles.username}>@{friend.friend.username}</Text>
          
          <View style={styles.metaInfo}>
            <TouchableOpacity 
              style={[styles.tierBadge, { backgroundColor: TIER_COLORS[friend.friendshipTier] }]}
              onPress={() => handleTierChange(friend)}
            >
              <Text style={styles.tierText}>{TIER_LABELS[friend.friendshipTier]}</Text>
            </TouchableOpacity>
            
            <Text style={styles.lastContacted}>
              Last: {getLastContactedText(friend.lastContacted)}
            </Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );

  // Group friends by tier
  const friendsByTier = friends.reduce((acc, friend) => {
    if (!acc[friend.friendshipTier]) {
      acc[friend.friendshipTier] = [];
    }
    acc[friend.friendshipTier].push(friend);
    return acc;
  }, {} as Record<FriendshipTier, Friend[]>);

  // Section item discriminated union for the FlatList
  type SectionItem =
    | { type: 'header'; tier: FriendshipTier; count: number }
    | { type: 'friend'; friend: Friend };

  // Flatten friends with section headers
  const sectionsData: SectionItem[] = (Object.keys(TIER_LABELS) as FriendshipTier[])
    .map(tier => ({
      tier,
      friends: friendsByTier[tier] || [],
    }))
    .filter(section => section.friends.length > 0)
    .flatMap(section => [
      { type: 'header', tier: section.tier, count: section.friends.length } as SectionItem,
      ...section.friends.map(friend => ({ type: 'friend', friend } as SectionItem)),
    ]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Friends</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isLoading && friends.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Loading friends...</Text>
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No friends yet</Text>
          <Text style={styles.emptyStateText}>
            Start building your network by adding friends!
          </Text>
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Text style={styles.addFriendButtonText}>Add Your First Friend</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sectionsData}
          renderItem={({ item }: { item: SectionItem }) => {
            if (item.type === 'header') {
              return renderSectionHeader(TIER_LABELS[item.tier], item.count);
            }
            return renderFriend({ item: item.friend });
          }}
          keyExtractor={(item) =>
            item.type === 'header' ? `header-${item.tier}` : `friend-${item.friend.id}`
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  lastContacted: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  addFriendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFriendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});