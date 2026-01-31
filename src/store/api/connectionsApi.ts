// src/store/api/connectionsApi.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase/client';
import type { ConnectionSuggestion, ConnectionReason, Friend, Contact, User, ContactFrequency } from '../../types';
import { loadContacts } from '../../utils/contactsStorage';
import {
  CONTACT_FREQUENCY_CONFIG,
  DEFAULT_CONTACT_FREQUENCY,
} from '../../constants/contactFrequency';

const FREQUENCY_PRIORITY: Record<ContactFrequency, number> = {
  weekly: 80,
  biweekly: 65,
  monthly: 50,
  quarterly: 35,
  biannual: 25,
  annually: 10,
};

const BASE_RANDOMNESS = 8;

const computeCadenceScore = (
  frequency: ContactFrequency,
  lastContacted: string | null | undefined,
  referenceDate: Date,
) => {
  const cadenceDays = CONTACT_FREQUENCY_CONFIG[frequency].days;
  const priority = FREQUENCY_PRIORITY[frequency];

  if (!lastContacted) {
    return {
      score: priority + 40,
      reason: 'New connection — no contact recorded yet',
    };
  }

  const now = referenceDate.getTime();
  const last = new Date(lastContacted).getTime();
  const daysSince = Math.max(0, Math.floor((now - last) / (1000 * 60 * 60 * 24)));
  const ratio = cadenceDays ? daysSince / cadenceDays : 0;

  if (ratio >= 1) {
    const overdueDays = daysSince - cadenceDays;
    const overdueBoost = Math.min(60, 30 + overdueDays * 0.6);
    return {
      score: priority + overdueBoost,
      reason: overdueDays > 0
        ? `Over cadence by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`
        : `Due now (every ${cadenceDays} days)`
    };
  }

  const progressBoost = Math.max(10, ratio * 25);
  const daysUntilDue = Math.max(0, cadenceDays - daysSince);
  return {
    score: priority + progressBoost,
    reason: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
  };
};

const computeBirthdayBonus = (iso?: string | null) => {
  if (!iso) return null;
  const birthday = new Date(iso);
  if (Number.isNaN(birthday.getTime())) return null;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const nextOccurrence = new Date(Date.UTC(currentYear, birthday.getUTCMonth(), birthday.getUTCDate()));
  const todayStart = new Date(now.toISOString().slice(0, 10));
  if (nextOccurrence < todayStart) {
    nextOccurrence.setUTCFullYear(currentYear + 1);
  }
  const diffDays = Math.ceil((nextOccurrence.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  return { diffDays, nextOccurrence };
};

// Improved connection suggestion algorithm
const calculateConnectionScore = (
  friend: Friend,
  upcomingEvents: any[],
  currentDate: Date
): { score: number; reasons: ConnectionReason[] } => {
  const reasons: ConnectionReason[] = [];
  const frequency = friend.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY;
  const priorityReasonWeight = FREQUENCY_PRIORITY[frequency];
  reasons.push({
    type: 'cadence_priority',
    description: `Cadence: ${CONTACT_FREQUENCY_CONFIG[frequency].label}`,
    weight: priorityReasonWeight,
  });

  const cadenceResult = computeCadenceScore(frequency, friend.lastContacted, currentDate);
  reasons.push({
    type: 'last_contacted',
    description: cadenceResult.reason,
    weight: Math.max(5, cadenceResult.score - priorityReasonWeight),
  });

  let score = cadenceResult.score + Math.random() * BASE_RANDOMNESS;

  const birthdayBonus = computeBirthdayBonus(friend.birthday ?? friend.friend?.birthday);
  if (birthdayBonus && birthdayBonus.diffDays <= 30) {
    const weight = birthdayBonus.diffDays <= 7 ? 50 : 30;
    score += weight;
    reasons.push({
      type: 'upcoming_event',
      description: `Birthday in ${birthdayBonus.diffDays} day${birthdayBonus.diffDays === 1 ? '' : 's'}`,
      weight,
    });
  }

  // Upcoming events scoring
  const friendEvents = upcomingEvents.filter(event => 
    event.user_id === friend.friendId || event.title.toLowerCase().includes(friend.friend.firstName.toLowerCase())
  );
  
  friendEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const daysUntilEvent = Math.floor(
      (eventDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
    );
    
    if (daysUntilEvent <= 7 && daysUntilEvent >= 0) {
      let eventScore = 0;
      if (event.type === 'birthday') eventScore = 40;
      else if (event.type === 'anniversary') eventScore = 30;
      else if (event.type === 'achievement') eventScore = 25;
      else if (event.type === 'milestone') eventScore = 25;
      else eventScore = 20;
      
      score += eventScore;
      reasons.push({
        type: 'upcoming_event',
        description: `${event.title} in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`,
        weight: eventScore,
      });
    }
  });

  return { score, reasons };
};

const calculateContactScore = (
  contact: Contact,
  upcomingEvents: any[],
  currentDate: Date
): { score: number; reasons: ConnectionReason[] } => {
  const reasons: ConnectionReason[] = [];
  const frequency = contact.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY;
  const priorityReasonWeight = FREQUENCY_PRIORITY[frequency];

  reasons.push({
    type: 'cadence_priority',
    description: `Cadence: ${CONTACT_FREQUENCY_CONFIG[frequency].label}`,
    weight: priorityReasonWeight,
  });

  const cadenceResult = computeCadenceScore(frequency, contact.lastContacted ?? undefined, currentDate);
  reasons.push({
    type: 'last_contacted',
    description: cadenceResult.reason,
    weight: Math.max(5, cadenceResult.score - priorityReasonWeight),
  });

  let score = cadenceResult.score + Math.random() * BASE_RANDOMNESS;

  const birthdayBonus = computeBirthdayBonus(contact.birthday);
  if (birthdayBonus && birthdayBonus.diffDays <= 30) {
    const weight = birthdayBonus.diffDays <= 7 ? 50 : 30;
    score += weight;
    reasons.push({
      type: 'upcoming_event',
      description: `Birthday in ${birthdayBonus.diffDays} day${birthdayBonus.diffDays === 1 ? '' : 's'}`,
      weight,
    });
  }

  // Check for events matching this contact
  const friendEvents = upcomingEvents.filter((event: any) =>
    event.title && event.title.toLowerCase().includes(contact.firstName.toLowerCase())
  );

  friendEvents.forEach((event: any) => {
    const eventDate = new Date(event.date);
    const daysUntilEvent = Math.floor((eventDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    if (daysUntilEvent <= 7 && daysUntilEvent >= 0) {
      let eventScore = 0;
      if (event.type === 'birthday') eventScore = 40;
      else if (event.type === 'anniversary') eventScore = 30;
      else if (event.type === 'achievement') eventScore = 25;
      else if (event.type === 'milestone') eventScore = 25;
      else eventScore = 20;

      score += eventScore;
      reasons.push({ 
        type: 'upcoming_event', 
        description: `${event.title} in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`, 
        weight: eventScore 
      });
    }
  });

  return { score, reasons };
};

export const connectionsApi = createApi({
  reducerPath: 'connectionsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['ConnectionSuggestion'],
  endpoints: (builder) => ({
    getConnectionSuggestions: builder.query<ConnectionSuggestion[], { userId: string; limit?: number }>({
      queryFn: async ({ userId, limit = 5 }) => {
        try {
          // Get user's friends
          const { data: friends, error: friendsError } = await supabase
            .from('friendships')
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .eq('user_id', userId)
            .eq('status', 'accepted');

          if (friendsError) throw friendsError;

          // Get upcoming events (next 30 days)
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .lte('date', thirtyDaysFromNow.toISOString());

          if (eventsError) throw eventsError;

          // Calculate suggestions for each friend
          const currentDate = new Date();
          const friendSuggestions: ConnectionSuggestion[] = (friends || []).map(friend => {
            const { score, reasons } = calculateConnectionScore(friend, events || [], currentDate);

            return {
              id: `suggestion_${friend.id}_${Date.now()}`,
              friendId: friend.friendId,
              friend: friend.friend,
              score,
              reasons,
              suggestedAt: currentDate.toISOString(),
              dismissed: false,
            };
          });

          // Load local contacts and create suggestions
          const localContacts: Contact[] = await loadContacts();
          const contactSuggestions: ConnectionSuggestion[] = (localContacts || []).map(contact => {
            const { score, reasons } = calculateContactScore(contact, events || [], currentDate);
            const fakeUser: User = {
              id: contact.id,
              email: '',
              username: (contact.firstName + (contact.lastName ? contact.lastName[0] : '')).toLowerCase(),
              firstName: contact.firstName,
              lastName: contact.lastName || '',
              profileImage: contact.profileImage,
              createdAt: contact.createdAt,
              updatedAt: contact.createdAt,
            };

            return {
              id: `suggestion_contact_${contact.id}_${Date.now()}`,
              friendId: contact.id,
              friend: fakeUser,
              score,
              reasons,
              suggestedAt: currentDate.toISOString(),
              dismissed: false,
            };
          });

          const suggestions = [...friendSuggestions, ...contactSuggestions];

          // Sort by score (highest first) and limit results
          const topSuggestions = suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          return { data: topSuggestions };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['ConnectionSuggestion'],
    }),

    dismissSuggestion: builder.mutation<void, string>({
      queryFn: async (suggestionId) => {
        // In a real app, you might want to store dismissed suggestions
        // For now, we'll just invalidate the cache
        return { data: undefined };
      },
      invalidatesTags: ['ConnectionSuggestion'],
    }),
  }),
});

export const {
  useGetConnectionSuggestionsQuery,
  useDismissSuggestionMutation,
} = connectionsApi;
