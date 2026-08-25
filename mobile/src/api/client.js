import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './config';

const TOKEN_KEY = '@unifind_auth_token';

export const apiClient = {
  // Helper to build full endpoint URL
  async buildUrl(endpoint) {
    const base = await getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanEndpoint}`;
  },

  // Helper to resolve image URL
  async resolveImageUrl(relativeOrAbsoluteUrl) {
    if (!relativeOrAbsoluteUrl) return null;
    if (relativeOrAbsoluteUrl.startsWith('http')) return relativeOrAbsoluteUrl;

    const base = await getApiBaseUrl();
    // remove '/api' from base to get server origin
    const origin = base.replace(/\/api\/?$/, '');
    const cleanPath = relativeOrAbsoluteUrl.startsWith('/')
      ? relativeOrAbsoluteUrl
      : `/${relativeOrAbsoluteUrl}`;
    return `${origin}${cleanPath}`;
  },

  // Get current token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // Store token
  async setToken(token) {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  // Generic request dispatcher
  async request(endpoint, options = {}) {
    const url = await this.buildUrl(endpoint);
    const token = await this.getToken();

    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // If body is NOT FormData, set application/json
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data.message || `Request failed with status ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API Client Error] ${options.method || 'GET'} ${url}:`, err.message);
      throw err;
    }
  },

  // Convenience methods
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Multipart file upload helper
  async upload(endpoint, formData, method = 'POST') {
    const url = await this.buildUrl(endpoint);
    const token = await this.getToken();

    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: Do not set Content-Type header manually for FormData in React Native
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data.message || `Upload failed with status ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API Upload Error] ${url}:`, err.message);
      throw err;
    }
  },
};
