import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  Dimensions, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { FriendsStackParamList, Contact, ContactFrequency, Event as CalendarEvent } from '../../types';
import { loadContacts, updateContact, removeContact } from '../../utils/contactsStorage';
import {
  CONTACT_FREQUENCY_CONFIG,
  CONTACT_FREQUENCY_ORDER,
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
  animations,
} from '../../styles/theme';
import { GradientButton } from '../../components';
import { useGetEventsQuery, useCreateEventMutation } from '../../store/api/eventsApi';
import type { EventType } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const MOCK_USER_ID = 'user-1';

type FriendProfileRouteProp = RouteProp<FriendsStackParamList, 'FriendProfile'>;
type FriendProfileNavProp = StackNavigationProp<FriendsStackParamList, 'FriendProfile'>;

const sanitizePhone = (raw: string) => {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
};
const isValidPhone = (raw: string) => /^\+?\d{10,15}$/.test(sanitizePhone(raw));

const formatBirthdayDetailed = (iso?: string | null) => {
  if (!iso) return 'Not set';
  // Parse as local time to avoid timezone issues
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format YYYY-MM-DD to MM-DD-YYYY for display
const formatBirthdayForInput = (iso?: string | null): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  return `${parts[1]}-${parts[2]}-${parts[0]}`;
};

// Format MM-DD-YYYY input as user types
const formatBirthdayInput = (text: string): string => {
  const digits = text.replace(/\D/g, '');
  const limited = digits.slice(0, 8);
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
};

// Validate MM-DD-YYYY format
const isValidBirthdayInput = (formatted: string): boolean => {
  if (formatted.length !== 10) return false;
  const parts = formatted.split('-');
  if (parts.length !== 3) return false;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
};

// Convert MM-DD-YYYY to YYYY-MM-DD for storage
const convertToISODate = (formatted: string): string => {
  const parts = formatted.split('-');
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
};

const formatEventDate = (iso: string) => {
  // Parse as local time to avoid timezone issues with YYYY-MM-DD dates
  const dateStr = iso.includes('T') ? iso : `${iso}T00:00:00`;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysSince = (dateIso?: string | null) => {
  if (!dateIso) return null;
  const t = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - t) / (1000 * 60 * 60 * 24)));
};

export default function FriendProfileScreen() {
  const route = useRoute<FriendProfileRouteProp>();
  const navigation = useNavigation<FriendProfileNavProp>();
  const params = route.params;
  const friendId = 'friendId' in params ? params.friendId : undefined;
  const contactId = 'contactId' in params ? params.contactId : undefined;
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<Contact | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactFrequency, setContactFrequency] = useState<ContactFrequency>(DEFAULT_CONTACT_FREQUENCY);
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  const { data: events = [], refetch: refetchEvents } = useGetEventsQuery({ userId: MOCK_USER_ID });
  const [createEvent, { isLoading: isCreatingEvent }] = useCreateEventMutation();

  // Event creation state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<EventType>('milestone');

  const eventTypes: { value: EventType; label: string }[] = [
    { value: 'milestone', label: 'Milestone' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'custom', label: 'Custom' },
  ];

  const formatEventDateInput = (text: string): string => {
    const digits = text.replace(/\D/g, '');
    const limited = digits.slice(0, 8);
    if (limited.length === 0) return '';
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)}-${limited.slice(2)}`;
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
  };

  const isValidEventDate = (formatted: string): boolean => {
    if (formatted.length !== 10) return false;
    const parts = formatted.split('-');
    if (parts.length !== 3) return false;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    return true;
  };

  const convertEventDateToISO = (formatted: string): string => {
    const parts = formatted.split('-');
    return `${parts[2]}-${parts[0]}-${parts[1]}`;
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }
    if (!isValidEventDate(eventDate)) {
      Alert.alert('Invalid date', 'Please enter a valid date in MM-DD-YYYY format.');
      return;
    }

    try {
      await createEvent({
        title: eventTitle.trim(),
        date: convertEventDateToISO(eventDate),
        type: eventType,
        userId: MOCK_USER_ID,
        contactId: contact?.id,
        reminderEnabled: true,
      }).unwrap();

      setEventTitle('');
      setEventDate('');
      setEventType('milestone');
      setShowEventModal(false);
      refetchEvents();
      Alert.alert('Event Added', 'The event has been linked to this contact.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create event.');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await loadContacts();
      let c = list.find(ct => ct.id === contactId) || list.find(ct => ct.id === friendId);
      setContact(c ?? null);

      if (c) {
        setFirstName(c.firstName || '');
        setLastName(c.lastName || '');
        setPhone(c.phone || '');
        setContactFrequency(c.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY);
        setBirthday(formatBirthdayForInput(c.birthday));
        setNotes(c.notes || '');
        setProfileImage(c.profileImage);
      }
      setLoading(false);
    })();
  }, [friendId, contactId]);

  const lastContactedDisplay = useMemo(() => {
    if (!contact?.lastContacted) return null;
    const days = daysSince(contact.lastContacted);
    if (days === null) return null;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }, [contact]);

  const relatedEvents = useMemo(() => {
    if (!contact && !friendId) return [] as CalendarEvent[];
    return events.filter(event => {
      if (contactId) return event.contactId === contactId;
      if (friendId) return event.friendId === friendId || event.friendshipId === friendId;
      return false;
    });
  }, [events, contact, contactId, friendId]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Allow photo access to set a profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    // @ts-ignore
    if (!result.canceled) {
      // @ts-ignore
      const uri = result.assets?.[0]?.uri || result.uri;
      if (uri) setProfileImage(uri);
    }
  };

  const onSave = async () => {
    if (!contact) return;
    if (!firstName.trim()) {
      Alert.alert('Validation', 'First name is required.');
      return;
    }
    const normalizedPhone = phone ? sanitizePhone(phone) : '';
    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number.');
      return;
    }

    const normalizedBirthdayInput = birthday.trim() ? birthday.trim() : null;
    let normalizedBirthday: string | null = null;
    if (normalizedBirthdayInput) {
      if (!isValidBirthdayInput(normalizedBirthdayInput)) {
        Alert.alert('Invalid birthday', 'Please enter a valid date in MM-DD-YYYY format.');
        return;
      }
      normalizedBirthday = convertToISODate(normalizedBirthdayInput);
    }

    const updated: Contact = {
      ...contact,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      phone: normalizedPhone || undefined,
      contactFrequency,
      birthday: normalizedBirthday,
      notes: notes || null,
      profileImage,
    };
    await updateContact(updated);
    setContact(updated);
    setBirthday(formatBirthdayForInput(normalizedBirthday));
    Alert.alert('Saved', 'Contact updated successfully.');
  };

  const onDelete = () => {
    if (!contact) return;
    Alert.alert('Delete contact', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await removeContact(contact.id);
          navigation.goBack();
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="person-outline" size={64} color={colors.textMuted} />
        <Text style={styles.notFoundText}>Contact not found</Text>
        <GradientButton
          title="Go Back"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Friend';
  const cadenceConfig = CONTACT_FREQUENCY_CONFIG[contactFrequency];

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Image
              source={{ uri: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
              locations={[0, 0.5, 1]}
              style={styles.heroGradient}
            />

            {/* Back button */}
            <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BlurView intensity={50} tint="dark" style={styles.backButtonBlur}>
                  <Ionicons name="chevron-back" size={24} color={colors.textLight} />
                </BlurView>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Hero content */}
            <View style={styles.heroContent}>
              {/* Profile Image */}
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <LinearGradient
                  colors={[...gradients.storyRing]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.profileImageRing}
                >
                  <View style={styles.profileImageInner}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="camera" size={32} color={colors.textMuted} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={12} color={colors.textLight} />
                </View>
              </TouchableOpacity>

              <Text style={styles.heroName}>{fullName}</Text>
              
              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lastContactedDisplay || '—'}</Text>
                  <Text style={styles.statLabel}>Last Contact</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{relatedEvents.length}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.cadencePillSmall, { backgroundColor: cadenceConfig.color }]}>
                    <Text style={styles.cadencePillText}>{cadenceConfig.shortLabel}</Text>
                  </View>
                  <Text style={styles.statLabel}>Cadence</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name fields */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Phone */}
            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              style={styles.input}
            />

            {/* Birthday */}
            <Text style={styles.label}>Birthday</Text>
            <TextInput
              value={birthday}
              onChangeText={(text) => setBirthday(formatBirthdayInput(text))}
              placeholder="MM-DD-YYYY"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
            />

            {/* Cadence */}
            <Text style={styles.label}>Preferred Cadence</Text>
            <View style={styles.cadenceRow}>
              {CONTACT_FREQUENCY_ORDER.map(freq => {
                const config = CONTACT_FREQUENCY_CONFIG[freq];
                const isActive = contactFrequency === freq;
                return (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.cadencePill,
                      isActive && { backgroundColor: config.color, borderColor: config.color }
                    ]}
                    onPress={() => setContactFrequency(freq)}
                  >
                    <Text style={[
                      styles.cadencePillLabel,
                      isActive && { color: colors.textLight }
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this friend..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.notesInput]}
            />

            {/* Events section */}
            <View style={styles.eventsSection}>
              <View style={styles.eventsSectionHeader}>
                <Text style={styles.label}>Linked Events</Text>
                <TouchableOpacity
                  style={styles.addEventBtn}
                  onPress={() => setShowEventModal(true)}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={styles.addEventBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {relatedEvents.length === 0 ? (
                <View style={styles.noEventsCard}>
                  <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.noEventsText}>No events yet</Text>
                </View>
              ) : (
                relatedEvents.map(event => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventIcon}>
                      <Ionicons name="calendar" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
              <GradientButton
                title="Save Changes"
                onPress={onSave}
                size="lg"
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Event Title</Text>
            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Coffee catch-up, Birthday party..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Date</Text>
            <TextInput
              value={eventDate}
              onChangeText={(text) => setEventDate(formatEventDateInput(text))}
              placeholder="MM-DD-YYYY"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
            />

            <Text style={styles.label}>Event Type</Text>
            <View style={styles.eventTypeRow}>
              {eventTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.eventTypePill,
                    eventType === type.value && styles.eventTypePillActive,
                  ]}
                  onPress={() => setEventType(type.value)}
                >
                  <Text
                    style={[
                      styles.eventTypePillText,
                      eventType === type.value && styles.eventTypePillTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <GradientButton
                title={isCreatingEvent ? 'Saving...' : 'Save Event'}
                onPress={handleCreateEvent}
                disabled={isCreatingEvent}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  notFoundText: {
    ...typography.heading,
    color: colors.textMuted,
  },

  // Hero section
  heroSection: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
  },
  backButton: {
    marginTop: spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  profileImageRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileImageInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  profileImagePlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 12,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroName: {
    ...typography.displayMedium,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xxl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.md,
  },
  cadencePillSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  cadencePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },

  // Form section
  formSection: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    marginTop: -spacing.xxl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    minHeight: SCREEN_HEIGHT - HERO_HEIGHT + spacing.xxl,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  cadenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cadencePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  cadencePillLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Events section
  eventsSection: {
    marginTop: spacing.lg,
  },
  noEventsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  noEventsText: {
    ...typography.body,
    color: colors.textMuted,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...typography.label,
    marginBottom: spacing.xxs,
  },
  eventDate: {
    ...typography.caption,
  },

  // Events section header
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  addEventBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  saveButton: {
    flex: 1,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 20,
  },
  eventTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  eventTypePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  eventTypePillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  eventTypePillText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  eventTypePillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: spacing.xl,
  },
});
