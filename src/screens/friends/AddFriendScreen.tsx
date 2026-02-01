// src/screens/friends/AddFriendScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useSearchUsersQuery, useAddFriendMutation } from '../../store/api/friendsApi';
import type { User, Contact, ContactFrequency } from '../../types';
import {
  CONTACT_FREQUENCY_CONFIG,
  CONTACT_FREQUENCY_ORDER,
  DEFAULT_CONTACT_FREQUENCY,
} from '../../constants/contactFrequency';
import {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  shadow,
} from '../../styles/theme';
import { GradientButton } from '../../components';
import { addContact } from '../../utils/contactsStorage';

const MOCK_USER_ID = 'user-1';

type AddMode = 'search' | 'manual';

const FREQUENCY_OPTIONS = CONTACT_FREQUENCY_ORDER.map(value => ({
  value,
  label: CONTACT_FREQUENCY_CONFIG[value].label,
  shortLabel: CONTACT_FREQUENCY_CONFIG[value].shortLabel,
  color: CONTACT_FREQUENCY_CONFIG[value].color,
}));

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (text: string): string => {
  // Remove all non-digits
  const digits = text.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

// Format date for display
const formatBirthdayDisplay = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Convert Date to YYYY-MM-DD for storage
const dateToISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddFriendScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<AddMode>('manual');
  
  // Search mode state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Manual mode state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [selectedFrequency, setSelectedFrequency] = useState<ContactFrequency>(DEFAULT_CONTACT_FREQUENCY);
  const [isSaving, setIsSaving] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  
  const {
    data: searchResults = [],
    isLoading: isSearching,
    isFetching
  } = useSearchUsersQuery(searchTerm, {
    skip: searchTerm.length < 2,
  });
  
  const [addFriend, { isLoading: isAdding }] = useAddFriendMutation();

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const handleBirthdayChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowBirthdayPicker(false);
    }
    if (date) {
      setBirthday(date);
    }
  }, []);

  const handleAddFriend = async (user: User) => {
    try {
      await addFriend({
        userId: MOCK_USER_ID,
        friendId: user.id,
        contactFrequency: selectedFrequency,
      }).unwrap();
      
      Alert.alert(
        'Friend Request Sent!',
        `You've sent a friend request to ${user.firstName} ${user.lastName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send friend request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Allow photo access to set a profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveManualContact = async () => {
    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'Please enter a first name.');
      return;
    }

    if (!profileImage) {
      Alert.alert('Required Field', 'Please add a profile photo.');
      return;
    }

    // Validate phone (required, must be complete)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      Alert.alert('Required Field', 'Please enter a complete 10-digit phone number.');
      return;
    }

    // Convert birthday to ISO format if provided
    const normalizedBirthday: string | null = birthday ? dateToISOString(birthday) : null;

    setIsSaving(true);
    try {
      const newContact: Contact = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        birthday: normalizedBirthday,
        notes: notes.trim() || null,
        profileImage,
        contactFrequency: selectedFrequency,
        createdAt: new Date().toISOString(),
      };

      await addContact(newContact);
      
      Alert.alert(
        'Contact Saved!',
        `${firstName} ${lastName}`.trim() + ' has been added to your contacts.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedFrequencyOption = FREQUENCY_OPTIONS.find(opt => opt.value === selectedFrequency);

  const renderUser = ({ item: user }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <View style={styles.avatarInner}>
            <Image 
              source={{ uri: user.profileImage || 'https://via.placeholder.com/50' }}
              style={styles.profileImageSmall}
            />
          </View>
        </LinearGradient>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.addUserButton}
        onPress={() => handleAddFriend(user)}
        disabled={isAdding}
      >
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addUserButtonGradient}
        >
          <Ionicons name="person-add" size={18} color={colors.textLight} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFrequencyPicker = () => (
    <Modal
      visible={showFrequencyPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFrequencyPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>How often to connect?</Text>
            <TouchableOpacity onPress={() => setShowFrequencyPicker(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.pickerOptions} showsVerticalScrollIndicator={false}>
            {FREQUENCY_OPTIONS.map((option) => {
              const isSelected = selectedFrequency === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    isSelected && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFrequency(option.value);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <View style={[styles.frequencyDot, { backgroundColor: option.color }]} />
                  <View style={styles.pickerOptionText}>
                    <Text style={[
                      styles.pickerOptionLabel,
                      isSelected && styles.pickerOptionLabelSelected,
                    ]}>
                      {option.shortLabel}
                    </Text>
                    <Text style={styles.pickerOptionDescription}>
                      {option.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
        onPress={() => setMode('manual')}
      >
        <Ionicons 
          name="create-outline" 
          size={18} 
          color={mode === 'manual' ? colors.textLight : colors.textSecondary} 
        />
        <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
          Manual Entry
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'search' && styles.modeButtonActive]}
        onPress={() => setMode('search')}
      >
        <Ionicons 
          name="search-outline" 
          size={18} 
          color={mode === 'search' ? colors.textLight : colors.textSecondary} 
        />
        <Text style={[styles.modeButtonText, mode === 'search' && styles.modeButtonTextActive]}>
          Find User
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderManualForm = () => (
    <ScrollView 
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        {/* Profile Image Picker - Required */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImageLarge} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
              <Text style={styles.imagePickerText}>Add Photo *</Text>
            </View>
          )}
          <View style={styles.imagePickerBadge}>
            <Ionicons name="add" size={16} color={colors.textLight} />
          </View>
        </TouchableOpacity>

        {/* Name Fields */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Phone - Required */}
        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="(555) 123-4567"
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          keyboardType="number-pad"
          maxLength={14} // (XXX) XXX-XXXX = 14 chars
        />

        {/* Birthday */}
        <Text style={styles.fieldLabel}>Birthday</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowBirthdayPicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={birthday ? styles.datePickerText : styles.datePickerPlaceholder}>
            {birthday ? formatBirthdayDisplay(birthday) : 'Select birthday'}
          </Text>
        </TouchableOpacity>
        {showBirthdayPicker && (
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Birthday</Text>
              <TouchableOpacity 
                onPress={() => setShowBirthdayPicker(false)}
                style={styles.datePickerDone}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={birthday || new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              onChange={handleBirthdayChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              style={styles.datePicker}
            />
          </View>
        )}

        {/* Contact Frequency Dropdown */}
        <Text style={styles.fieldLabel}>How often to connect? *</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowFrequencyPicker(true)}
        >
          <View style={styles.dropdownContent}>
            <View style={[styles.frequencyDot, { backgroundColor: selectedFrequencyOption?.color }]} />
            <Text style={styles.dropdownText}>
              {selectedFrequencyOption?.shortLabel} - {selectedFrequencyOption?.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Notes */}
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="How do you know this person? Any important details..."
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, styles.notesInput]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <GradientButton
            title={isSaving ? "Saving..." : "Save Contact"}
            icon="checkmark"
            onPress={handleSaveManualContact}
            disabled={isSaving || !firstName.trim() || !profileImage || phone.replace(/\D/g, '').length !== 10}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSearchMode = () => (
    <View style={styles.searchModeContainer}>
      {/* Search Input */}
      <View style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      <View style={styles.resultsSection}>
        {searchTerm.length < 2 ? (
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsIconContainer}>
              <LinearGradient
                colors={[...gradients.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.instructionsIconGradient}
              >
                <Ionicons name="search" size={40} color={colors.textLight} />
              </LinearGradient>
            </View>
            <Text style={styles.instructionsTitle}>Find App Users</Text>
            <Text style={styles.instructionsText}>
              Search for friends who already use Link
            </Text>
          </View>
        ) : isSearching || isFetching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyResults}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="person-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyResultsText}>No users found</Text>
            <Text style={styles.emptyResultsSubtext}>
              Try a different search or add them manually
            </Text>
            <TouchableOpacity 
              style={styles.switchToManualButton}
              onPress={() => setMode('manual')}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.switchToManualText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUser}
            keyExtractor={(user) => user.id}
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd] as const}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.headerTitles}>
                <Text style={styles.headerTitle}>Add Contact</Text>
                <Text style={styles.headerSubtitle}>
                  {mode === 'manual' ? 'Enter contact details' : 'Find friends on Link'}
                </Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
            
            {/* Mode Toggle */}
            {renderModeToggle()}
          </View>

          {/* Content based on mode */}
          {mode === 'manual' ? renderManualForm() : renderSearchMode()}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Frequency Picker Modal */}
      {renderFrequencyPicker()}
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
  content: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadow.sm,
  },
  headerTitles: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    ...typography.screenTitle,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xs,
    ...shadow.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.textLight,
  },

  // Manual Form
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginTop: spacing.md,
    ...shadow.card,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePickerPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.accent,
    fontWeight: '600',
  },
  imagePickerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: spacing.md,
  },

  // Date picker styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
  },
  datePickerTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  datePickerDone: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  datePickerDoneText: {
    ...typography.label,
    color: colors.primary,
  },
  datePicker: {
    height: 200,
    backgroundColor: colors.surface,
  },
  
  // Dropdown
  dropdownButton: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  frequencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  
  saveButtonContainer: {
    marginTop: spacing.xxl,
  },

  // Modal Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  pickerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  pickerOptions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  pickerOptionText: {
    flex: 1,
  },
  pickerOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  pickerOptionLabelSelected: {
    color: colors.primary,
  },
  pickerOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Search Mode
  searchModeContainer: {
    flex: 1,
  },
  searchCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    ...shadow.card,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Results
  resultsSection: {
    flex: 1,
    marginTop: spacing.md,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.label,
    fontSize: 16,
    marginBottom: spacing.xxs,
  },
  username: {
    ...typography.caption,
  },
  addUserButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.glow,
  },
  addUserButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Instructions & Empty states
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  instructionsIconContainer: {
    marginBottom: spacing.xl,
  },
  instructionsIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  instructionsTitle: {
    ...typography.heading,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyResultsText: {
    ...typography.heading,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  emptyResultsSubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  switchToManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  switchToManualText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
