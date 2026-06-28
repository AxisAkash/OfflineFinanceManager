import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { AddTransactionScreen } from '../../features/transaction/screens/AddTransactionScreen';
import { TransactionDetailScreen } from '../../features/transaction/screens/TransactionDetailScreen';
import { WalletScreen } from '../../features/wallet/screens/WalletScreen';
import { SavingsScreen } from '../../features/savings/screens/SavingsScreen';
import { DebtScreen } from '../../features/debt/screens/DebtScreen';
import { RecurringScreen } from '../../features/recurring/screens/RecurringScreen';
import { ReportsScreen } from '../../features/reports/screens/ReportsScreen';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { typography } from '../theme/spacing';
import { Button } from '../components';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Dashboard: '\u2302',
    Transactions: '\u2194',
    Budget: '\u25A3',
    Analytics: '\u2261',
    Settings: '\u2699',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, { color: focused ? color : undefined }]}>
        {icons[label] || '?'}
      </Text>
      {focused && <View style={[tabStyles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  icon: {
    fontSize: 22,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MainTabs({ navigation }: { navigation: any }) {
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
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        children={() => <DashboardScreen onAddTransaction={() => navigation.navigate('AddTransaction')} />}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        children={() => <TransactionsScreen onAddTransaction={() => navigation.navigate('AddTransaction')} />}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Transactions" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budget"
        children={() => <BudgetScreen onCreateBudget={() => navigation.navigate('CreateBudget')} />}
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
        children={() => (
          <SettingsScreen
            onNavigateSavings={() => navigation.navigate('SavingsGoals')}
            onNavigateDebt={() => navigation.navigate('DebtTracker')}
            onNavigateRecurring={() => navigation.navigate('RecurringTransactions')}
            onNavigateReports={() => navigation.navigate('ReportsHub')}
            onNavigateWallets={() => navigation.navigate('WalletManagement')}
          />
        )}
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
  hasPin,
  loginWithPin,
  loginWithBiometrics,
  createPin,
}: {
  hasPin: boolean;
  loginWithPin: (pin: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  createPin: (pin: string, enableBiometrics: boolean) => Promise<boolean>;
}) {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasPin ? 'EnterPin' : 'CreatePin'}
    >
      <AuthStack.Screen name="CreatePin">
        {() => <CreatePinScreen onComplete={createPin} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="EnterPin">
        {() => (
          <EnterPinScreen
            onPinSubmit={loginWithPin}
            onBiometricLogin={loginWithBiometrics}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={modalStyles.header}>
      <Button title="Close" variant="ghost" size="sm" onPress={onClose} />
      <Text style={[modalStyles.title, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    ...typography.h3,
  },
});

export function AppNavigator() {
  const { colors } = useTheme();
  const {
    isLoading,
    isAuthenticated,
    hasPin,
    loginWithPin,
    loginWithBiometrics,
    createPin,
  } = useAuth();

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
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="AddTransaction"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Add Transaction" onClose={() => navigation.goBack()} />
                  <AddTransactionScreen
                    onSuccess={() => navigation.goBack()}
                    onCancel={() => navigation.goBack()}
                  />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="EditTransaction"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ route, navigation }) => {
                const params = route.params as { transactionId: string } | undefined;
                const transactionId = params?.transactionId;
                if (!transactionId) {
                  navigation.goBack();
                  return null;
                }
                return (
                  <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <ModalHeader title="Edit Transaction" onClose={() => navigation.goBack()} />
                    <AddTransactionScreen
                      transactionId={transactionId}
                      onSuccess={() => navigation.goBack()}
                      onCancel={() => navigation.goBack()}
                    />
                  </View>
                );
              }}
            </RootStack.Screen>
            <RootStack.Screen
              name="TransactionDetail"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            >
              {({ route, navigation }) => {
                const params = route.params as { transactionId: string } | undefined;
                const transactionId = params?.transactionId;
                if (!transactionId) {
                  navigation.goBack();
                  return null;
                }
                return (
                  <TransactionDetailScreen
                    transactionId={transactionId}
                    onClose={() => navigation.goBack()}
                    onEdit={() => {
                      navigation.goBack();
                      navigation.navigate('EditTransaction', { transactionId });
                    }}
                  />
                );
              }}
            </RootStack.Screen>
            <RootStack.Screen
              name="WalletManagement"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Wallets" onClose={() => navigation.goBack()} />
                  <WalletScreen />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="SavingsGoals"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Savings Goals" onClose={() => navigation.goBack()} />
                  <SavingsScreen />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="DebtTracker"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Debt Tracker" onClose={() => navigation.goBack()} />
                  <DebtScreen />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="RecurringTransactions"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Recurring Transactions" onClose={() => navigation.goBack()} />
                  <RecurringScreen />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="ReportsHub"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Reports" onClose={() => navigation.goBack()} />
                  <ReportsScreen />
                </View>
              )}
            </RootStack.Screen>
            <RootStack.Screen
              name="CreateBudget"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <ModalHeader title="Create Budget" onClose={() => navigation.goBack()} />
                  <BudgetScreen onCreateBudget={() => navigation.goBack()} isCreating />
                </View>
              )}
            </RootStack.Screen>
          </>
        ) : (
          <RootStack.Screen name="Auth">
            {() => (
              <AuthNavigator
                hasPin={hasPin}
                loginWithPin={loginWithPin}
                loginWithBiometrics={loginWithBiometrics}
                createPin={createPin}
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
  modalContainer: {
    flex: 1,
  },
});
