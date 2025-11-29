// src/utils/contactsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Contact } from '../types';
import { DEFAULT_CONTACT_FREQUENCY } from '../constants/contactFrequency';

const STORAGE_KEY = '@link:contacts';
// ----- Helpers -----
const sanitizePhone = (raw?: string | null) => {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  const normalized = hasPlus ? `+${digits}` : digits;
  return normalized.length ? normalized : undefined;
};

const daysSince = (iso?: string | null) => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
};

const formatLastContactedCount = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = daysSince(iso);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d} days ago`;
  const months = Math.floor(d / 30);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

const ensureCreatedAt = (c: Contact): Contact =>
  ({ ...c, createdAt: c.createdAt ?? new Date().toISOString() });

const normalizeContact = (c: Contact): Contact => {
  const withCreated = ensureCreatedAt(c);
  const lastContactedCount = formatLastContactedCount(withCreated.lastContacted);
  const phone = sanitizePhone(withCreated.phone);
  return {
    ...withCreated,
    phone,
    lastContactedCount,
    contactFrequency: withCreated.contactFrequency ?? DEFAULT_CONTACT_FREQUENCY,
    birthday: withCreated.birthday ?? null,
  };
};

const sortByName = (a: Contact, b: Contact) => {
  const lnA = (a.lastName || '').toLowerCase();
  const lnB = (b.lastName || '').toLowerCase();
  if (lnA !== lnB) return lnA.localeCompare(lnB);
  const fnA = (a.firstName || '').toLowerCase();
  const fnB = (b.firstName || '').toLowerCase();
  if (fnA !== fnB) return fnA.localeCompare(fnB);
  return (a.id || '').localeCompare(b.id || '');
};

// ----- Core I/O -----
export async function loadContacts(): Promise<Contact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Contact[];

    // Normalize (migration-safe) and keep alphabetized
    const normalized = parsed.map(normalizeContact).sort(sortByName);
    return normalized;
  } catch (error) {
    console.warn('Failed to load contacts', error);
    return [];
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    // Save alphabetized for consistency across the app
    const sorted = [...contacts].sort(sortByName);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.warn('Failed to save contacts', error);
  }
}

export async function addContact(contact: Contact): Promise<void> {
  const contacts = await loadContacts();
  const newContact = normalizeContact(contact);
  // You can unshift or keep list sorted; since we sort on save, either is fine.
  contacts.unshift(newContact);
  await saveContacts(contacts);
}

export async function removeContact(contactId: string): Promise<void> {
  const contacts = await loadContacts();
  const filtered = contacts.filter(c => c.id !== contactId);
  await saveContacts(filtered);
}

export async function updateContact(updated: Contact): Promise<void> {
  const contacts = await loadContacts();
  const idx = contacts.findIndex(c => c.id === updated.id);

  if (idx === -1) {
    // Not found: treat as add (ensure createdAt and derived fields)
    const toAdd = normalizeContact(updated);
    contacts.unshift(toAdd);
    await saveContacts(contacts);
    return;
  }

  const existing = contacts[idx];

  // Preserve createdAt from existing, recompute derived fields, sanitize phone
  const merged: Contact = normalizeContact({
    ...existing,
    ...updated,
    createdAt: existing.createdAt, // never mutate creation time
  });

  contacts[idx] = merged;
  await saveContacts(contacts);
}

export default { loadContacts, saveContacts, addContact, removeContact, updateContact };
