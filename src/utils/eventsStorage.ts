// src/utils/eventsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event } from '../types';

const STORAGE_KEY = '@link:events';

type EventsState = Record<string, Event[]>;

async function readStore(): Promise<EventsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as EventsState;
  } catch (error) {
    console.warn('Failed to read events store', error);
    return {};
  }
}

async function writeStore(state: EventsState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to write events store', error);
  }
}

export async function loadEvents(userId: string): Promise<Event[]> {
  const store = await readStore();
  return store[userId] ?? [];
}

export async function saveEvents(userId: string, events: Event[]): Promise<void> {
  const store = await readStore();
  store[userId] = events;
  await writeStore(store);
}

export async function addEvent(userId: string, event: Event): Promise<Event> {
  const store = await readStore();
  const list = store[userId] ?? [];
  // Generate ID if missing or empty string
  const id =
    event.id && event.id.length > 0
      ? event.id
      : (globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : `evt_${Math.random().toString(36).slice(2, 10)}`);
  const withId: Event = { ...event, id };
  store[userId] = [withId, ...list];
  await writeStore(store);
  return withId;
}

export async function updateEvent(userId: string, eventId: string, changes: Partial<Event>): Promise<Event | null> {
  const store = await readStore();
  const list = store[userId] ?? [];
  const idx = list.findIndex(e => e.id === eventId);
  if (idx === -1) return null;
  const updated: Event = { ...list[idx], ...changes, id: eventId };
  list[idx] = updated;
  store[userId] = list;
  await writeStore(store);
  return updated;
}

export async function removeEvent(userId: string, eventId: string): Promise<void> {
  const store = await readStore();
  const list = store[userId] ?? [];
  store[userId] = list.filter(e => e.id !== eventId);
  await writeStore(store);
}
