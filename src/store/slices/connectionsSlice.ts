// src/store/slices/connectionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionSuggestion } from '../../types';

interface ConnectionsState {
  suggestions: ConnectionSuggestion[];
  dismissedSuggestions: string[];
  isLoading: boolean;
  lastUpdated: string | null;
}

const initialState: ConnectionsState = {
  suggestions: [],
  dismissedSuggestions: [],
  isLoading: false,
  lastUpdated: null,
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setSuggestions: (state, action: PayloadAction<ConnectionSuggestion[]>) => {
      state.suggestions = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    dismissSuggestion: (state, action: PayloadAction<string>) => {
      state.dismissedSuggestions.push(action.payload);
      state.suggestions = state.suggestions.filter(s => s.id !== action.payload);
    },
    clearDismissedSuggestions: (state) => {
      state.dismissedSuggestions = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setSuggestions, 
  dismissSuggestion, 
  clearDismissedSuggestions, 
  setLoading: setConnectionsLoading 
} = connectionsSlice.actions;
export default connectionsSlice.reducer;