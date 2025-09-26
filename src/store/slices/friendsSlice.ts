// src/store/slices/friendsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Friend } from '../../types';

interface FriendsState {
  friends: Friend[];
  pendingRequests: Friend[];
  isLoading: boolean;
}

const initialState: FriendsState = {
  friends: [],
  pendingRequests: [],
  isLoading: false,
};

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setFriends: (state, action: PayloadAction<Friend[]>) => {
      state.friends = action.payload;
    },
    addFriend: (state, action: PayloadAction<Friend>) => {
      state.friends.push(action.payload);
    },
    updateFriend: (state, action: PayloadAction<Friend>) => {
      const index = state.friends.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.friends[index] = action.payload;
      }
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(f => f.id !== action.payload);
    },
    setPendingRequests: (state, action: PayloadAction<Friend[]>) => {
      state.pendingRequests = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setFriends, 
  addFriend, 
  updateFriend, 
  removeFriend, 
  setPendingRequests, 
  setLoading: setFriendsLoading 
} = friendsSlice.actions;
export default friendsSlice.reducer;

