/**
 * 🚀 SAURELLIUS CLOUD PAYROLL MANAGEMENT
 * Main App Entry Point
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { store } from './frontend/src/store';
import AppNavigator from './frontend/src/navigation/AppNavigator';
import { toastConfig } from './frontend/src/components/common/ToastConfig';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
          <Toast config={toastConfig} />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
