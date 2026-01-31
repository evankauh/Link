import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FriendsStackParamList } from '../../types';

import { useGetFriendsQuery } from '../../store/api/friendsApi';
import type { Contact } from '../../types';
import { loadContacts } from '../../utils/contactsStorage';
import {
  CONTACT_FREQUENCY_CONFIG,
  DEFAULT_CONTACT_FREQUENCY,
} from '../../constants/contactFrequency';
import {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  layout,
  shadow,
  avatarSizes,
} from '../../styles/theme';
import { GradientButton } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MOCK_USER_ID = 'user-1';

export default function FriendsListScreen() {
  const navigation = useNavigation<StackNavigationProp<FriendsStackParamList, 'FriendsList'>>();
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: friends = [],
    isLoading,
    refetch
  } = useGetFriendsQuery({ userId: MOCK_USER_ID });

  const sortByName = (a: Contact, b: Contact) => {
    const lnA = (a.lastName || '').toLowerCase();
    const lnB = (b.lastName || '').toLowerCase();
    if (lnA !== lnB) return lnA.localeCompare(lnB);
    const fnA = (a.firstName || '').toLowerCase();
    const fnB = (b.firstName || '').toLowerCase();
    if (fnA !== fnB) return fnA.localeCompare(fnB);
    return (a.id || '').localeCompare(b.id || '');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadContactsFromStorage()]);
    setRefreshing(false);
  };

  const loadContactsFromStorage = async () => {
    const loaded = await loadContacts();
    setContacts([...loaded].sort(sortByName));
  };

  // Reload contacts when screen comes into focus (e.g., after adding a new contact)
  useFocusEffect(
    useCallback(() => {
      loadContactsFromStorage();
    }, [])
  );

  const getLastContactedText = (contact?: Contact) => {
    if (contact?.lastContactedCount) return contact.lastContactedCount;
    if (!contact?.lastContacted) return 'Not recorded';
    const d = Math.floor((Date.now() - new Date(contact.lastContacted).getTime()) / (1000 * 60 * 60 * 24));
    if (d <= 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return `${d} days ago`;
    const months = Math.floor(d / 30);
    if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };

  const formatBirthday = (iso?: string | null) => {
    if (!iso) return null;
    // Parse the date as UTC to avoid timezone issues
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };


  const renderContactCard = ({ item: c, index }: { item: Contact; index: number }) => {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed';
    const frequency = c.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY;
    const cadenceConfig = CONTACT_FREQUENCY_CONFIG[frequency];
    const birthday = formatBirthday(c.birthday);

    return (
      <TouchableOpacity
        style={styles.contactCard}
        onPress={() => navigation.navigate('FriendProfile', { contactId: c.id })}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: c.profileImage || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </View>
          
          <Text style={styles.lastContacted}>
            Last: {getLastContactedText(c)}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.cadenceBadge, { backgroundColor: cadenceConfig.color }]}>
              <Text style={styles.cadenceText}>{cadenceConfig.shortLabel}</Text>
            </View>
            {birthday && (
              <View style={styles.birthdayBadge}>
                <Ionicons name="gift-outline" size={12} color={colors.accent} />
                <Text style={styles.birthdayText}>{birthday}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };


  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Your Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="person-add" size={20} color={colors.textLight} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="people" size={48} color={colors.textLight} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No friends yet</Text>
      <Text style={styles.emptyText}>
        Start building your network by adding your first contact!
      </Text>
      <GradientButton
        title="Add Contact"
        icon="person-add"
        onPress={() => navigation.navigate('AddFriend')}
        size="lg"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd] as const}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}

        {isLoading && contacts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : contacts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => renderContactCard({ item, index })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    // backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    ...shadow.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.screenTitle,
  },
  addButton: {
    ...shadow.glow,
    borderRadius: 22,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  

  // Contact cards
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xl,
    ...shadow.sm,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.placeholder,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  name: {
    ...typography.label,
    fontSize: 16,
    flex: 1,
  },
  lastContacted: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cadenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  cadenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  birthdayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
  },
  birthdayText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.accent,
  },

  // List
  listContainer: {
    paddingBottom: 120,
  },

  // Loading & empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconContainer: {
    marginBottom: spacing.xxl,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  emptyTitle: {
    ...typography.heading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
});
