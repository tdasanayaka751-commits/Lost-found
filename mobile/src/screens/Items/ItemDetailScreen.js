import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS } from '../../constants/theme';

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchItemDetail = async () => {
    try {
      const response = await apiClient.get(`/items/${itemId}`);
      if (response.success && response.data) {
        setItem(response.data);
        if (response.data.imageUrl) {
          const fullUrl = await apiClient.resolveImageUrl(
            response.data.imageUrl
          );
          setResolvedImageUrl(fullUrl);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
  }, [itemId]);

  const isReporter =
    user && item?.reportedBy && (user.id === item.reportedBy._id || user.id === item.reportedBy);
  const isAdmin = user && user.role === 'admin';
  const canManage = isReporter || isAdmin;

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? All claims attached to this item will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await apiClient.delete(`/items/${itemId}`);
              Alert.alert('Success', 'Item deleted successfully.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('HomeFeed'),
                },
              ]);
            } catch (err) {
              Alert.alert('Delete Failed', err.message);
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (item?.reportedBy?.phone) {
      Linking.openURL(`tel:${item.reportedBy.phone}`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading item details..." />;
  if (!item) return <Text style={{ padding: 24 }}>Item not found.</Text>;

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {resolvedImageUrl ? (
            <Image
              source={{ uri: resolvedImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={64} color="#94A3B8" />
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  item.type === 'Found' ? COLORS.success : COLORS.error,
              },
            ]}
          >
            <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.contentCard}>
          <View style={styles.statusRow}>
            <Text style={styles.categoryBadge}>{item.category}</Text>
            <StatusBadge status={item.status} />
          </View>

          <Text style={styles.title}>{item.title}</Text>

          {/* Quick Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{item.location}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Description & Details</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>

          {/* Reporter Information */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Reported By</Text>
            <View style={styles.reporterCard}>
              <View style={styles.reporterAvatar}>
                <Ionicons name="person" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reporterName}>
                  {item.reportedBy?.name || 'Anonymous Student'}
                </Text>
                <Text style={styles.reporterMeta}>
                  {item.reportedBy?.studentId
                    ? `ID: ${item.reportedBy.studentId} • `
                    : ''}
                  {item.reportedBy?.email}
                </Text>
              </View>

              {item.reportedBy?.phone ? (
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={handleCall}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Business Logic Warning / Notices */}
          {item.status === 'Claimed' && (
            <View style={styles.claimedNotice}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.purple}
              />
              <Text style={styles.claimedNoticeText}>
                This item has been officially claimed and verified. No new
                claims can be placed.
              </Text>
            </View>
          )}

          {isReporter && (
            <View style={styles.reporterNotice}>
              <Ionicons
                name="information-circle"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.reporterNoticeText}>
                You reported this listing. You can review submitted claims, edit
                details, or mark it resolved.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {canManage ? (
          <View style={styles.manageRow}>
            <CustomButton
              title={`Review Claims (${item.claimCount || 0})`}
              onPress={() =>
                navigation.navigate('ManageItemClaims', {
                  itemId: item._id,
                  itemTitle: item.title,
                })
              }
              variant="primary"
              style={{ flex: 1 }}
              icon={<Ionicons name="list" size={18} color="#FFFFFF" />}
            />

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() =>
                navigation.navigate('EditItem', {
                  item,
                  onSuccess: fetchItemDetail,
                })
              }
            >
              <Ionicons name="create-outline" size={22} color={COLORS.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconActionBtn, styles.deleteActionBtn]}
              onPress={handleDelete}
              disabled={deleteLoading}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <CustomButton
            title={
              item.status === 'Open'
                ? 'Claim This Item'
                : `Item ${item.status}`
            }
            onPress={() =>
              navigation.navigate('SubmitClaim', {
                itemId: item._id,
                itemTitle: item.title,
                onSuccess: fetchItemDetail,
              })
            }
            disabled={item.status !== 'Open'}
            variant="primary"
            style={{ width: '100%' }}
            icon={
              item.status === 'Open' ? (
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 22,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
    lineHeight: 28,
    marginBottom: 16,
  },
  infoGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
  reporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
  },
  reporterAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reporterName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  reporterMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  callIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  claimedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleLight,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  claimedNoticeText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.purple,
    fontWeight: '600',
    flex: 1,
  },
  reporterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  reporterNoticeText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '500',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
});
