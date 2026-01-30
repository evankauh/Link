// src/screens/home/HomeScreen.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Linking,
} from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius, layout, typography, shadow } from '../../styles/theme';

// --- Canonical types & storage utils ---
import type { Contact, ContactFrequency } from '../../types';
import { loadContacts, updateContact } from '../../utils/contactsStorage';
import {
  CONTACT_FREQUENCY_CONFIG,
  DEFAULT_CONTACT_FREQUENCY,
} from '../../constants/contactFrequency';

// ---------- Minimal local types ----------
type FrequencyKey = ContactFrequency;

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
};

type ConnectionReason =
  | { type?: 'upcoming_event' | 'last_contact' | 'cadence'; description: string };

type ConnectionSuggestion = {
  id: string;
  friendId: string;
  friend: User;
  score: number;
  reasons: ConnectionReason[];
  suggestedAt: string;
  dismissed?: boolean;
  meta?: {
    lastContactedISO?: string | null;
    frequency?: FrequencyKey;
  };
};

// ---------- Cadence weighting & cadence ----------
const FREQUENCY_BASE_SCORE: Record<FrequencyKey, number> = {
  biweekly: 60,
  monthly: 48,
  quarterly: 34,
  semiannual: 24,
};

const FREQUENCY_URGENCY_MULTIPLIER: Record<FrequencyKey, number> = {
  biweekly: 1.2,
  monthly: 1.0,
  quarterly: 0.7,
  semiannual: 0.5,
};

// ---------- Helpers ----------
const daysSince = (dateIso?: string | null) => {
  if (!dateIso) return 999;
  const t = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - t) / (1000 * 60 * 60 * 24)));
};

const formatLastContacted = (iso?: string | null) => {
  if (!iso) return 'Not recorded';
  const d = daysSince(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
};

const fullName = (c: { firstName?: string; lastName?: string; username?: string }) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.username || 'Friend';

const asUser = (c: Contact): User => ({
  id: c.id,
  firstName: c.firstName || '',
  lastName: c.lastName || '',
  username: (c.firstName || 'friend').toLowerCase(),
  profileImage: c.profileImage,
});

// ===================================================================================
/**
 * useLocalConnectionSuggestions
 * Computes suggestions entirely on-device from locally stored contacts.
 * - Cadence weighting
 * - Recency decay (lower chance if recently contacted)
 * - Random jitter so it feels fresh
 */
// ===================================================================================
function useLocalConnectionSuggestions() {
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const scoreContact = useCallback((c: Contact) => {
    const frequency = c.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY;
    const config = CONTACT_FREQUENCY_CONFIG[frequency];
    const baseScore = FREQUENCY_BASE_SCORE[frequency];
    const urgencyScale = FREQUENCY_URGENCY_MULTIPLIER[frequency];
    const ds = daysSince(c.lastContacted);
    const cadence = config.days;
    const ratio = cadence ? ds / cadence : 0;

    const approachingBoost = ratio < 1 ? ratio * 20 * urgencyScale : 0;
    const overdueBoost = ratio >= 1 ? Math.min(ratio - 1, 2) * 35 * urgencyScale : 0;
    const freshnessPenalty = ratio < 0.3 ? -10 * (1 - ratio / 0.3) : 0;
    const jitter = Math.random() * 8;

    return baseScore + approachingBoost + overdueBoost + freshnessPenalty + jitter;
  }, []);

  const compute = useCallback(async () => {
    setLoading(true);
    try {
      const contacts: Contact[] = await loadContacts();
      const enriched: ConnectionSuggestion[] = contacts.map((c) => {
        const score = scoreContact(c);
        const frequency = c.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY;
        return {
          id: `local-${c.id}-${Math.random().toString(36).slice(2, 7)}`,
          friendId: c.id,
          friend: asUser(c),
          score,
          reasons: [
            { type: 'cadence', description: `Cadence: ${CONTACT_FREQUENCY_CONFIG[frequency].label}` },
            c.lastContacted
              ? { description: `Last chatted ${daysSince(c.lastContacted)} days ago` }
              : { description: 'No recent contact recorded' },
          ],
          suggestedAt: new Date().toISOString(),
          meta: {
            lastContactedISO: c.lastContacted ?? null,
            frequency,
          },
        };
      });

      enriched.sort((a, b) => b.score - a.score);
      setSuggestions(enriched.slice(0, 5));
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [scoreContact]);

  // initial load
  useEffect(() => {
    compute();
  }, [compute]);

  const generateNewSuggestion = useCallback(async () => {
    // Recompute with fresh jitter/decay; produces a new top suggestion.
    await compute();
  }, [compute]);

  const topSuggestion = useMemo(
    () => (suggestions.length ? suggestions[0] : undefined),
    [suggestions]
  );

  return {
    loading,
    suggestions,
    topSuggestion,
    refresh: compute,
    generateNewSuggestion,
  };
}

// ===================================================================================
// HomeScreen
// ===================================================================================
const HomeScreen: React.FC = () => {
  const {
    loading,
    topSuggestion,
    refresh,
    generateNewSuggestion,
  } = useLocalConnectionSuggestions();

  const [refreshing, setRefreshing] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selected, setSelected] = useState<ConnectionSuggestion | undefined>();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openSuggestionDetail = useCallback((s: ConnectionSuggestion) => {
    setSelected(s);
    setDetailVisible(true);
  }, []);

  const handleCallNow = useCallback(async () => {
    if (!selected) return;
    const contactId = selected.friendId;

    try {
      const contacts: Contact[] = await loadContacts();
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) {
        Alert.alert('Contact not found');
        return;
      }
      if (!contact.phone) {
        Alert.alert('No phone number', `${fullName(contact)} has no phone on file.`);
        return;
      }

      const phoneUrl = `tel:${contact.phone}`;
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert('Cannot start a call on this device');
        return;
      }

      // ✅ Preserve existing createdAt; no casts, no mutation of createdAt
      const nowIso = new Date().toISOString();
      const updated: Contact = {
        ...contact,
        lastContacted: nowIso,
        lastContactedCount: 'Today', // will also be normalized in storage for safety
      };

      await updateContact(updated);
      await Linking.openURL(phoneUrl);
    } catch (e) {
      console.error(e);
      Alert.alert('Something went wrong starting the call.');
    } finally {
      setDetailVisible(false);
    }
  }, [selected]);

  // ---------- UI ----------
  const renderTopWidget = () => {
    if (!topSuggestion) return null;

    const name = fullName(topSuggestion.friend);
    const last = formatLastContacted(topSuggestion.meta?.lastContactedISO);

    return (
      <>
        {/* Large rectangular, tappable image widget */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openSuggestionDetail(topSuggestion)}
          style={styles.heroImageWrapper}
        >
          <Image
            source={{
              uri:
                topSuggestion.friend.profileImage ||
                'https://via.placeholder.com/1200x600',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Contact info below the widget */}
        <View style={styles.contactInfoBlock}>
          <Text style={styles.contactName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.contactMeta}>Last contacted: {last}</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Suggested Connection</Text>
          <TouchableOpacity onPress={refresh} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} />
          </TouchableOpacity>
        </View>

        {/* Top suggested friend widget */}
        {topSuggestion ? (
          renderTopWidget()
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No suggestions yet</Text>
            <Text style={styles.emptySubtitle}>
              Add contacts and set their cadences to get started.
            </Text>
            <TouchableOpacity onPress={refresh} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NOTE: "More suggestions" section removed per requirements */}
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selected && (
              <>
                <Image
                  source={{
                    uri:
                      selected.friend.profileImage ||
                      'https://via.placeholder.com/160',
                  }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalName}>
                  {fullName(selected.friend)}
                </Text>
                {!!selected.reasons?.length && (
                  <Text style={styles.modalReasons}>
                    {selected.reasons.map((r) => r.description).join(' • ')}
                  </Text>
                )}

                {/* Call Now */}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCallNow}>
                  <Ionicons name="call" size={18} color={colors.surface} />
                  <Text style={styles.primaryBtnText}>Call Now</Text>
                </TouchableOpacity>

                {/* Generate New Suggestion */}
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={async () => {
                    await generateNewSuggestion();
                    setDetailVisible(false);
                  }}
                >
                  <Ionicons name="shuffle" size={18} color={colors.primary} />
                  <Text style={styles.secondaryBtnText}>Generate New Suggestion</Text>
                </TouchableOpacity>

                {/* Dismiss */}
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setDetailVisible(false)}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;

// ---------- Styles ----------
const HERO_ASPECT_RATIO = 9 / 12;

type Styles = {
  container: ViewStyle;
  scrollContent: ViewStyle;
  headerRow: ViewStyle;
  headerTitle: TextStyle;
  iconBtn: ViewStyle;
  heroImageWrapper: ViewStyle;
  heroImage: ImageStyle;
  contactInfoBlock: ViewStyle;
  contactName: TextStyle;
  contactMeta: TextStyle;
  emptyState: ViewStyle;
  emptyTitle: TextStyle;
  emptySubtitle: TextStyle;
  primaryBtn: ViewStyle;
  primaryBtnText: TextStyle;
  secondaryBtn: ViewStyle;
  secondaryBtnText: TextStyle;
  modalBackdrop: ViewStyle;
  modalCard: ViewStyle;
  modalImage: ImageStyle;
  modalName: TextStyle;
  modalReasons: TextStyle;
  dismissBtn: ViewStyle;
  dismissBtnText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...layout.surfaceScreen,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    ...layout.rowBetween,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    fontWeight: '800',
  },
  iconBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },

  // --- Large suggested friend widget ---
  heroImageWrapper: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    width: '100%',
    height: undefined,
    aspectRatio: HERO_ASPECT_RATIO, // rectangular
  },
  contactInfoBlock: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  contactName: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: '800',
  },
  contactMeta: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 14,
  },

  // --- Empty state ---
  emptyState: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // --- Buttons shared ---
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
  },
  primaryBtnText: {
    ...typography.buttonPrimary,
  },
  secondaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...typography.buttonSecondary,
  },

  // --- Modal ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadow.card,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    backgroundColor: colors.placeholder,
  },
  modalName: {
    textAlign: 'center',
    ...typography.heading,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  modalReasons: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dismissBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  dismissBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
