import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table schemas for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          profile_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          profile_image?: string | null;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          friendship_tier: 'best_friend' | 'close_friend' | 'good_friend' | 'acquaintance';
          last_contacted: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          friendship_tier?: 'best_friend' | 'close_friend' | 'good_friend' | 'acquaintance';
          last_contacted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          friendship_tier?: 'best_friend' | 'close_friend' | 'good_friend' | 'acquaintance';
          last_contacted?: string | null;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          date: string;
          type: 'birthday' | 'anniversary' | 'achievement' | 'milestone' | 'holiday' | 'custom';
          user_id: string;
          is_recurring: boolean;
          reminder_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          date: string;
          type: 'birthday' | 'anniversary' | 'achievement' | 'milestone' | 'holiday' | 'custom';
          user_id: string;
          is_recurring?: boolean;
          reminder_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          type?: 'birthday' | 'anniversary' | 'achievement' | 'milestone' | 'holiday' | 'custom';
          is_recurring?: boolean;
          reminder_enabled?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}