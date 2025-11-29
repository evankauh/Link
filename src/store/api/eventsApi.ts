// src/store/api/eventsApi.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { supabase } from '../../services/supabase/client';
import type { Event } from '../../types';
import {
  loadEvents as loadLocalEvents,
  addEvent as addLocalEvent,
  updateEvent as updateLocalEvent,
  removeEvent as removeLocalEvent,
  saveEvents as saveLocalEvents,
} from '../../utils/eventsStorage';

const normalizeEventRecord = (record: any): Event => ({
  id: record.id,
  title: record.title,
  description: record.description ?? undefined,
  date: record.date ?? record.event_date ?? new Date().toISOString(),
  type: record.type,
  userId: record.user_id ?? record.userId,
  contactId: record.contact_id ?? record.contactId ?? null,
  friendId: record.friend_id ?? record.friendId ?? null,
  friendshipId: record.friendship_id ?? record.friendshipId ?? null,
  isRecurring: record.is_recurring ?? record.isRecurring ?? false,
  reminderEnabled: record.reminder_enabled ?? record.reminderEnabled ?? false,
});

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Event'],
  endpoints: builder => ({
    getEvents: builder.query<Event[], { userId: string }>({
      queryFn: async ({ userId }) => {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });

          if (error) throw error;

          const normalized = (data || []).map(normalizeEventRecord);
          await saveLocalEvents(userId, normalized);
          return { data: normalized };
        } catch (error) {
          console.warn('Falling back to local events store', error);
          const local = await loadLocalEvents(userId);
          return { data: local };
        }
      },
      providesTags: result =>
        result
          ? [...result.map(({ id }) => ({ type: 'Event' as const, id })), { type: 'Event' as const, id: 'LIST' }]
          : [{ type: 'Event' as const, id: 'LIST' }],
    }),

    createEvent: builder.mutation<Event, Partial<Event>>({
      queryFn: async (payload) => {
        try {
          const insertPayload = {
            title: payload.title,
            description: payload.description ?? null,
            date: payload.date,
            type: payload.type,
            user_id: payload.userId,
            contact_id: payload.contactId ?? null,
            friend_id: payload.friendId ?? null,
            friendship_id: payload.friendshipId ?? null,
            is_recurring: payload.isRecurring ?? false,
            reminder_enabled: payload.reminderEnabled ?? false,
          };

          const { data, error } = await supabase
            .from('events')
            .insert(insertPayload)
            .select('*')
            .single();

          if (error) throw error;

          const normalized = normalizeEventRecord(data);
          await addLocalEvent(normalized.userId, normalized);
          return { data: normalized };
        } catch (error) {
          console.warn('Supabase createEvent failed, falling back to local store', error);
          if (!payload.userId || !payload.date || !payload.title || !payload.type) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Missing required event fields.' } } as const;
          }
          const fallback: Event = {
            id: '',
            title: payload.title,
            description: payload.description ?? undefined,
            date: payload.date,
            type: payload.type,
            userId: payload.userId,
            contactId: payload.contactId ?? null,
            friendId: payload.friendId ?? null,
            friendshipId: payload.friendshipId ?? null,
            isRecurring: payload.isRecurring ?? false,
            reminderEnabled: payload.reminderEnabled ?? false,
          };
          const stored = await addLocalEvent(payload.userId, fallback);
          return { data: stored };
        }
      },
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),

    updateEvent: builder.mutation<Event, { id: string; userId: string; changes: Partial<Event> }>({
      queryFn: async ({ id, userId, changes }) => {
        try {
          const updatePayload = {
            title: changes.title,
            description: changes.description ?? null,
            date: changes.date,
            type: changes.type,
            contact_id: changes.contactId ?? null,
            friend_id: changes.friendId ?? null,
            friendship_id: changes.friendshipId ?? null,
            is_recurring: changes.isRecurring ?? false,
            reminder_enabled: changes.reminderEnabled ?? false,
          };

          const { data, error } = await supabase
            .from('events')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();

          if (error) throw error;

          const normalized = normalizeEventRecord(data);
          await updateLocalEvent(normalized.userId, normalized.id, normalized);
          return { data: normalized };
        } catch (error) {
          console.warn('Supabase updateEvent failed, falling back to local store', error);
          const updated = await updateLocalEvent(userId, id, changes as Event);
          if (!updated) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Event not found locally.' } } as const;
          }
          return { data: updated };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.id }],
    }),

    deleteEvent: builder.mutation<{ success: true }, { id: string; userId: string }>({
      queryFn: async ({ id, userId }) => {
        try {
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await removeLocalEvent(userId, id);
          return { data: { success: true } };
        } catch (error) {
          console.warn('Supabase deleteEvent failed, falling back to local store', error);
          await removeLocalEvent(userId, id);
          return { data: { success: true } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.id }, { type: 'Event', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;
