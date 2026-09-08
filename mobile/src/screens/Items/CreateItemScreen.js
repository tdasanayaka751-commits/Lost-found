import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS, CATEGORIES } from '../../constants/theme';

export default function CreateItemScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Found'); // Default to 'Found'
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Request permissions & pick image from library
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access photo gallery is required to upload item pictures.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        if (errors.image) setErrors({ ...errors, image: null });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image: ' + err.message);
    }
  };

  // Launch camera
  const takePhoto = async () => {
    try {
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take a picture of the item.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        if (errors.image) setErrors({ ...errors, image: null });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo: ' + err.message);
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!location.trim()) errs.location = 'Campus location is required';
    if (!imageUri) errs.image = 'An image of the item is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('date', new Date().toISOString());

      // Prepare image file object for React Native FormData
      const filename = imageUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      formData.append('image', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type: mimeType,
      });

      const response = await apiClient.upload('/items', formData);

      if (response.success) {
        Alert.alert(
          'Success!',
          `Your ${type} item report has been published.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('HomeFeed');
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Upload Error', err.message || 'Failed to submit report');
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
      <Text style={styles.screenTitle}>Report Lost or Found Item</Text>
      <Text style={styles.screenSubtitle}>
        Provide accurate details and photos to help identify and recover items
      </Text>

      {/* Type Toggle: Lost vs Found */}
      <View style={styles.typeToggleContainer}>
        <TouchableOpacity
          style={[
            styles.typeToggleBtn,
            type === 'Found' && styles.typeToggleBtnFound,
          ]}
          onPress={() => setType('Found')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={type === 'Found' ? '#FFFFFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.typeToggleText,
              type === 'Found' && styles.typeToggleTextActive,
            ]}
          >
            I Found An Item
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeToggleBtn,
            type === 'Lost' && styles.typeToggleBtnLost,
          ]}
          onPress={() => setType('Lost')}
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={type === 'Lost' ? '#FFFFFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.typeToggleText,
              type === 'Lost' && styles.typeToggleTextActive,
            ]}
          >
            I Lost An Item
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Picker Section */}
      <View style={styles.imageSection}>
        <Text style={styles.fieldLabel}>
          Item Photo <Text style={{ color: COLORS.error }}>*</Text>
        </Text>

        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.imagePickerBox,
              errors.image && styles.imagePickerBoxError,
            ]}
          >
            <Ionicons name="camera-outline" size={38} color="#94A3B8" />
            <Text style={styles.pickerHint}>
              Upload a clear photo of the item
            </Text>

            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.pickerActionBtn}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={16} color={COLORS.primary} />
                <Text style={styles.pickerActionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerActionBtn}
                onPress={takePhoto}
              >
                <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
                <Text style={styles.pickerActionText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {errors.image ? (
          <Text style={styles.errorText}>{errors.image}</Text>
        ) : null}
      </View>

      {/* Title */}
      <CustomInput
        label="Item Title"
        placeholder="e.g. Black Dell Laptop Charger 65W"
        value={title}
        onChangeText={(val) => {
          setTitle(val);
          if (errors.title) setErrors({ ...errors, title: null });
        }}
        required
        error={errors.title}
      />

      {/* Category Pills Selection */}
      <View style={styles.categorySection}>
        <Text style={styles.fieldLabel}>
          Category <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
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

      {/* Location */}
      <CustomInput
        label="Campus Location"
        placeholder="e.g. Computing Faculty Canteen or Library Level 2"
        value={location}
        onChangeText={(val) => {
          setLocation(val);
          if (errors.location) setErrors({ ...errors, location: null });
        }}
        required
        error={errors.location}
      />

      {/* Description */}
      <CustomInput
        label="Description & Distinguishing Features"
        placeholder="Provide colors, markings, stickers, or brand names to help identify the item..."
        value={description}
        onChangeText={(val) => {
          setDescription(val);
          if (errors.description) setErrors({ ...errors, description: null });
        }}
        multiline
        numberOfLines={4}
        required
        error={errors.description}
      />

      <CustomButton
        title={`Publish ${type} Item Report`}
        onPress={handleSubmit}
        loading={submitting}
        variant="primary"
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
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 20,
    marginTop: 4,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  typeToggleBtnFound: {
    backgroundColor: COLORS.success,
  },
  typeToggleBtnLost: {
    backgroundColor: COLORS.error,
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  imageSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  imagePickerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerBoxError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  pickerHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 12,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  pickerActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  previewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 10,
  },
});
