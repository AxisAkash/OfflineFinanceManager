import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';
import { CreatePinScreen } from '../../features/authentication/screens/CreatePinScreen';
import { EnterPinScreen } from '../../features/authentication/screens/EnterPinScreen';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { TransactionsScreen } from '../../features/transaction/screens/TransactionsScreen';
import { BudgetScreen } from '../../features/budget/screens/BudgetScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { isPinSetup } from '../../core/encryption';
import { typography } from '../theme/spacing';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Dashboard: '$',
    Transactions: 'T',
    Budget: 'B',
    Analytics: 'A',
    Settings: 'S',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, { color: focused ? color : undefined }]}>
        {icons[label] || '?'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    fontWeight: '700',
  },
});

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          ...typography.caption,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Transactions" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Budget" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Analytics" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator({
  onAuthSuccess,
  hasPin,
}: {
  onAuthSuccess: () => void;
  hasPin: boolean;
}) {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasPin ? 'EnterPin' : 'CreatePin'}
    >
      <AuthStack.Screen name="CreatePin">
        {() => <CreatePinScreen onComplete={onAuthSuccess} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="EnterPin">
        {() => <EnterPinScreen onSuccess={onAuthSuccess} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const pinSetup = await isPinSetup();
      setHasPin(pinSetup);
      setIsAuthenticated(false);
    } catch {
      setHasPin(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.primary }]}>
          Offline Finance
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth">
            {() => (
              <AuthNavigator
                hasPin={hasPin}
                onAuthSuccess={handleAuthSuccess}
              />
            )}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.h1,
  },
});
