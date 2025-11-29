import type { ContactFrequency } from '../types';

export const CONTACT_FREQUENCY_CONFIG: Record<ContactFrequency, { label: string; shortLabel: string; days: number; color: string }> = {
  biweekly: {
    label: 'Every 2 weeks',
    shortLabel: '2 wks',
    days: 14,
    color: '#ff4757',
  },
  monthly: {
    label: 'Every month',
    shortLabel: 'Monthly',
    days: 30,
    color: '#ffa502',
  },
  quarterly: {
    label: 'Every 3 months',
    shortLabel: 'Quarterly',
    days: 90,
    color: '#2ed573',
  },
  semiannual: {
    label: 'Every 6 months',
    shortLabel: '6 months',
    days: 180,
    color: '#747d8c',
  },
};

export const CONTACT_FREQUENCY_ORDER: ContactFrequency[] = ['biweekly', 'monthly', 'quarterly', 'semiannual'];

export const DEFAULT_CONTACT_FREQUENCY: ContactFrequency = 'monthly';

export const getFrequencyLabel = (freq: ContactFrequency) => CONTACT_FREQUENCY_CONFIG[freq].label;

