import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import ItemCard from '../../components/ItemCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS } from '../../constants/theme';

export default function MyActivityScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'claims'
  const [myItems, setMyItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyData = useCallback(async () => {
    try {
      if (activeTab === 'items') {
        const res = await apiClient.get('/items/user/my-items');
        if (res.success) setMyItems(res.data || []);
      } else {
        const res = await apiClient.get('/claims/my-claims');
        if (res.success) setMyClaims(res.data || []);
      }
    } catch (err) {
      console.warn('Error loading activity data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchMyData();
    }, [fetchMyData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyData();
  };

  // Withdraw pending claim
  const handleWithdrawClaim = (claimId) => {
    Alert.alert(
      'Withdraw Claim',
      'Are you sure you want to withdraw this claim?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/claims/${claimId}`);
              Alert.alert('Success', 'Claim withdrawn successfully.');
              fetchMyData();
            } catch (err) {
              Alert.alert('Failed', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>My Activity</Text>
        <Text style={styles.screenSubtitle}>
          Track items you reported and ownership claims you submitted
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'items' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('items');
            setLoading(true);
          }}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeTab === 'items' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'items' && styles.tabBtnTextActive,
            ]}
          >
            Reported Items ({myItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'claims' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('claims');
            setLoading(true);
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'claims' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'claims' && styles.tabBtnTextActive,
            ]}
          >
            My Claims ({myClaims.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading your activity..." />
      ) : activeTab === 'items' ? (
        <FlatList
          data={myItems}
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
              icon="cube-outline"
              title="No items reported"
              message="You haven't reported any lost or found items yet."
              buttonTitle="Report An Item"
              onButtonPress={() => navigation.navigate('CreateItem')}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.myItemWrapper}>
              <ItemCard
                item={item}
                onPress={() =>
                  navigation.navigate('ItemDetail', { itemId: item._id })
                }
              />
              <View style={styles.itemActionStrip}>
                <TouchableOpacity
                  style={styles.stripBtn}
                  onPress={() =>
                    navigation.navigate('ManageItemClaims', {
                      itemId: item._id,
                      itemTitle: item.title,
                    })
                  }
                >
                  <Ionicons
                    name="people-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                  <Text style={styles.stripBtnText}>Review Claims</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stripBtn}
                  onPress={() =>
                    navigation.navigate('EditItem', {
                      item,
                      onSuccess: fetchMyData,
                    })
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.stripBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={myClaims}
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
              icon="shield-outline"
              title="No claims submitted"
              message="You haven't claimed any lost items yet. Explore the campus feed to search for your belongings."
              buttonTitle="Browse Feed"
              onButtonPress={() => navigation.navigate('HomeFeed')}
            />
          }
          renderItem={({ item: claim }) => {
            const item = claim.itemId;
            return (
              <View style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimItemTitle} numberOfLines={1}>
                      {item?.title || 'Referenced Item'}
                    </Text>
                    <Text style={styles.claimLocation}>
                      {item?.location ? `Found at: ${item.location}` : ''}
                    </Text>
                  </View>
                  <StatusBadge status={claim.status} size="small" />
                </View>

                <View style={styles.proofBox}>
                  <Text style={styles.proofHeading}>Proof Submitted:</Text>
                  <Text style={styles.proofContent}>{claim.proofDetails}</Text>
                </View>

                {claim.adminNotes ? (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseHeading}>Finder Note:</Text>
                    <Text style={styles.responseText}>{claim.adminNotes}</Text>
                  </View>
                ) : null}

                <View style={styles.claimFooter}>
                  <Text style={styles.dateLabel}>
                    Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                  </Text>

                  {claim.status === 'Pending' && (
                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      onPress={() => handleWithdrawClaim(claim._id)}
                    >
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  myItemWrapper: {
    marginBottom: 8,
  },
  itemActionStrip: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
    paddingRight: 4,
  },
  stripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  stripBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
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
  claimItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  claimLocation: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  proofBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  proofHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  proofContent: {
    fontSize: 13,
    color: COLORS.text,
  },
  responseBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  responseHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  responseText: {
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  withdrawBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  withdrawBtnText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
});
