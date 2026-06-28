import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/shared/theme';
import { LanguageProvider, useLanguage } from './src/shared/localization/LanguageContext';
import { AppNavigator } from './src/shared/navigation/AppNavigator';
import { initializeDatabase } from './src/core/database/connection';
import { typography } from './src/shared/theme/spacing';

function AppContent() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    try {
      await initializeDatabase();
      setIsReady(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.app.error;
      setError(message);
    }
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.primary }]}>
          {t.app.name}
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    ...typography.h1,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
  },
});
