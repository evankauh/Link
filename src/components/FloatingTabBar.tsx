import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, gradients, radius, spacing, shadow } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 68;

interface TabButtonProps {
  isFocused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  onLongPress: () => void;
  isCenter?: boolean;
}

function TabButton({
  isFocused,
  iconName,
  iconNameOutline,
  onPress,
  onLongPress,
  isCenter = false,
}: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Center button (Home) - always shows gradient style
  if (isCenter) {
    return (
      <Animated.View style={[styles.centerButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerButton}
          >
            <Ionicons name={isFocused ? iconName : iconNameOutline} size={26} color={colors.textLight} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.tabButton, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={styles.tabButtonInner}
      >
        {isFocused ? (
          <View style={styles.activeTabBackground}>
            <LinearGradient
              colors={[colors.primarySoft, colors.accentSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeTabGradient}
            />
            <Ionicons name={iconName} size={24} color={colors.primary} />
          </View>
        ) : (
          <Ionicons name={iconNameOutline} size={24} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const getIconNames = (routeName: string): { filled: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap } => {
    switch (routeName) {
      case 'Home':
        return { filled: 'home', outline: 'home-outline' };
      case 'Calendar':
        return { filled: 'calendar', outline: 'calendar-outline' };
      case 'Friends':
        return { filled: 'people', outline: 'people-outline' };
      case 'Events':
        return { filled: 'sunny', outline: 'sunny-outline' };
      case 'Settings':
        return { filled: 'settings', outline: 'settings-outline' };
      default:
        return { filled: 'home', outline: 'home-outline' };
    }
  };

  // Tab order: Friends, Calendar, Home (center), Events, Settings
  // The state.routes already has them in this order from MainNavigator
  return (
    <View style={styles.container}>
      <BlurView intensity={85} tint="light" style={styles.blurContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const { filled, outline } = getIconNames(route.name);
            
            // Home is at index 2 (center)
            const isCenter = route.name === 'Home';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabButton
                key={route.key}
                isFocused={isFocused}
                iconName={filled}
                iconNameOutline={outline}
                onPress={onPress}
                onLongPress={onLongPress}
                isCenter={isCenter}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: spacing.xxl,
    right: spacing.xxl,
    ...shadow.float,
  },
  blurContainer: {
    borderRadius: radius.xxxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBackground: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  activeTabGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  centerButtonWrapper: {
    marginHorizontal: spacing.xs,
    ...shadow.glow,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
