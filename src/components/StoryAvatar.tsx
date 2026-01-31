import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, radius, spacing, typography, avatarSizes } from '../styles/theme';

interface StoryAvatarProps {
  imageUri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isUrgent?: boolean;
  isAddButton?: boolean;
  showName?: boolean;
  onPress?: () => void;
  ringWidth?: number;
}

export default function StoryAvatar({
  imageUri,
  name,
  size = 'md',
  isUrgent = false,
  isAddButton = false,
  showName = true,
  onPress,
  ringWidth = 3,
}: StoryAvatarProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for urgent contacts
  useEffect(() => {
    if (isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isUrgent, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const sizeMap = {
    sm: avatarSizes.sm,
    md: avatarSizes.md,
    lg: avatarSizes.story,
    xl: avatarSizes.xl,
  };

  const avatarSize = sizeMap[size];
  const outerSize = avatarSize + ringWidth * 2 + 4;
  const ringColors = isUrgent ? gradients.storyRingUrgent : gradients.storyRing;

  if (isAddButton) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.addButtonWrapper}
      >
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.addButton,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Ionicons name="add" size={avatarSize * 0.5} color={colors.textLight} />
        </LinearGradient>
        {showName && <Text style={styles.nameText}>Add</Text>}
      </TouchableOpacity>
    );
  }

  const combinedScale = Animated.multiply(scaleAnim, pulseAnim);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: combinedScale }] }}>
        <LinearGradient
          colors={[...ringColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientRing,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.innerRing,
              {
                width: outerSize - ringWidth * 2,
                height: outerSize - ringWidth * 2,
                borderRadius: (outerSize - ringWidth * 2) / 2,
              },
            ]}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.avatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.placeholder,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={avatarSize * 0.5}
                  color={colors.textMuted}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
      {showName && (
        <Text style={styles.nameText} numberOfLines={1}>
          {name.split(' ')[0]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  gradientRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: colors.placeholder,
  },
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    marginTop: spacing.xs,
    ...typography.captionSmall,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 70,
  },
  addButtonWrapper: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
