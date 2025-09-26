// src/screens/friends/FriendProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { FriendsStackParamList } from '../../types';

type FriendProfileRouteProp = RouteProp<FriendsStackParamList, 'FriendProfile'>;

export default function FriendProfileScreen() {
  const route = useRoute<FriendProfileRouteProp>();
  const { friendId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Friend Profile</Text>
        <Text style={styles.subtitle}>Friend ID: {friendId}</Text>
        <Text style={styles.description}>
          Individual friend profiles with interaction history, shared events, and communication options
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});