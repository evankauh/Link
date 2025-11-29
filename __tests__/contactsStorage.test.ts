import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadContacts, saveContacts, addContact, removeContact, updateContact } from '../src/utils/contactsStorage';
import type { Contact } from '../src/types';
import { DEFAULT_CONTACT_FREQUENCY } from '../src/constants/contactFrequency';

jest.mock('@react-native-async-storage/async-storage');

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('contactsStorage', () => {
  beforeEach(() => {
    mockedStorage.getItem.mockReset();
    mockedStorage.setItem.mockReset();
  });

  it('loads empty array when no data', async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);
    const items = await loadContacts();
    expect(items).toEqual([]);
    expect(mockedStorage.getItem).toHaveBeenCalled();
  });

  it('saves and loads contacts', async () => {
    const contacts: Contact[] = [
      { id: '1', firstName: 'Alice', createdAt: new Date().toISOString(), contactFrequency: DEFAULT_CONTACT_FREQUENCY },
    ];

    await saveContacts(contacts);
    expect(mockedStorage.setItem).toHaveBeenCalled();

    mockedStorage.getItem.mockResolvedValueOnce(JSON.stringify(contacts));
    const loaded = await loadContacts();
    expect(loaded).toEqual(contacts);
  });

  it('addContact prepends and persists', async () => {
    const existing: Contact[] = [
      { id: 'a', firstName: 'Bob', createdAt: new Date().toISOString(), contactFrequency: 'semiannual' },
    ];
    mockedStorage.getItem.mockResolvedValueOnce(JSON.stringify(existing));

    const newContact: Contact = { id: 'b', firstName: 'Carol', createdAt: new Date().toISOString(), contactFrequency: 'biweekly' };
    await addContact(newContact);

    // after loading existing and saving updated list
    expect(mockedStorage.getItem).toHaveBeenCalled();
    expect(mockedStorage.setItem).toHaveBeenCalled();
    const savedArg = mockedStorage.setItem.mock.calls[0][1];
    const parsed = JSON.parse(savedArg) as Contact[];
    expect(parsed[0].id).toBe('b');
  });

  it('removeContact filters and saves', async () => {
    const contacts: Contact[] = [
      { id: '1', firstName: 'A', createdAt: new Date().toISOString(), contactFrequency: 'monthly' },
      { id: '2', firstName: 'B', createdAt: new Date().toISOString(), contactFrequency: 'monthly' },
    ];
    mockedStorage.getItem.mockResolvedValueOnce(JSON.stringify(contacts));
    await removeContact('1');
    expect(mockedStorage.setItem).toHaveBeenCalled();
    const saved = JSON.parse(mockedStorage.setItem.mock.calls[0][1]);
    expect(saved.find((c: Contact) => c.id === '1')).toBeUndefined();
  });

  it('updateContact replaces existing contact', async () => {
    const contacts: Contact[] = [
      { id: '1', firstName: 'A', createdAt: new Date().toISOString(), contactFrequency: 'monthly' },
    ];
    mockedStorage.getItem.mockResolvedValueOnce(JSON.stringify(contacts));
    const updated: Contact = { ...contacts[0], firstName: 'Updated' };
    await updateContact(updated);
    expect(mockedStorage.setItem).toHaveBeenCalled();
    const saved = JSON.parse(mockedStorage.setItem.mock.calls[0][1]);
    expect(saved.find((c: Contact) => c.id === '1').firstName).toBe('Updated');
  });
});
