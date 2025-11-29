// src/screens/friends/AddFriendScreen.tsx
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
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSearchUsersQuery, useAddFriendMutation } from '../../store/api/friendsApi';
import type { User, ContactFrequency } from '../../types';
import {
  CONTACT_FREQUENCY_CONFIG,
  CONTACT_FREQUENCY_ORDER,
  DEFAULT_CONTACT_FREQUENCY,
} from '../../constants/contactFrequency';
import { colors, spacing, radius, typography, layout, components } from '../../styles/theme';

// Mock user ID - in production, get this from auth context
const MOCK_USER_ID = 'user-1';

const FREQUENCY_OPTIONS = CONTACT_FREQUENCY_ORDER.map(value => ({
  value,
  label: CONTACT_FREQUENCY_CONFIG[value].label,
  color: CONTACT_FREQUENCY_CONFIG[value].color,
}));

export default function AddFriendScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<ContactFrequency>(DEFAULT_CONTACT_FREQUENCY);
  
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
        contactFrequency: selectedFrequency,
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
        <Ionicons name="person-add" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderFrequencyOption = (option: typeof FREQUENCY_OPTIONS[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.tierOption,
        selectedFrequency === option.value && { backgroundColor: option.color },
      ]}
      onPress={() => setSelectedFrequency(option.value)}
    >
      <Text style={[
        styles.tierOptionText,
        selectedFrequency === option.value && { color: colors.surface },
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
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {/* Contact cadence selection */}
          <Text style={styles.tierTitle}>Default contact cadence:</Text>
          <View style={styles.tierContainer}>
            {FREQUENCY_OPTIONS.map(renderFrequencyOption)}
          </View>
        </View>

        {/* Search Results */}
        <View style={styles.resultsSection}>
          {searchTerm.length < 2 ? (
            <View style={styles.instructionsContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.instructionsTitle}>Search for Friends</Text>
              <Text style={styles.instructionsText}>
                Enter at least 2 characters to search for users by name or username
              </Text>
            </View>
          ) : isSearching || isFetching ? (
            <View style={styles.loadingContainer}>
              <Text style={typography.body}>Searching...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="person-outline" size={48} color={colors.textMuted} />
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

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  searchSection: ViewStyle;
  sectionTitle: TextStyle;
  searchContainer: ViewStyle;
  searchIcon: ViewStyle;
  searchInput: TextStyle;
  tierTitle: TextStyle;
  tierContainer: ViewStyle;
  tierOption: ViewStyle;
  tierOptionText: TextStyle;
  resultsSection: ViewStyle;
  resultsList: ViewStyle;
  userCard: ViewStyle;
  profileImage: ImageStyle;
  userInfo: ViewStyle;
  userName: TextStyle;
  username: TextStyle;
  addButton: ViewStyle;
  instructionsContainer: ViewStyle;
  instructionsTitle: TextStyle;
  instructionsText: TextStyle;
  loadingContainer: ViewStyle;
  emptyResults: ViewStyle;
  emptyResultsText: TextStyle;
  emptyResultsSubtext: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...layout.screen,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    ...layout.row,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tierContainer: {
    ...layout.row,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tierOption: {
    ...components.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tierOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  resultsSection: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  userCard: {
    ...layout.row,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    padding: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    padding: spacing.xxxl,
  },
  emptyResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
