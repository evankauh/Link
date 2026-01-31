import type { ContactFrequency } from '../types';

export const CONTACT_FREQUENCY_CONFIG: Record<ContactFrequency, { label: string; shortLabel: string; days: number; color: string }> = {
  weekly: {
    label: 'Every week',
    shortLabel: 'Weekly',
    days: 7,
    color: '#FF3B30', // Urgent red
  },
  biweekly: {
    label: 'Every 2 weeks',
    shortLabel: 'Biweekly',
    days: 14,
    color: '#E91E63', // Accent magenta
  },
  monthly: {
    label: 'Every month',
    shortLabel: 'Monthly',
    days: 30,
    color: '#9B59B6', // Primary purple
  },
  quarterly: {
    label: 'Every 3 months',
    shortLabel: 'Quarterly',
    days: 90,
    color: '#00BFA6', // Success teal
  },
  biannual: {
    label: 'Every 6 months',
    shortLabel: 'Bi-Annual',
    days: 180,
    color: '#3B82F6', // Blue
  },
  annually: {
    label: 'Every year',
    shortLabel: 'Annually',
    days: 365,
    color: '#64648C', // Muted secondary
  },
};

export const CONTACT_FREQUENCY_ORDER: ContactFrequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annually'];

export const DEFAULT_CONTACT_FREQUENCY: ContactFrequency = 'monthly';

export const getFrequencyLabel = (freq: ContactFrequency) => CONTACT_FREQUENCY_CONFIG[freq].label;
