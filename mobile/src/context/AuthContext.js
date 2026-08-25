import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { getApiBaseUrl, saveApiBaseUrl } from '../api/config';

const AuthContext = createContext();

const USER_DATA_KEY = '@unifind_user_data';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrlState] = useState('');

  // Restore authentication and API URL on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUrl = await getApiBaseUrl();
        setApiUrlState(currentUrl);

        const storedToken = await apiClient.getToken();
        const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Silently verify token with backend
          try {
            const profileRes = await apiClient.get('/auth/me');
            if (profileRes.success && profileRes.user) {
              setUser(profileRes.user);
              await AsyncStorage.setItem(
                USER_DATA_KEY,
                JSON.stringify(profileRes.user)
              );
            }
          } catch (e) {
            console.log('Token verification failed on start:', e.message);
            // If token expired (401), log user out
            if (e.status === 401) {
              await logout();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.success && res.token) {
        await apiClient.setToken(res.token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.success && res.token) {
        await apiClient.setToken(res.token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.setToken(null);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      setToken(null);
      setUser(null);
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const updateApiUrl = async (newUrl) => {
    const formatted = await saveApiBaseUrl(newUrl);
    setApiUrlState(formatted);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        apiUrl,
        updateApiUrl,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
