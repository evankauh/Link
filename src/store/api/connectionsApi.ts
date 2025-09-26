import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../services/supabase/client';
import type { ConnectionSuggestion, ConnectionReason, Friend, FriendshipTier } from '../../types';

// Connection suggestion algorithm implementation
const calculateConnectionScore = (
  friend: Friend,
  upcomingEvents: any[],
  currentDate: Date
): { score: number; reasons: ConnectionReason[] } => {
  let score = 0;
  const reasons: ConnectionReason[] = [];
  
  // Base score by friendship tier
  const tierScores: Record<FriendshipTier, number> = {
    'best_friend': 40,
    'close_friend': 30,
    'good_friend': 20,
    'acquaintance': 10,
  };
  
  const tierScore = tierScores[friend.friendshipTier];
  score += tierScore;
  reasons.push({
    type: 'tier_priority',
    description: `${friend.friendshipTier.replace('_', ' ')} priority`,
    weight: tierScore,
  });

  // Last contacted scoring
  if (friend.lastContacted) {
    const lastContactedDate = new Date(friend.lastContacted);
    const daysSinceContact = Math.floor(
      (currentDate.getTime() - lastContactedDate.getTime()) / (1000 * 3600 * 24)
    );
    
    let contactScore = 0;
    if (daysSinceContact > 30) contactScore = 30;
    else if (daysSinceContact > 14) contactScore = 20;
    else if (daysSinceContact > 7) contactScore = 10;
    
    if (contactScore > 0) {
      score += contactScore;
      reasons.push({
        type: 'last_contacted',
        description: `Haven't connected in ${daysSinceContact} days`,
        weight: contactScore,
      });
    }
  } else {
    // Never contacted gets high priority
    score += 25;
    reasons.push({
      type: 'last_contacted',
      description: 'Haven\'t connected yet',
      weight: 25,
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
      if (event.type === 'birthday') eventScore = 35;
      else if (event.type === 'anniversary') eventScore = 25;
      else if (event.type === 'achievement') eventScore = 20;
      else if (event.type === 'milestone') eventScore = 20;
      else eventScore = 15;
      
      score += eventScore;
      reasons.push({
        type: 'upcoming_event',
        description: `${event.title} in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`,
        weight: eventScore,
      });
    }
  });

  // Add slight randomization (5-15 points) for balanced suggestions
  const randomBonus = Math.floor(Math.random() * 10) + 5;
  score += randomBonus;
  reasons.push({
    type: 'random',
    description: 'Balanced suggestion variety',
    weight: randomBonus,
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
          const suggestions: ConnectionSuggestion[] = (friends || []).map(friend => {
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