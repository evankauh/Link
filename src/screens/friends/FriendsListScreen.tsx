import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FriendsStackParamList } from '../../types';

import { useGetFriendsQuery, useUpdateContactFrequencyMutation } from '../../store/api/friendsApi';
import type { Friend, Contact, ContactFrequency } from '../../types';
import { loadContacts } from '../../utils/contactsStorage';
import {
  CONTACT_FREQUENCY_CONFIG,
  CONTACT_FREQUENCY_ORDER,
} from '../../constants/contactFrequency';
import { colors, spacing, radius, typography, layout, components } from '../../styles/theme';

const MOCK_USER_ID = 'user-1';

export default function FriendsListScreen() {
  const navigation = useNavigation<StackNavigationProp<FriendsStackParamList, 'FriendsList'>>();
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    data: friends = [],
    isLoading,
    refetch
  } = useGetFriendsQuery({ userId: MOCK_USER_ID });
  const [updateContactFrequency] = useUpdateContactFrequencyMutation();

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
    setContacts([...loaded].sort(sortByName)); // storage already sorts; this is a safe guard
  };

  useEffect(() => {
    loadContactsFromStorage();
  }, []);

  const handleFrequencyChange = (friend: Friend) => {
    alertOptions(
      'Update Contact Cadence',
      `How often would you like to connect with ${friend.friend.firstName}?`,
      [
        ...CONTACT_FREQUENCY_ORDER.map(freq => ({
          text: CONTACT_FREQUENCY_CONFIG[freq].label,
          onPress: () => updateContactFrequency({ friendshipId: friend.id, contactFrequency: freq }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const alertOptions = (
    title: string,
    message: string,
    buttons: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }[]
  ) => {
    // Small wrapper to keep the code tidy here
    // eslint-disable-next-line no-alert
    // @ts-ignore react-native's Alert API type
    import('react-native').then(({ Alert }) => Alert.alert(title, message, buttons));
  };

  const getLastContactedText = (contact?: Contact) => {
    // Prefer the derived field from storage; fallback to a quick formatter
    if (contact?.lastContactedCount) return contact.lastContactedCount;
    if (!contact?.lastContacted) return '—';
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
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderFriend = ({ item: friend }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.rowCard}
      onPress={() => navigation.navigate('FriendProfile', { friendId: friend.friendId })}
      onLongPress={() => handleFrequencyChange(friend)}
      activeOpacity={0.8}
    >
      <View style={styles.rowContent}>
        <Image
          source={{ uri: friend.friend.profileImage || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.textCol}>
          <Text style={styles.name}>
            {friend.friend.firstName} {friend.friend.lastName}
          </Text>
          <Text style={styles.username}>@{friend.friend.username}</Text>
          <View style={styles.metaRow}>
            <TouchableOpacity
              onPress={() => handleFrequencyChange(friend)}
              style={[
                styles.cadenceBadge,
                { backgroundColor: CONTACT_FREQUENCY_CONFIG[friend.contactFrequency].color },
              ]}
              activeOpacity={0.8}
              accessibilityLabel={`Preferred cadence: ${CONTACT_FREQUENCY_CONFIG[friend.contactFrequency].label}`}
            >
              <Text style={styles.cadenceText}>
                {CONTACT_FREQUENCY_CONFIG[friend.contactFrequency].shortLabel}
              </Text>
            </TouchableOpacity>
            <Text style={styles.metaDim}>
              Last: {getLastContactedText({ lastContacted: friend.lastContacted } as any)}
            </Text>
            <Text style={styles.metaDim}>
              Birthday: {formatBirthday(friend.birthday ?? friend.friend?.birthday)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderContact = (c: Contact) => {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed';
    return (
      <TouchableOpacity
        style={styles.rowCard}
        onPress={() => navigation.navigate('FriendProfile', { contactId: c.id })} // open full-screen editor
        activeOpacity={0.8}
      >
        <View style={styles.rowContent}>
          <Image
            source={{ uri: c.profileImage || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          <View style={styles.textCol}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.username}>{c.phone || ''}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.cadenceBadge, { backgroundColor: CONTACT_FREQUENCY_CONFIG[c.contactFrequency].color }]}>
                <Text style={styles.cadenceText}>{CONTACT_FREQUENCY_CONFIG[c.contactFrequency].shortLabel}</Text>
              </View>
              <Text style={styles.metaDim}>Last: {getLastContactedText(c)}</Text>
              <Text style={styles.metaDim}>Birthday: {formatBirthday(c.birthday)}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const friendsByFrequency = friends.reduce((acc, friend) => {
    (acc[friend.contactFrequency] ||= []).push(friend);
    return acc;
  }, {} as Record<ContactFrequency, Friend[]>);

  type SectionItem =
    | { type: 'header'; title: string; count: number }
    | { type: 'friend'; friend: Friend }
    | { type: 'contact-header'; count: number }
    | { type: 'contact'; contact: Contact };

  const sectionsData: SectionItem[] = useMemo(() => {
    const data: SectionItem[] = [];

    if (contacts.length > 0) {
      data.push({ type: 'contact-header', count: contacts.length });
      contacts.forEach(c => data.push({ type: 'contact', contact: c }));
    }

    CONTACT_FREQUENCY_ORDER
      .map(freq => ({ title: CONTACT_FREQUENCY_CONFIG[freq].label, list: friendsByFrequency[freq] || [] }))
      .filter(section => section.list.length > 0)
      .forEach(section => {
        data.push({ type: 'header', title: section.title, count: section.list.length });
        section.list.forEach(fr => data.push({ type: 'friend', friend: fr }));
      });

    return data;
  }, [contacts, friends]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && friends.length === 0 && contacts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Loading friends...</Text>
        </View>
      ) : (friends.length === 0 && contacts.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No friends yet</Text>
          <Text style={styles.emptyText}>Start building your network by adding friends!</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Text style={styles.ctaText}>Create Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sectionsData}
          keyExtractor={(item, idx) =>
            item.type === 'contact-header' ? 'contact-header'
              : item.type === 'contact' ? `contact-${item.contact.id}`
              : item.type === 'header' ? `header-${item.title}`
              : `friend-${item.friend.id}`
          }
          renderItem={({ item }) => {
            if (item.type === 'contact-header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Local Contacts</Text>
                  <Text style={styles.sectionCount}>{item.count}</Text>
                </View>
              );
            }
            if (item.type === 'contact') return renderContact(item.contact);
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  <Text style={styles.sectionCount}>{item.count}</Text>
                </View>
              );
            }
            return renderFriend({ item: item.friend });
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  addButton: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  sectionCount: TextStyle;
  listContainer: ViewStyle;
  rowCard: ViewStyle;
  rowContent: ViewStyle;
  avatar: ImageStyle;
  textCol: ViewStyle;
  name: TextStyle;
  username: TextStyle;
  metaRow: ViewStyle;
  cadenceBadge: ViewStyle;
  cadenceText: TextStyle;
  metaDim: TextStyle;
  loadingContainer: ViewStyle;
  emptyContainer: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  cta: ViewStyle;
  ctaText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...layout.screen,
  },
  header: {
    ...layout.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.screenTitle,
  },
  addButton: {
    padding: spacing.sm,
  },
  sectionHeader: {
    ...layout.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  sectionCount: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingBottom: spacing.xxl,
  },
  rowCard: {
    ...layout.row,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  rowContent: {
    ...layout.row,
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.lg,
    backgroundColor: colors.placeholder,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    ...layout.row,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cadenceBadge: {
    ...components.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cadenceText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '600',
  },
  metaDim: {
    fontSize: 12,
    color: colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl + spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  ctaText: {
    ...typography.buttonPrimary,
  },
});
