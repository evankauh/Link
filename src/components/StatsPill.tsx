import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, radius, spacing, typography, shadow } from '../styles/theme';

interface StatsPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  count: number | string;
  label: string;
  variant?: 'default' | 'gradient' | 'accent';
  onPress?: () => void;
  index?: number;
}

export default function StatsPill({
  icon,
  count,
  label,
  variant = 'default',
  onPress,
  index = 0,
}: StatsPillProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const iconColor = variant === 'gradient' ? colors.textLight : 
                    variant === 'accent' ? colors.accent : 
                    colors.primary;

  const textColor = variant === 'gradient' ? colors.textLight : colors.textPrimary;
  const labelColor = variant === 'gradient' ? 'rgba(255,255,255,0.85)' : colors.textSecondary;

  const content = (
    <>
      <View style={[styles.iconContainer, variant === 'default' && styles.iconContainerDefault]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.count, { color: textColor }]}>{count}</Text>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={!onPress}
        >
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillGradient}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={!onPress}
        style={[
          styles.pill,
          variant === 'accent' && styles.pillAccent,
        ]}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    ...shadow.sm,
    minWidth: 100,
  },
  pillAccent: {
    backgroundColor: colors.accentSoft,
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    ...shadow.glow,
    minWidth: 100,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  iconContainerDefault: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
