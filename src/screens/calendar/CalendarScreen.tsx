// src/screens/calendar/CalendarScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, type DateObject } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius, typography, layout, shadow } from '../../styles/theme';
import { loadContacts } from '../../utils/contactsStorage';
import type { Contact, Event as CalendarEvent, EventType, Friend } from '../../types';
import { useGetFriendsQuery } from '../../store/api/friendsApi';
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
} from '../../store/api/eventsApi';

const MOCK_USER_ID = 'user-1';

type MarkedDateEntry = {
  marked?: boolean;
  dots?: { key: string; color: string }[];
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
};

type MarkedDates = Record<string, MarkedDateEntry>;

type ListedEvent = CalendarEvent & {
  isBirthday?: boolean;
  relatedName?: string;
};

type ContactOption = { id: string; label: string };

const getWeekDates = (iso: string) => {
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [iso];
  const day = (base.getUTCDay() + 6) % 7; // Monday as start
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() - day);
  return Array.from({ length: 7 }, (_, idx) => {
    const dayDate = new Date(start);
    dayDate.setUTCDate(start.getUTCDate() + idx);
    return dayDate.toISOString().slice(0, 10);
  });
};

const formatWeekdayLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { weekday: 'short' });
};

const formatShortDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CalendarScreen: React.FC = () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [visibleMonth, setVisibleMonth] = useState(() => todayIso.slice(0, 7));
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('milestone');
  const [linkedContactId, setLinkedContactId] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState('');
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const { data: friends = [], isLoading: isLoadingFriends } = useGetFriendsQuery({ userId: MOCK_USER_ID });
  const {
    data: manualEvents = [],
    isFetching: isFetchingEvents,
    refetch: refetchEvents,
  } = useGetEventsQuery({ userId: MOCK_USER_ID });
  const [createEvent, { isLoading: isCreatingEvent }] = useCreateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadContacts().then(list => {
        if (mounted) setContacts(list);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const visibleYear = useMemo(() => parseInt(visibleMonth.slice(0, 4), 10), [visibleMonth]);

  const contactNameLookup = useMemo(() => {
    return contacts.reduce<Record<string, string>>((acc, contact) => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
      acc[contact.id] = name || 'Unnamed contact';
      return acc;
    }, {});
  }, [contacts]);

  const friendNameLookup = useMemo(() => {
    return friends.reduce<Record<string, string>>((acc, friend) => {
      const name = [friend.friend.firstName, friend.friend.lastName].filter(Boolean).join(' ').trim();
      acc[friend.friendId] = name;
      return acc;
    }, {});
  }, [friends]);

  const manualEventRows: ListedEvent[] = useMemo(() => {
    return manualEvents.map(event => ({
      ...event,
      relatedName:
        (event.contactId && contactNameLookup[event.contactId]) ||
        (event.friendId && friendNameLookup[event.friendId]) ||
        undefined,
    }));
  }, [manualEvents, contactNameLookup, friendNameLookup]);

  const birthdayEvents: ListedEvent[] = useMemo(() => {
    const currentYear = visibleYear;
    const nextYear = visibleYear + 1;
    const occurrences: ListedEvent[] = [];

    const pushBirthday = (
      ownerId: string,
      displayName: string,
      isoBirthday?: string | null,
      isFriend?: boolean,
    ) => {
      if (!isoBirthday) return;
      const baseDate = new Date(isoBirthday);
      if (Number.isNaN(baseDate.getTime())) return;
      const month = baseDate.getUTCMonth();
      const day = baseDate.getUTCDate();

      [currentYear, nextYear].forEach(year => {
        const occurrence = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
        occurrences.push({
          id: `birthday-${ownerId}-${year}`,
          title: `${displayName}'s Birthday`,
          description: undefined,
          date: occurrence,
          type: 'birthday',
          userId: MOCK_USER_ID,
          contactId: isFriend ? null : ownerId,
          friendId: isFriend ? ownerId : null,
          friendshipId: null,
          isRecurring: true,
          reminderEnabled: true,
          isBirthday: true,
          relatedName: displayName,
        });
      });
    };

    contacts.forEach(contact => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || 'Unnamed contact';
      pushBirthday(contact.id, name, contact.birthday, false);
    });

    friends.forEach(friend => {
      const friendRecord: Friend = friend;
      const name = [friendRecord.friend.firstName, friendRecord.friend.lastName].filter(Boolean).join(' ').trim();
      pushBirthday(friendRecord.friendId, name, friendRecord.birthday ?? friendRecord.friend.birthday, true);
    });

    return occurrences;
  }, [contacts, friends, visibleYear]);

  const combinedEvents: ListedEvent[] = useMemo(() => {
    const map = new Map<string, ListedEvent>();
    [...manualEventRows, ...birthdayEvents].forEach(event => {
      const dateKey = event.date.slice(0, 10);
      map.set(`${event.id}-${dateKey}`, event);
    });
    return Array.from(map.values());
  }, [manualEventRows, birthdayEvents]);

  const eventsByDate = useMemo(() => {
    return combinedEvents.reduce<Record<string, ListedEvent[]>>((acc, event) => {
      const key = event.date.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [combinedEvents]);

  const eventsForSelectedDate = useMemo(() => {
    const items = eventsByDate[selectedDate] ?? [];
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }, [eventsByDate, selectedDate]);

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};
    Object.entries(eventsByDate).forEach(([dateKey, events]) => {
      const dots = events.map(event => ({
        key: `${event.id}-${event.isBirthday ? 'birthday' : 'event'}`,
        color: event.isBirthday ? colors.accent : colors.primary,
      }));
      marks[dateKey] = {
        marked: true,
        dots,
      };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.surface,
    };

    return marks;
  }, [eventsByDate, selectedDate]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const computeDays = (iso?: string | null) => {
      if (!iso) return null;
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return null;
      const currentYear = today.getUTCFullYear();
      const nextOccurrence = new Date(Date.UTC(currentYear, date.getUTCMonth(), date.getUTCDate()));
      if (nextOccurrence < new Date(today.toISOString().slice(0, 10))) {
        nextOccurrence.setUTCFullYear(currentYear + 1);
      }
      const diffDays = Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { diffDays, iso: nextOccurrence.toISOString().slice(0, 10) };
    };

    const entries: { name: string; inDays: number; iso: string }[] = [];

    contacts.forEach(contact => {
      const result = computeDays(contact.birthday);
      if (!result) return;
      if (result.diffDays <= 7) {
        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || 'Unnamed contact';
        entries.push({ name, inDays: result.diffDays, iso: result.iso });
      }
    });

    friends.forEach(friend => {
      const result = computeDays(friend.birthday ?? friend.friend.birthday);
      if (!result) return;
      if (result.diffDays <= 7) {
        const name = [friend.friend.firstName, friend.friend.lastName].filter(Boolean).join(' ').trim();
        entries.push({ name, inDays: result.diffDays, iso: result.iso });
      }
    });

    return entries.sort((a, b) => a.inDays - b.inDays);
  }, [contacts, friends]);

  const eventTypeOptions: { value: EventType; label: string }[] = useMemo(
    () => [
      { value: 'milestone', label: 'Milestone' },
      { value: 'birthday', label: 'Birthday' },
      { value: 'anniversary', label: 'Anniversary' },
      { value: 'achievement', label: 'Achievement' },
      { value: 'holiday', label: 'Holiday' },
      { value: 'custom', label: 'Custom' },
    ],
    [],
  );

  const selectedEventTypeLabel = useMemo(() => {
    return eventTypeOptions.find(option => option.value === eventType)?.label ?? 'Select type';
  }, [eventTypeOptions, eventType]);

  const filteredContacts = useMemo(() => {
    const query = contactQuery.trim().toLowerCase();
    const base = contacts;
    if (!query) return base;
    return base.filter(contact => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').toLowerCase();
      const phone = contact.phone?.toLowerCase() ?? '';
      return name.includes(query) || phone.includes(query);
    });
  }, [contacts, contactQuery]);

  const contactOptions: ContactOption[] = useMemo(() => {
    return [
      { id: 'none', label: 'None' },
      ...filteredContacts.map(contact => ({ id: contact.id, label: contactNameLookup[contact.id] })),
    ];
  }, [filteredContacts, contactNameLookup]);

  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventType('milestone');
    setLinkedContactId(null);
    setContactQuery('');
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Missing title', 'Please add a title for the event.');
      return;
    }

    try {
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        type: eventType,
        date: selectedDate,
        userId: MOCK_USER_ID,
        contactId: linkedContactId,
        reminderEnabled: true,
      };

      await createEvent(payload).unwrap();
      resetForm();
      setAddModalVisible(false);
      refetchEvents();
      Alert.alert('Event added', 'Your event was saved to the calendar.');
    } catch (error: any) {
      const message = error?.data?.error || error?.message || JSON.stringify(error);
      Alert.alert('Unable to save', message);
    }
  };

  const handleDeleteEvent = async (eventId: string, userId: string) => {
    Alert.alert('Remove event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent({ id: eventId, userId }).unwrap();
            refetchEvents();
          } catch (error: any) {
            const message = error?.data?.error || error?.message || JSON.stringify(error);
            Alert.alert('Unable to delete', message);
          }
        },
      },
    ]);
  };

  const formatDateHeading = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const weekAggregated = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      events: (eventsByDate[date] ?? []).sort((a, b) => a.title.localeCompare(b.title)),
    }));
  }, [weekDates, eventsByDate]);

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    setVisibleMonth(iso.slice(0, 7));
  };

  const renderWeekView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.weekScroll}
    >
      {weekAggregated.map(day => {
        const isActive = day.date === selectedDate;
        return (
          <TouchableOpacity
            key={day.date}
            style={[styles.weekDayCard, isActive && styles.weekDayCardActive]}
            onPress={() => handleSelectDate(day.date)}
          >
            <Text style={[styles.weekDayLabel, isActive && styles.weekDayLabelActive]}>
              {formatWeekdayLabel(day.date)}
            </Text>
            <Text style={[styles.weekDayDate, isActive && styles.weekDayLabelActive]}>
              {formatShortDate(day.date)}
            </Text>
            {day.events.length === 0 ? (
              <Text style={styles.weekDayNoEvent}>No events</Text>
            ) : (
              day.events.slice(0, 3).map(event => (
                <Text key={`${event.id}-${event.title}`} style={styles.weekDayEvent}>
                  • {event.title}
                </Text>
              ))
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderEventItem = ({ item }: { item: ListedEvent }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <View style={styles.eventTitleRow}>
          <View
            style={[
              styles.eventDot,
              { backgroundColor: item.isBirthday ? colors.accent : colors.primary },
            ]}
          />
          <Text style={styles.eventTitle}>{item.title}</Text>
        </View>
        {!item.isBirthday && (
          <TouchableOpacity
            onPress={() => handleDeleteEvent(item.id, item.userId)}
            style={styles.eventActionBtn}
            accessibilityLabel="Delete event"
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      {item.relatedName ? (
        <Text style={styles.eventMeta}>Linked contact: {item.relatedName}</Text>
      ) : null}
      {item.description ? (
        <Text style={styles.eventDescription}>{item.description}</Text>
      ) : null}
    </View>
  );

  const renderTypeSelector = () => (
    <View>
      <Text style={styles.modalLabel}>Event type</Text>
      <TouchableOpacity
        style={styles.selectInput}
        onPress={() => setTypePickerVisible(true)}
      >
        <Text style={styles.selectInputValue}>{selectedEventTypeLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderContactSelector = () => (
    <View>
      <Text style={styles.modalLabel}>Link to contact (optional)</Text>
      <TouchableOpacity
        style={styles.selectInput}
        onPress={() => setContactPickerVisible(true)}
      >
        <Text style={linkedContactId ? styles.selectInputValue : styles.selectInputPlaceholder}>
          {linkedContactId ? contactNameLookup[linkedContactId] : 'Select a contact'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderViewToggle = () => (
    <View style={styles.toggleRow}>
      {[
        { label: 'Month', value: 'month' as const },
        { label: 'Week', value: 'week' as const },
        { label: 'Day', value: 'day' as const },
      ].map(option => {
        const active = viewMode === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.toggleBtn, active && styles.toggleBtnActive]}
            onPress={() => setViewMode(option.value)}
          >
            <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderViewToggle()}

        {isLoadingFriends && isFetchingEvents ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {upcomingBirthdays.length > 0 && (
          <View style={styles.banner}>
            <Ionicons name="gift" size={20} color={colors.accent} style={styles.bannerIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Upcoming birthdays</Text>
              {upcomingBirthdays.map(entry => (
                <Text key={`${entry.name}-${entry.iso}`} style={styles.bannerText}>
                  {entry.name} • in {entry.inDays} day{entry.inDays === 1 ? '' : 's'} ({new Date(entry.iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                </Text>
              ))}
            </View>
          </View>
        )}

        {viewMode === 'month' && (
          <View style={styles.calendarCard}>
            <Calendar
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={(day: DateObject) => handleSelectDate(day.dateString)}
              onMonthChange={(month: DateObject) => {
                setVisibleMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
              }}
              initialDate={selectedDate}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.surface,
                todayTextColor: colors.primary,
                dayTextColor: colors.textPrimary,
                monthTextColor: colors.textPrimary,
                arrowColor: colors.primary,
                textSectionTitleColor: colors.textSecondary,
              }}
            />
          </View>
        )}

        {viewMode === 'week' && renderWeekView()}

        {viewMode === 'day' && (
          <View style={styles.dayHighlight}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.dayHighlightText}>{formatDateHeading(selectedDate)}</Text>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{formatDateHeading(selectedDate)}</Text>
          <TouchableOpacity
            style={styles.addEventBtn}
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={colors.surface} />
            <Text style={styles.addEventText}>Add event</Text>
          </TouchableOpacity>
        </View>

        {eventsForSelectedDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No plans yet</Text>
            <Text style={styles.emptyStateSub}>Create an event or link a contact to populate this day.</Text>
          </View>
        ) : (
          <FlatList
            data={eventsForSelectedDate}
            keyExtractor={item => item.id}
            renderItem={renderEventItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New event</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Coffee catch-up"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="Notes, agenda, reminders"
              style={[styles.modalInput, styles.modalTextArea]}
              multiline
            />

            {renderTypeSelector()}

            {renderContactSelector()}

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, isCreatingEvent && styles.modalButtonDisabled]}
              onPress={handleCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>Save event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContainer}>
            <Text style={styles.sheetTitle}>Select event type</Text>
            {eventTypeOptions.map(option => {
              const active = option.value === eventType;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sheetRow, active && styles.sheetRowActive]}
                  onPress={() => {
                    setEventType(option.value);
                    setTypePickerVisible(false);
                  }}
                >
                  <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={contactPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactPickerVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Link to contact</Text>
              <TouchableOpacity onPress={() => setContactPickerVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={contactQuery}
              onChangeText={setContactQuery}
              placeholder="Search contacts"
              style={styles.sheetSearch}
            />
            <FlatList
              data={contactOptions}
              keyExtractor={item => item.id}
              renderItem={({ item }: { item: ContactOption }) => (
                <TouchableOpacity
                  style={[styles.sheetRow, linkedContactId === (item.id === 'none' ? null : item.id) && styles.sheetRowActive]}
                  onPress={() => {
                    setLinkedContactId(item.id === 'none' ? null : item.id);
                    setContactQuery('');
                    setContactPickerVisible(false);
                  }}
                >
                  <Text style={[styles.sheetRowText, linkedContactId === (item.id === 'none' ? null : item.id) && styles.sheetRowTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CalendarScreen;

type Styles = {
  container: ViewStyle;
  scrollContent: ViewStyle;
  toggleRow: ViewStyle;
  toggleBtn: ViewStyle;
  toggleBtnActive: ViewStyle;
  toggleBtnText: TextStyle;
  toggleBtnTextActive: TextStyle;
  loadingWrapper: ViewStyle;
  banner: ViewStyle;
  bannerIcon: ViewStyle;
  bannerTitle: TextStyle;
  bannerText: TextStyle;
  calendarCard: ViewStyle;
  weekScroll: ViewStyle;
  weekDayCard: ViewStyle;
  weekDayCardActive: ViewStyle;
  weekDayLabel: TextStyle;
  weekDayLabelActive: TextStyle;
  weekDayDate: TextStyle;
  weekDayEvent: TextStyle;
  weekDayNoEvent: TextStyle;
  dayHighlight: ViewStyle;
  dayHighlightText: TextStyle;
  sectionHeading: ViewStyle;
  sectionTitle: TextStyle;
  addEventBtn: ViewStyle;
  addEventText: TextStyle;
  emptyState: ViewStyle;
  emptyStateText: TextStyle;
  emptyStateSub: TextStyle;
  separator: ViewStyle;
  eventCard: ViewStyle;
  eventCardHeader: ViewStyle;
  eventTitleRow: ViewStyle;
  eventTitle: TextStyle;
  eventMeta: TextStyle;
  eventDescription: TextStyle;
  eventDot: ViewStyle;
  eventActionBtn: ViewStyle;
  modalBackdrop: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  modalLabel: TextStyle;
  modalInput: TextStyle;
  modalTextArea: TextStyle;
  selectInput: ViewStyle;
  selectInputValue: TextStyle;
  selectInputPlaceholder: TextStyle;
  modalPrimaryBtn: ViewStyle;
  modalPrimaryBtnText: TextStyle;
  modalButtonDisabled: ViewStyle;
  sheetBackdrop: ViewStyle;
  sheetContainer: ViewStyle;
  sheetHeader: ViewStyle;
  sheetTitle: TextStyle;
  sheetSearch: TextStyle;
  sheetRow: ViewStyle;
  sheetRowActive: ViewStyle;
  sheetRowText: TextStyle;
  sheetRowTextActive: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...layout.screen,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  toggleRow: {
    ...layout.row,
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  toggleBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleBtnTextActive: {
    color: colors.primary,
  },
  loadingWrapper: {
    ...layout.row,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  banner: {
    ...layout.row,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    marginRight: spacing.md,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  bannerText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  calendarCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  weekScroll: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    paddingRight: spacing.sm,
  },
  weekDayCard: {
    width: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow.card,
    marginRight: spacing.sm,
  },
  weekDayCardActive: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  weekDayLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  weekDayLabelActive: {
    color: colors.primary,
  },
  weekDayDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  weekDayEvent: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  weekDayNoEvent: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dayHighlight: {
    ...layout.row,
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  dayHighlightText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sectionHeading: {
    ...layout.rowBetween,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  addEventBtn: {
    ...layout.row,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  addEventText: {
    ...typography.buttonPrimary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyStateSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: spacing.xs,
  },
  eventCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.card,
  },
  eventCardHeader: {
    ...layout.rowBetween,
    marginBottom: spacing.sm,
  },
  eventTitleRow: {
    ...layout.row,
    gap: spacing.sm,
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventActionBtn: {
    padding: spacing.xs,
  },
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  modalHeader: {
    ...layout.rowBetween,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.sectionTitle,
  },
  modalLabel: {
    ...typography.label,
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  selectInput: {
    ...layout.rowBetween,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  selectInputValue: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
    flex: 1,
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    ...typography.buttonPrimary,
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  sheetHeader: {
    ...layout.rowBetween,
    alignItems: 'center',
  },
  sheetTitle: {
    ...typography.sectionTitle,
  },
  sheetSearch: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sheetRow: {
    paddingVertical: spacing.sm,
  },
  sheetRowActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  sheetRowText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  sheetRowTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
