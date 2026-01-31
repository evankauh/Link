import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, radius, spacing, typography, shadow } from '../styles/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: GradientButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      iconSize: 16,
      textStyle: { fontSize: 14, fontWeight: '600' as const },
    },
    md: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      iconSize: 18,
      textStyle: typography.buttonPrimary,
    },
    lg: {
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.lg,
      iconSize: 20,
      textStyle: typography.buttonLarge,
    },
  };

  const currentSize = sizeStyles[size];
  const isOutline = variant === 'outline';

  if (isOutline) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={[
            styles.outlineButton,
            {
              paddingHorizontal: currentSize.paddingHorizontal,
              paddingVertical: currentSize.paddingVertical,
              opacity: disabled ? 0.5 : 1,
            },
            fullWidth && styles.fullWidth,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons
                  name={icon}
                  size={currentSize.iconSize}
                  color={colors.primary}
                  style={styles.iconLeft}
                />
              )}
              <Text style={[currentSize.textStyle, styles.outlineText]}>{title}</Text>
              {icon && iconPosition === 'right' && (
                <Ionicons
                  name={icon}
                  size={currentSize.iconSize}
                  color={colors.primary}
                  style={styles.iconRight}
                />
              )}
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const gradientColors = variant === 'accent' ? gradients.accent : gradients.primary;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.buttonWrapper,
          disabled && { opacity: 0.5 },
        ]}
      >
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingHorizontal: currentSize.paddingHorizontal,
              paddingVertical: currentSize.paddingVertical,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons
                  name={icon}
                  size={currentSize.iconSize}
                  color={colors.textLight}
                  style={styles.iconLeft}
                />
              )}
              <Text style={[currentSize.textStyle, styles.text]}>{title}</Text>
              {icon && iconPosition === 'right' && (
                <Ionicons
                  name={icon}
                  size={currentSize.iconSize}
                  color={colors.textLight}
                  style={styles.iconRight}
                />
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
  text: {
    color: colors.textLight,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: colors.primary,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
