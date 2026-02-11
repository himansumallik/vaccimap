import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native'; // Import loading components
import { onAuthStateChanged } from 'firebase/auth'; // Import the auth listener
import { auth } from './firebase'; // Import auth

// Import your screens
import LoginScreen from './screens/LoginScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  // Add state to track loading and initial user session
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function authStateChanged(user) {
    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    // This listener checks Firebase when the app boots up
    // and continues to listen for changes (like logout)
    const subscriber = onAuthStateChanged(auth, authStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Show a loading screen while we check for a user session
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // Once we're done checking, show the correct screens
  return (
    <NavigationContainer>
      {/* We use a "ternary" operator here.
        If a user session exists, start on Dashboard.
        If not, start on Login.
      */}
      <Stack.Navigator 
        initialRouteName={user ? 'Dashboard' : 'Login'}
        screenOptions={{
          headerStyle: { backgroundColor: '#0284c7' }, // Tailwind blue-600
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* These screens are now protected */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'VacciMap Dashboard' }} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} options={{ title: 'Create Profile' }} />
        
        {/* This is the public login screen */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login / Register' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

