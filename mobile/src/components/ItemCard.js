import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { apiClient } from '../api/client';

export default function ItemCard({ item, onPress }) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (item.imageUrl) {
      apiClient.resolveImageUrl(item.imageUrl).then((url) => {
        if (isMounted) setResolvedImageUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [item.imageUrl]);

  const isFound = item.type === 'Found';
  const formattedDate = new Date(item.date || item.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress && onPress(item)}
    >
      {/* Item Image with Type Tag */}
      <View style={styles.imageContainer}>
        {resolvedImageUrl ? (
          <Image
            source={{ uri: resolvedImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color="#94A3B8" />
          </View>
        )}

        <View
          style={[
            styles.typeTag,
            { backgroundColor: isFound ? COLORS.success : COLORS.error },
          ]}
        >
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.details}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{item.category}</Text>
          <StatusBadge status={item.status} size="small" />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={COLORS.textMuted}
            />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {item.reportedBy?.name ? (
            <Text style={styles.reporterText} numberOfLines={1}>
              By: {item.reportedBy.name.split(' ')[0]}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: 110,
    height: 125,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  reporterText: {
    fontSize: 11,
    color: '#94A3B8',
    maxWidth: 90,
  },
});
