// User and Profile Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  friendshipTier: FriendshipTier;
  lastContacted?: string;
  createdAt: string;
  updatedAt: string;
  friend: User;
}

export type FriendshipTier = 'best_friend' | 'close_friend' | 'good_friend' | 'acquaintance';

// Events and Milestones
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: EventType;
  userId: string;
  isRecurring?: boolean;
  reminderEnabled?: boolean;
}

export type EventType = 'birthday' | 'anniversary' | 'achievement' | 'milestone' | 'holiday' | 'custom';

// Connection Suggestions
export interface ConnectionSuggestion {
  id: string;
  friendId: string;
  friend: User;
  score: number;
  reasons: ConnectionReason[];
  suggestedAt: string;
  dismissed?: boolean;
}

export interface ConnectionReason {
  type: 'upcoming_event' | 'last_contacted' | 'life_change' | 'tier_priority' | 'random';
  description: string;
  weight: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Friends: undefined;
  Events: undefined;
  Settings: undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendProfile: { friendId: string };
};