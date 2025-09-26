import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useGetConnectionSuggestionsQuery, useDismissSuggestionMutation } from '../../store/api/connectionsApi';
import { useUpdateLastContactedMutation } from '../../store/api/friendsApi';
import { ConnectionSuggestion } from '../../types';

// Mock user ID - in production, get this from auth context
const MOCK_USER_ID = 'user-1';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data: suggestions = [],
    isLoading,
    refetch
  } = useGetConnectionSuggestionsQuery({ userId: MOCK_USER_ID });
  
  const [dismissSuggestion] = useDismissSuggestionMutation();
  const [updateLastContacted] = useUpdateLastContactedMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConnect = async (suggestion: ConnectionSuggestion) => {
    Alert.alert(
      'Connect with friend',
      `Reach out to ${suggestion.friend.firstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message',
          onPress: () => {
            // Here you would open messaging functionality
            // For now, just update last contacted
            updateLastContacted(suggestion.id);
            Alert.alert('Great!', `You've connected with ${suggestion.friend.firstName}!`);
          }
        },
      ]
    );
  };

  const handleDismiss = async (suggestionId: string) => {
    await dismissSuggestion(suggestionId);
  };

  const renderSuggestion = (suggestion: ConnectionSuggestion) => (
    <View key={suggestion.id} style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: suggestion.friend.profileImage || 'https://via.placeholder.com/50' }}
            style={styles.profileImage}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {suggestion.friend.firstName} {suggestion.friend.lastName}
            </Text>
            <Text style={styles.username}>@{suggestion.friend.username}</Text>
          </View>
        </View>
        <Text style={styles.score}>{Math.round(suggestion.score)}</Text>
      </View>

      <View style={styles.reasonsContainer}>
        {suggestion.reasons.slice(0, 2).map((reason, index) => (
          <View key={index} style={styles.reasonChip}>
            <Text style={styles.reasonText}>{reason.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.connectButton]}
          onPress={() => handleConnect(suggestion)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="white" />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dismissButton]}
          onPress={() => handleDismiss(suggestion.id)}
        >
          <Ionicons name="close-outline" size={16} color="#666" />
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Give this person a call!</Text>
          <Text style={styles.subtitle}>It's been a while</Text>
        </View>

        {/* Suggested Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Links</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading suggestions...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <View style={styles.suggestionsContainer}>
              {suggestions.map(renderSuggestion)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No connection suggestions right now
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Add some friends to get personalized suggestions!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="people-outline" size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Add Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Add Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="ticket-outline" size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Plan Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  suggestionsContainer: {
    gap: 16,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reasonText: {
    fontSize: 12,
    color: '#1976d2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f5f5f5',
  },
  dismissButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
  },
  quickActionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
  },
});