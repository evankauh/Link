import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase/client';
import type { Friend, User, ApiResponse, PaginatedResponse } from '../../types';

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
          
          return { data: data || [] };
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

    addFriend: builder.mutation<Friend, { userId: string; friendId: string; tier?: string }>({
      queryFn: async ({ userId, friendId, tier = 'good_friend' }) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .insert({
              user_id: userId,
              friend_id: friendId,
              status: 'pending',
              friendship_tier: tier as any,
            })
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          
          return { data };
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
          
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Friend'],
    }),

    updateFriendshipTier: builder.mutation<Friend, { friendshipId: string; tier: string }>({
      queryFn: async ({ friendshipId, tier }) => {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .update({ friendship_tier: tier as any })
            .eq('id', friendshipId)
            .select(`
              *,
              friend:users!friendships_friend_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          
          return { data };
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
          
          return { data };
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
  useUpdateFriendshipTierMutation,
  useUpdateLastContactedMutation,
} = friendsApi;