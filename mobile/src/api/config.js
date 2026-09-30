import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@unifind_api_base_url';

// Default host based on platform
export const getDefaultApiUrl = () => {
  // If running in web browser
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Physical mobile device on the Wi-Fi network (or Android emulator)
  return 'http://172.20.10.4:5000/api';
};

// Retrieve configured or default API base URL
export const getApiBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    console.warn('Error reading saved API URL', e);
  }
  return getDefaultApiUrl();
};

// Save a custom API URL (e.g., local Wi-Fi IP http://192.168.1.15:5000/api or Render hosted URL)
export const saveApiBaseUrl = async (newUrl) => {
  try {
    let cleanUrl = newUrl.trim();
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = cleanUrl.replace(/\/+$/, '') + '/api';
    }
    await AsyncStorage.setItem(STORAGE_KEY, cleanUrl);
    return cleanUrl;
  } catch (e) {
    console.error('Error saving API URL', e);
    throw e;
  }
};
