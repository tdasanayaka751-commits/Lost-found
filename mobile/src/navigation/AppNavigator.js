import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/Items/HomeScreen';
import ItemDetailScreen from '../screens/Items/ItemDetailScreen';
import CreateItemScreen from '../screens/Items/CreateItemScreen';
import EditItemScreen from '../screens/Items/EditItemScreen';
import SubmitClaimScreen from '../screens/Claims/SubmitClaimScreen';
import ManageItemClaimsScreen from '../screens/Claims/ManageItemClaimsScreen';
import MyActivityScreen from '../screens/Activity/MyActivityScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs Navigator for Authenticated User
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeFeed') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'CreateItemTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ActivityTab') {
            iconName = focused ? 'albums' : 'albums-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeFeed"
        component={HomeScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="CreateItemTab"
        component={CreateItemScreen}
        options={{ tabBarLabel: 'Report' }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={MyActivityScreen}
        options={{ tabBarLabel: 'My Activity' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Authenticated App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ animation: 'default' }}
            />
            <Stack.Screen name="CreateItem" component={CreateItemScreen} />
            <Stack.Screen name="EditItem" component={EditItemScreen} />
            <Stack.Screen name="SubmitClaim" component={SubmitClaimScreen} />
            <Stack.Screen
              name="ManageItemClaims"
              component={ManageItemClaimsScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
