import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import FriendsListScreen from '../screens/friends/FriendsListScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';

import type { FriendsStackParamList } from '../types';
import { colors } from '../styles/theme';

const Stack = createStackNavigator<FriendsStackParamList>();

export default function FriendsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.textPrimary,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriendScreen}
        options={({ navigation }) => ({
          headerTitle: 'Add Contact',
          headerShown: false,
        })}
      />
      <Stack.Screen 
        name="FriendProfile" 
        component={FriendProfileScreen}
        options={({ navigation }) => ({
          headerTitle: 'Edit Contact',
          animation: 'slide_from_right',
          presentation: 'card',
          headerLeft: ({ canGoBack }) => (
            canGoBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingHorizontal: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Back to friends list"
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null
          ),
        })}
      />
    </Stack.Navigator>
  );
}
