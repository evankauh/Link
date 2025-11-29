// User and Profile Types
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  birthday?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  contactFrequency: ContactFrequency;
  birthday?: string | null;
  lastContacted?: string;
  lastContactedCount?: string;
  createdAt: string;
  updatedAt: string;
  friend: User;
}

// Local contact stored on-device for suggestion engine and quick creation
export interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  profileImage?: string; // local uri or remote url
  contactFrequency: ContactFrequency;
  birthday?: string | null;
  lastContacted?: string | null; // ISO date string
  lastContactedCount?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type ContactFrequency = 'biweekly' | 'monthly' | 'quarterly' | 'semiannual';

// Events and Milestones
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: EventType;
  userId: string;
  contactId?: string | null;
  friendId?: string | null;
  friendshipId?: string | null;
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
  type: 'upcoming_event' | 'last_contacted' | 'life_change' | 'cadence_priority' | 'random';
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
  FriendProfile: { friendId: string; contactId?: never } | { contactId: string; friendId?: never };
};
