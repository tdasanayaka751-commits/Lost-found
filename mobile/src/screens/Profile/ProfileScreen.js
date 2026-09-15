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
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, apiUrl, updateApiUrl } = useAuth();

  const [customUrl, setCustomUrl] = useState(apiUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  const handleSaveUrl = async () => {
    try {
      await updateApiUrl(customUrl);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2500);
      Alert.alert(
        'Server URL Updated',
        `App is now configured to fetch from:\n${customUrl}`
      );
    } catch (e) {
      Alert.alert('Error', 'Invalid API URL format');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of UniFind?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>{user?.name || 'Campus Student'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? '🛡️ Campus Administrator' : '🎓 SLIIT Student'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Student ID</Text>
            <Text style={styles.metaValue}>{user?.studentId || 'N/A'}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Contact Phone</Text>
            <Text style={styles.metaValue}>{user?.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Network & Backend Host Configuration (Essential for evaluation & deployment) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Backend API Configuration</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Connect mobile app to your localhost, local Wi-Fi IP, or live hosted
          Render/Railway server without rebuilding the app.
        </Text>

        <CustomInput
          label="Active API Base URL"
          value={customUrl}
          onChangeText={setCustomUrl}
          placeholder="http://192.168.1.100:5000/api"
        />

        <View style={styles.presetRow}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setCustomUrl('http://localhost:5000/api')}
          >
            <Text style={styles.presetText}>Localhost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setCustomUrl('http://10.0.2.2:5000/api')}
          >
            <Text style={styles.presetText}>Android (10.0.2.2)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() =>
              setCustomUrl('https://unifind-backend.onrender.com/api')
            }
          >
            <Text style={styles.presetText}>Render Cloud</Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title={urlSaved ? '✓ Server URL Saved' : 'Save Server URL'}
          onPress={handleSaveUrl}
          variant={urlSaved ? 'success' : 'outline'}
          style={styles.saveUrlBtn}
        />
      </View>

      {/* About & Viva Defense Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.sectionTitle}>About Application</Text>
        </View>
        <Text style={styles.aboutRow}>
          <Text style={{ fontWeight: '700' }}>Project: </Text>
          UniFind - Campus Lost & Found System
        </Text>
        <Text style={styles.aboutRow}>
          <Text style={{ fontWeight: '700' }}>Module: </Text>
          SE2020 Web & Mobile Technologies (SLIIT)
        </Text>
        <Text style={styles.aboutRow}>
          <Text style={{ fontWeight: '700' }}>Stack: </Text>
          React Native + Node.js + Express + MongoDB
        </Text>
        <Text style={styles.aboutRow}>
          <Text style={{ fontWeight: '700' }}>Entities: </Text>
          Item (Primary) + Claim (Related) + User
        </Text>
      </View>

      {/* Logout Button */}
      <CustomButton
        title="Log Out of Account"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutBtn}
        icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 18,
    paddingTop: 16,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  saveUrlBtn: {
    height: 42,
  },
  aboutRow: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  logoutBtn: {
    marginTop: 10,
  },
});
