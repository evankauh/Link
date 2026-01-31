import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, radius, spacing, typography, shadow } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * (16 / 11);

interface FriendCardProps {
  name: string;
  imageUri?: string;
  location?: string;
  lastContactedText?: string;
  cadenceLabel?: string;
  onPress?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onSnooze?: () => void;
  onContactedRecently?: () => void;
}

export default function FriendCard({
  name,
  imageUri,
  location,
  lastContactedText,
  cadenceLabel,
  onPress,
  onCall,
  onMessage,
  onSnooze,
  onContactedRecently,
}: FriendCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        style={styles.card}
      >
        {/* Background Image */}
        <Image
          source={{
            uri: imageUri || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />


        {/* Cadence Badge */}
        {cadenceLabel && (
          <View style={styles.cadenceBadge}>
            <Text style={styles.cadenceText}>{cadenceLabel}</Text>
          </View>
        )}

        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {location && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.textLight} />
                <Text style={styles.location}>{location}</Text>
              </View>
            )}
            {lastContactedText && (
              <Text style={styles.lastContacted}>
                Last connected {lastContactedText}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={onCall}
              activeOpacity={0.8}
              style={styles.actionButton}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="call" size={20} color={colors.textLight} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onMessage}
              activeOpacity={0.8}
              style={styles.actionButton}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="chatbubble" size={20} color={colors.textLight} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSnooze}
              activeOpacity={0.8}
              style={styles.actionButton}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="shuffle" size={20} color={colors.textLight} />
              </View>
            </TouchableOpacity>

            {onContactedRecently && (
              <TouchableOpacity
                onPress={onContactedRecently}
                activeOpacity={0.8}
                style={styles.actionButton}
              >
                <View style={[styles.actionCircle]}>
                  <Ionicons name="checkmark" size={20} color={colors.textLight} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    ...shadow.float,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cadenceBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cadenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  lastContacted: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    // No extra styling needed - minimal design
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  actionCircleSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
});
