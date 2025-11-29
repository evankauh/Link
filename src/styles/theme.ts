import { StyleSheet } from 'react-native';

export const colors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceMuted: '#f5f5f5',
  surfaceAlt: '#f2f2f7',
  surfaceBorder: '#e1e5e9',
  placeholder: '#e9ecef',
  primary: '#007AFF',
  primarySoft: '#e8f0fe',
  accent: '#ff4757',
  success: '#2ed573',
  warning: '#ffa502',
  danger: '#ff3b30',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  overlay: 'rgba(0,0,0,0.35)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  screenTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: colors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  buttonPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  buttonSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
} as const;

export const layout = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  surfaceScreen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export const components = {
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + spacing.xxs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceBorder,
  },
} as const;
