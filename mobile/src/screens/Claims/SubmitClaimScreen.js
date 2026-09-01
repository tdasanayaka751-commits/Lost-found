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
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS } from '../../constants/theme';

export default function SubmitClaimScreen({ route, navigation }) {
  const { itemId, itemTitle, onSuccess } = route.params;
  const { user } = useAuth();

  const [proofDetails, setProofDetails] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!proofDetails.trim()) {
      errs.proofDetails =
        'Please describe unique features or proof only the owner would know.';
    } else if (proofDetails.trim().length < 15) {
      errs.proofDetails =
        'Proof description must be at least 15 characters long for verification.';
    }

    if (!contactNumber.trim()) {
      errs.contactNumber = 'A contact phone number is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await apiClient.post('/claims', {
        itemId,
        proofDetails: proofDetails.trim(),
        contactNumber: contactNumber.trim(),
      });

      if (response.success) {
        Alert.alert(
          'Claim Submitted!',
          'Your claim has been forwarded to the student or staff member who reported this item. You will be notified when it is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) onSuccess();
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (err) {
      // Handles business logic violation messages from backend
      setServerError(err.message || 'Failed to submit claim.');
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
        <Text style={styles.screenTitle}>Claim Ownership</Text>
      </View>

      <View style={styles.itemSummaryBox}>
        <Text style={styles.itemSummaryLabel}>Claiming Item:</Text>
        <Text style={styles.itemSummaryTitle}>{itemTitle}</Text>
      </View>

      {serverError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
          <Text style={styles.errorBannerText}>{serverError}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification Details</Text>
        <Text style={styles.cardSubtitle}>
          To prevent fraudulent claims, describe details not visible in the
          listing photos (e.g., serial number, internal contents, lockscreen,
          stickers, receipt).
        </Text>

        <CustomInput
          label="Proof & Identifying Details"
          placeholder="e.g. My calculator has a small scratch next to the solar cell, and the initials K.P. are engraved under the battery cover..."
          value={proofDetails}
          onChangeText={(v) => {
            setProofDetails(v);
            if (errors.proofDetails)
              setErrors({ ...errors, proofDetails: null });
          }}
          multiline
          numberOfLines={5}
          required
          error={errors.proofDetails}
        />

        <CustomInput
          label="Contact Number"
          placeholder="e.g. 0771234567"
          value={contactNumber}
          onChangeText={(v) => {
            setContactNumber(v);
            if (errors.contactNumber)
              setErrors({ ...errors, contactNumber: null });
          }}
          keyboardType="phone-pad"
          required
          error={errors.contactNumber}
        />

        <CustomButton
          title="Submit Ownership Claim"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
          icon={
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          }
        />
      </View>
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  itemSummaryBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  itemSummaryLabel: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});
