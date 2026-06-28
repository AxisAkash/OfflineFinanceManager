export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  isRecurring: boolean;
  recurringId?: string;
  notes?: string;
  time?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  budgetId?: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  lender: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  nextDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryBreakdown: { categoryId: string; amount: number; percentage: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}

export interface BackupData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  recurringTransactions: RecurringTransaction[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  isBiometricEnabled: boolean;
  isBackupEnabled: boolean;
  backupIntervalDays: number;
  isPinRequired: boolean;
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  AddTransaction: { walletId?: string } | undefined;
  EditTransaction: { transactionId: string };
  TransactionDetail: { transactionId: string };
  WalletManagement: undefined;
  SavingsGoals: undefined;
  DebtTracker: undefined;
  RecurringTransactions: undefined;
  ReportsHub: undefined;
  CreateBudget: { categoryId?: string } | undefined;
};

export type AuthStackParamList = {
  CreatePin: undefined;
  EnterPin: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budget: undefined;
  Analytics: undefined;
  Settings: undefined;
};
