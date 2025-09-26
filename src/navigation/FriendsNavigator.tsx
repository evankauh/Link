import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import FriendsListScreen from '../screens/friends/FriendsListScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';

import type { FriendsStackParamList } from '../types';

const Stack = createStackNavigator<FriendsStackParamList>();

export default function FriendsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTintColor: '#007AFF',
      }}
    >
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen}
        options={{ title: 'Friends' }}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriendScreen}
        options={{ title: 'Add Friend' }}
      />
      <Stack.Screen 
        name="FriendProfile" 
        component={FriendProfileScreen}
        options={{ title: 'Friend Profile' }}
      />
    </Stack.Navigator>
  );
}