export const COLORS = {
  primary: '#2563EB',      // Royal Blue
  primaryDark: '#1D4ED8',  // Darker Blue for pressed/active
  primaryLight: '#DBEAFE', // Soft tint
  secondary: '#0F172A',    // Deep Slate Navy
  accent: '#F59E0B',       // Amber
  background: '#F8FAFC',   // Off-white / light gray canvas
  surface: '#FFFFFF',      // Card white
  text: '#0F172A',         // Primary text
  textMuted: '#64748B',    // Subdued text
  border: '#E2E8F0',       // Crisp border
  error: '#EF4444',        // Red for Lost / Error / Rejection
  errorLight: '#FEE2E2',
  success: '#10B981',      // Green for Found / Approved
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Orange for Pending
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  purple: '#8B5CF6',       // Purple for Claimed
  purpleLight: '#EDE9FE',
};

export const CATEGORIES = [
  'All',
  'Electronics',
  'ID & Cards',
  'Clothing',
  'Books & Stationery',
  'Keys',
  'Bags & Wallets',
  'Personal Items',
  'Other',
];

export const ITEM_TYPES = ['All', 'Lost', 'Found'];

export const STATUS_COLORS = {
  Open: {
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#86EFAC',
  },
  Pending: {
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#FDE68A',
  },
  Approved: {
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#86EFAC',
  },
  Rejected: {
    bg: '#FEE2E2',
    text: '#B91C1C',
    border: '#FCA5A5',
  },
  Claimed: {
    bg: '#EDE9FE',
    text: '#6D28D9',
    border: '#DDD6FE',
  },
  Cancelled: {
    bg: '#F1F5F9',
    text: '#64748B',
    border: '#CBD5E1',
  },
  Resolved: {
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
};
