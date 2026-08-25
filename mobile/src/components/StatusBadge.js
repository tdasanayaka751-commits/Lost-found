import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../constants/theme';

export default function StatusBadge({ status = 'Open', size = 'medium' }) {
  const theme = STATUS_COLORS[status] || STATUS_COLORS.Open;

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 10,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: theme.text,
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          {
            color: theme.text,
            fontSize: isSmall ? 11 : 12,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: 999,
    marginRight: 5,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
