import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { friendsApi } from './api/friendsApi';
import { connectionsApi } from './api/connectionsApi';
import friendsReducer from './slices/friendsSlice';
import connectionsReducer from './slices/connectionsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendsReducer,
    connections: connectionsReducer,
    [friendsApi.reducerPath]: friendsApi.reducer,
    [connectionsApi.reducerPath]: connectionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }).concat(
      friendsApi.middleware,
      connectionsApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;