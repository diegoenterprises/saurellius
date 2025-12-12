/**
 * SAURELLIUS CLOUD PAYROLL & HR MANAGEMENT
 * Main App Entry Point - Step 1 of User Journey
 */

import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { store, AppDispatch, RootState } from './src/store';
import { checkAuth } from './src/store/slices/authSlice';
import { loadSettings } from './src/store/slices/settingsSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import AIChat from './src/components/ai/AIChat';
import { useSelector } from 'react-redux';

// Auth initialization wrapper
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Step 1-5: Check for existing auth tokens on app launch
    const initAuth = async () => {
      try {
        await Promise.all([
          dispatch(checkAuth()).unwrap(),
          dispatch(loadSettings()),
        ]);
      } catch (error) {
        // No valid session - user will see login screen
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [dispatch]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1473FF" />
        <Text style={styles.loadingText}>Loading Saurellius...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// AI Chat wrapper - only shows when logged in
function AIChatWrapper() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) return null;
  
  return (
    <AIChat 
      context={{
        state: user?.state,
        employee_count: user?.employee_count,
        subscription_plan: user?.subscription_tier,
      }}
    />
  );
}

export default function App() {
  // Web version
  if (Platform.OS === 'web') {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <SafeAreaProvider>
            <View style={styles.container}>
              <StatusBar style="light" />
              <AuthInitializer>
                <AppNavigator />
                <AIChatWrapper />
              </AuthInitializer>
              <Toast />
            </View>
          </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    );
  }

  // Native version
  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <ThemeProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <AuthInitializer>
              <AppNavigator />
              <AIChatWrapper />
            </AuthInitializer>
            <Toast />
          </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});
