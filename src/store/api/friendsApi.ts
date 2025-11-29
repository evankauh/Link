// src/store/api/friendsApi.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase/client';
import type { Friend, User, ApiResponse, PaginatedResponse, ContactFrequency } from '../../types';
import { DEFAULT_CONTACT_FREQUENCY } from '../../constants/contactFrequency';

const normalizeFriendRecord = (record: any): Friend => ({
  id: record.id,
  userId: record.user_id ?? record.userId,
  friendId: record.friend_id ?? record.friendId,
  status: record.status,
  contactFrequency: (record.contact_frequency ?? record.friendship_tier ?? DEFAULT_CONTACT_FREQUENCY) as ContactFrequency,
  birthday: record.birthday ?? record.friend_birthday ?? record.friend?.birthday ?? null,
  lastContacted: record.last_contacted ?? record.lastContacted ?? undefined,
  lastContactedCount: record.last_contacted_count ?? record.lastContactedCount ?? undefined,
  createdAt: record.created_at ?? record.createdAt,
  updatedAt: record.updated_at ?? record.updatedAt,
  friend: record.friend
    ? {
        ...record.friend,
        birthday: record.friend.birthday ?? record.friend_birthday ?? null,
      }
    : record.friend,
});

export const friendsApi = createApi({
  reducerPath: 'friendsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Friend', 'User'],
  endpoints: (builder) => ({
    getFriends: builder.query<Friend[], { userId: string; status?: string }>({
      queryFn: async ({ userId, status = 'accepted' }) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .eq('user_id', userId)
            .eq('status', status);

          if (error) throw error;
          
          const normalized = (data || []).map(normalizeFriendRecord);
          return { data: normalized };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Friend'],
    }),

    searchUsers: builder.query<User[], string>({
      queryFn: async (searchTerm) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(10);

          if (error) throw error;
          
          return { data: data || [] };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['User'],
    }),

    addFriend: builder.mutation<Friend, { userId: string; friendId: string; contactFrequency?: ContactFrequency }>({
      queryFn: async ({ userId, friendId, contactFrequency = DEFAULT_CONTACT_FREQUENCY }) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .insert({
              user_id: userId,
              friend_id: friendId,
              status: 'pending',
              friendship_tier: contactFrequency as any,
            })
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;

          return { data: normalizeFriendRecord(data) };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Friend'],
    }),

    acceptFriendRequest: builder.mutation<Friend, string>({
      queryFn: async (friendshipId) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId)
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          
          return { data: normalizeFriendRecord(data) };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Friend'],
    }),

    updateContactFrequency: builder.mutation<Friend, { friendshipId: string; contactFrequency: ContactFrequency }>({
      queryFn: async ({ friendshipId, contactFrequency }) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .update({ friendship_tier: contactFrequency as any })
            .eq('id', friendshipId)
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          
          return { data: normalizeFriendRecord(data) };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Friend'],
    }),

    updateLastContacted: builder.mutation<Friend, string>({
      queryFn: async (friendshipId) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .update({ last_contacted: new Date().toISOString() })
            .eq('id', friendshipId)
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          
          return { data: normalizeFriendRecord(data) };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Friend'],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useSearchUsersQuery,
  useAddFriendMutation,
  useAcceptFriendRequestMutation,
  useUpdateContactFrequencyMutation,
  useUpdateLastContactedMutation,
} = friendsApi;
