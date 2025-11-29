import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator
} from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { colors, spacing, radius, typography, layout, components } from '../../styles/theme';
import { useGetEventsQuery } from '../../store/api/eventsApi';

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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatEventDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [contactFrequency, setContactFrequency] = useState<ContactFrequency>(DEFAULT_CONTACT_FREQUENCY);
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes]         = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  const { data: events = [] } = useGetEventsQuery({ userId: MOCK_USER_ID });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await loadContacts();

      // If friendId is provided, try to find a matching contact (extend this mapping as needed)
      let c = list.find(ct => ct.id === contactId) || list.find(ct => ct.id === friendId);
      setContact(c ?? null);

      if (c) {
        setFirstName(c.firstName || '');
        setLastName(c.lastName || '');
        setPhone(c.phone || '');
        setContactFrequency(c.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY);
        setBirthday(c.birthday || '');
        setNotes(c.notes || '');
        setProfileImage(c.profileImage);
      }
      setLoading(false);
    })();
  }, [friendId, contactId]);

  const lastContactedDisplay = useMemo(() => {
    if (!contact) return '—';
    return contact.lastContactedCount ?? '—';
  }, [contact]);

  const relatedEvents = useMemo(() => {
    if (!contact && !friendId) return [] as CalendarEvent[];
    return events.filter(event => {
      if (contactId) {
        return event.contactId === contactId;
      }
      if (friendId) {
        return event.friendId === friendId || event.friendshipId === friendId;
      }
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
      const parsed = new Date(normalizedBirthdayInput);
      if (Number.isNaN(parsed.getTime())) {
        Alert.alert('Invalid birthday', 'Please use YYYY-MM-DD format.');
        return;
      }
      normalizedBirthday = parsed.toISOString().slice(0, 10);
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
      // createdAt preserved from spread above
    };
    await updateContact(updated);
    setContact(updated);
    setBirthday(normalizedBirthday ?? '');
    Alert.alert('Saved', 'Contact updated.');
    // navigation.goBack(); // keep open, or uncomment to close after save
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
      <SafeAreaView style={styles.container}>
        <View style={[styles.section, { alignItems: 'center' }]}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.section, { alignItems: 'center' }]}>
          <Text>Contact not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="camera" size={28} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>First name *</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            style={styles.input}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            style={styles.input}
          />

          <Text style={styles.label}>Birthday</Text>
          <TextInput
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />

          <Text style={styles.label}>Preferred cadence</Text>
          <View style={styles.cadenceRow}>
            {CONTACT_FREQUENCY_ORDER.map(freq => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.cadencePill,
                  contactFrequency === freq && {
                    backgroundColor: CONTACT_FREQUENCY_CONFIG[freq].color,
                    borderColor: 'transparent',
                  }
                ]}
                onPress={() => setContactFrequency(freq)}
              >
                <Text
                  style={[
                    styles.cadencePillText,
                    contactFrequency === freq && { color: colors.surface },
                  ]}
                >
                  {CONTACT_FREQUENCY_CONFIG[freq].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            multiline
            numberOfLines={4}
            style={[styles.input, styles.notes]}
          />

          <View style={styles.metaRow}>
            <Text style={styles.metaDim}>Last contacted: {lastContactedDisplay}</Text>
            <Text style={styles.metaDim}>Birthday: {formatBirthdayDetailed(birthday)}</Text>
          </View>

          <View style={styles.eventsSection}>
            <Text style={styles.label}>Linked events</Text>
            {relatedEvents.length === 0 ? (
              <Text style={styles.metaDim}>No events yet.</Text>
            ) : (
              relatedEvents.map(event => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventItemTitle}>{event.title}</Text>
                  <Text style={styles.eventItemMeta}>{formatEventDate(event.date)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>Delete Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  section: ViewStyle;
  imagePicker: ViewStyle;
  avatar: ImageStyle;
  label: TextStyle;
  input: TextStyle;
  notes: TextStyle;
  cadenceRow: ViewStyle;
  cadencePill: ViewStyle;
  cadencePillText: TextStyle;
  metaRow: ViewStyle;
  metaDim: TextStyle;
  eventsSection: ViewStyle;
  eventItem: ViewStyle;
  eventItemTitle: TextStyle;
  eventItemMeta: TextStyle;
  actionsRow: ViewStyle;
  deleteBtn: ViewStyle;
  deleteText: TextStyle;
  saveBtn: ViewStyle;
  saveText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...layout.screen,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  imagePicker: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceMuted,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.placeholder,
  },
  label: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xxs,
    borderRadius: radius.md,
    fontSize: 16,
  },
  notes: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cadenceRow: {
    ...layout.row,
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cadencePill: {
    ...components.chip,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cadencePillText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metaRow: {
    ...layout.rowBetween,
    marginTop: spacing.lg,
  },
  metaDim: {
    color: colors.textSecondary,
  },
  eventsSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  eventItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventItemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsRow: {
    ...layout.rowBetween,
    marginTop: spacing.xxl,
  },
  deleteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
  },
  deleteText: {
    color: colors.surface,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveText: {
    ...typography.buttonPrimary,
  },
});
