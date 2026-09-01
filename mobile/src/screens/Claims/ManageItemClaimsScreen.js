import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS } from '../../constants/theme';

export default function ManageItemClaimsScreen({ route, navigation }) {
  const { itemId, itemTitle } = route.params;

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClaims = async () => {
    try {
      const response = await apiClient.get(`/claims/item/${itemId}`);
      if (response.success) {
        setClaims(response.data || []);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch claims.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [itemId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClaims();
  };

  // Status transition handler (enforces business logic)
  const handleStatusChange = (claimId, newStatus, claimantName) => {
    const isApproval = newStatus === 'Approved';

    Alert.alert(
      `${newStatus} Claim?`,
      isApproval
        ? `Approving ${claimantName}'s claim will officially mark this item as 'CLAIMED' and automatically reject all other pending claims.`
        : `Are you sure you want to mark this claim as ${newStatus.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isApproval ? 'Approve Handover' : 'Confirm',
          style: isApproval ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiClient.patch(`/claims/${claimId}/status`, {
                status: newStatus,
                adminNotes: isApproval
                  ? 'Claim ownership verified and approved by reporter.'
                  : 'Claim rejected by reporter.',
              });

              if (res.success) {
                Alert.alert(
                  'Updated!',
                  `Claim marked as ${newStatus}. Item status is now ${res.itemStatus}.`
                );
                fetchClaims();
              }
            } catch (err) {
              Alert.alert('Action Failed', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Review Claims</Text>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {itemTitle}
          </Text>
        </View>
      </View>

      {/* Information Banner on Business Logic */}
      <View style={styles.logicNotice}>
        <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
        <Text style={styles.logicNoticeText}>
          Approving a claim automatically transitions item status to 'Claimed'
          and notifies other applicants.
        </Text>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading submitted claims..." />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No claims yet"
              message="No student has submitted an ownership claim for this item yet. Check back later."
            />
          }
          renderItem={({ item: claim }) => {
            const isPending = claim.status === 'Pending';
            const isApproved = claim.status === 'Approved';

            return (
              <View style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  <View style={styles.claimantInfo}>
                    <Text style={styles.claimantName}>
                      {claim.claimant?.name || 'Student Claimant'}
                    </Text>
                    <Text style={styles.claimantMeta}>
                      {claim.claimant?.studentId
                        ? `ID: ${claim.claimant.studentId} • `
                        : ''}
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <StatusBadge status={claim.status} size="small" />
                </View>

                {/* Proof Details provided by student */}
                <View style={styles.proofContainer}>
                  <Text style={styles.proofLabel}>Provided Proof & Details:</Text>
                  <Text style={styles.proofText}>{claim.proofDetails}</Text>
                </View>

                {/* Contact and Calling Row */}
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={15} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>
                    {claim.contactNumber || claim.claimant?.phone}
                  </Text>
                  <TouchableOpacity
                    style={styles.callSmallBtn}
                    onPress={() =>
                      handleCall(claim.contactNumber || claim.claimant?.phone)
                    }
                  >
                    <Ionicons name="call" size={12} color="#FFFFFF" />
                    <Text style={styles.callSmallBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>

                {/* Reporter / Admin notes if resolved */}
                {claim.adminNotes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Resolution Notes:</Text>
                    <Text style={styles.notesText}>{claim.adminNotes}</Text>
                  </View>
                ) : null}

                {/* Interactive Action Controls */}
                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() =>
                        handleStatusChange(
                          claim._id,
                          'Approved',
                          claim.claimant?.name || 'Claimant'
                        )
                      }
                      disabled={actionLoading}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionBtnText}>Approve & Handover</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() =>
                        handleStatusChange(
                          claim._id,
                          'Rejected',
                          claim.claimant?.name || 'Claimant'
                        )
                      }
                      disabled={actionLoading}
                    >
                      <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isApproved && (
                  <View style={styles.approvedBanner}>
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color={COLORS.success}
                    />
                    <Text style={styles.approvedBannerText}>
                      Ownership approved. Item is marked Claimed.
                    </Text>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() =>
                        handleStatusChange(
                          claim._id,
                          'Cancelled',
                          claim.claimant?.name || 'Claimant'
                        )
                      }
                    >
                      <Text style={styles.cancelBtnText}>Reopen Item</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
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
  itemTitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logicNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  logicNoticeText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  claimantInfo: {
    flex: 1,
  },
  claimantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  claimantMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  proofContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  proofLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  proofText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  callSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.error,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  approvedBannerText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginLeft: 6,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
});
