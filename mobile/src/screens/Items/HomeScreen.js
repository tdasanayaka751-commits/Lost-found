import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import ItemCard from '../../components/ItemCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS, CATEGORIES, ITEM_TYPES } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'All') params.append('type', selectedType);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get(`/items${queryString}`);

      if (response.success) {
        setItems(response.data || []);
      }
    } catch (err) {
      console.warn('Failed to load items:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedCategory, selectedStatus, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedType('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>UniFind</Text>
          <Text style={styles.brandSubtitle}>Campus Lost & Found Feed</Text>
        </View>

        <TouchableOpacity
          style={styles.newReportBtn}
          onPress={() => navigation.navigate('CreateItem')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.newReportText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search by title, location, or details..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Type Toggle Pills: All | Lost | Found */}
      <View style={styles.typeSelectorRow}>
        {ITEM_TYPES.map((type) => {
          const isActive = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typePill,
                isActive && styles.typePillActive,
                isActive && type === 'Found' && styles.typePillFound,
                isActive && type === 'Lost' && styles.typePillLost,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typePillText,
                  isActive && styles.typePillTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Status Dropdown / Quick filter */}
        <TouchableOpacity
          style={[
            styles.statusFilterBtn,
            selectedStatus !== 'All' && styles.statusFilterBtnActive,
          ]}
          onPress={() =>
            setSelectedStatus((prev) =>
              prev === 'All' ? 'Open' : prev === 'Open' ? 'Claimed' : 'All'
            )
          }
        >
          <Text
            style={[
              styles.statusFilterText,
              selectedStatus !== 'All' && styles.statusFilterTextActive,
            ]}
          >
            {selectedStatus === 'All' ? 'Status: Any' : `Status: ${selectedStatus}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Scroll */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isCatActive && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isCatActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      {loading ? (
        <LoadingSpinner message="Fetching campus listings..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={(selected) =>
                navigation.navigate('ItemDetail', { itemId: selected._id })
              }
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No items matched"
              message="No lost or found items matched your active filters. Try adjusting your query or filters."
              buttonTitle="Reset Filters"
              onButtonPress={clearFilters}
            />
          }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  newReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newReportText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  typePillActive: {
    backgroundColor: COLORS.secondary,
  },
  typePillFound: {
    backgroundColor: COLORS.success,
  },
  typePillLost: {
    backgroundColor: COLORS.error,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  statusFilterBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterBtnActive: {
    backgroundColor: COLORS.purpleLight,
    borderColor: COLORS.purple,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statusFilterTextActive: {
    color: COLORS.purple,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
