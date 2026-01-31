// src/screens/settings/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  shadow,
} from '../../styles/theme';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function SettingsItem({ icon, title, subtitle, onPress, showArrow = true, rightElement }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd] as const}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFILE</Text>
            <View style={styles.sectionCard}>
              <SettingsItem
                icon="person-outline"
                title="Edit Profile"
                subtitle="Update your personal information"
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="image-outline"
                title="Profile Photo"
                subtitle="Change your profile picture"
              />
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            <View style={styles.sectionCard}>
              <SettingsItem
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Get reminded to connect"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.surfaceBorder, true: colors.primaryLight }}
                    thumbColor={colors.surface}
                  />
                }
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="time-outline"
                title="Reminder Time"
                subtitle="Coming soon"
              />
            </View>
          </View>

          {/* TODO: Appearance Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>APPEARANCE</Text>
            <View style={styles.sectionCard}>
              <SettingsItem
                icon="moon-outline"
                title="Dark Mode"
                subtitle="Coming soon"
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="color-palette-outline"
                title="Theme"
                subtitle="Purple & Magenta"
              />
            </View>
          </View> */}

          {/* TODO: Data Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA</Text>
            <View style={styles.sectionCard}>
              <SettingsItem
                icon="cloud-upload-outline"
                title="Backup Contacts"
                subtitle="Sync to cloud"
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="download-outline"
                title="Export Data"
                subtitle="Download your contacts"
              />
            </View>
          </View> */}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <View style={styles.sectionCard}>
              <SettingsItem
                icon="information-circle-outline"
                title="About Link"
                subtitle="Version 1.0.0"
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="document-text-outline"
                title="Privacy Policy"
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="shield-checkmark-outline"
                title="Terms of Service"
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Stay connected with the people who matter</Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  
  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerTitle: {
    ...typography.screenTitle,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
  },

  // Section
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.labelUppercase,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },

  // Settings item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    ...typography.label,
    marginBottom: spacing.xxs,
  },
  settingsItemSubtitle: {
    ...typography.caption,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginLeft: spacing.lg + 40 + spacing.md,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  logoGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
  },

  bottomPadding: {
    height: 100,
  },
});
