import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS, CATEGORIES } from '../../constants/theme';

export default function EditItemScreen({ route, navigation }) {
  const { item, onSuccess } = route.params;

  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description);
  const [location, setLocation] = useState(item.location);
  const [status, setStatus] = useState(item.status);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!location.trim()) errs.location = 'Campus location is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await apiClient.put(`/items/${item._id}`, {
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        status,
      });

      if (response.success) {
        Alert.alert('Success', 'Item details updated successfully.', [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Edit Item Listing</Text>
      </View>

      {/* Status Picker */}
      <View style={styles.statusSection}>
        <Text style={styles.fieldLabel}>Listing Status</Text>
        <View style={styles.statusRow}>
          {['Open', 'Claimed', 'Resolved'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusPill,
                status === st && styles.statusPillActive,
              ]}
              onPress={() => setStatus(st)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  status === st && styles.statusPillTextActive,
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CustomInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        required
        error={errors.title}
      />

      {/* Category Pills */}
      <View style={styles.categorySection}>
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                category === cat && styles.categoryPillSelected,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  category === cat && styles.categoryPillTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <CustomInput
        label="Campus Location"
        value={location}
        onChangeText={setLocation}
        required
        error={errors.location}
      />

      <CustomInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        required
        error={errors.description}
      />

      <CustomButton
        title="Save Changes"
        onPress={handleUpdate}
        loading={submitting}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  statusSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryPillsRow: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 12,
  },
});
