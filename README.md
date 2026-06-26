# Offline Finance Manager

A privacy-first, offline personal finance tracking application built with React Native and Expo.

## Features

- **🔒 PIN & Biometric Security** - Protect your financial data with PIN and biometric authentication
- **💰 Transaction Management** - Track income and expenses with categorized entries
- **👛 Multiple Wallets** - Manage multiple accounts and track balances
- **📊 Budget Planning** - Set budgets by category with real-time progress tracking
- **📈 Analytics & Insights** - Visual breakdown of spending patterns and trends
- **🎯 Savings Goals** - Set and track progress towards financial goals
- **📉 Debt Tracker** - Manage debts with payment tracking and interest monitoring
- **🔄 Recurring Transactions** - Automate recurring bills and income
- **🌙 Dark Mode** - Full dark mode support
- **💾 Backup & Restore** - Encrypted local backups with export capability

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation (native stack + bottom tabs)
- **Security**: expo-secure-store, expo-crypto, expo-local-authentication
- **Storage**: expo-file-system, expo-sharing
- **Animations**: react-native-reanimated

## Architecture

```
src/
├── core/           # Infrastructure layer
│   ├── database/   # SQLite connection & schema
│   ├── encryption/ # PIN hashing & secure storage
│   ├── repositories/ # Data access layer
│   ├── storage/    # File system operations
│   └── notifications/ # Local notifications
├── features/       # Feature modules
│   ├── authentication/
│   ├── dashboard/
│   ├── transaction/
│   ├── budget/
│   ├── analytics/
│   ├── wallet/
│   ├── reports/
│   ├── savings/
│   ├── debt/
│   ├── recurring/
│   └── settings/
└── shared/         # Shared resources
    ├── components/ # Reusable UI components
    ├── hooks/      # Custom hooks
    ├── theme/      # Colors, spacing, typography
    ├── types/      # TypeScript type definitions
    └── utils/      # Utility functions
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Type check
npm run typecheck

# Lint
npm run lint
```

## Security

- All sensitive data (PIN, encryption keys) stored in device secure storage
- PIN hashed with SHA-256 and salted with random 16-byte salt
- 100k PBKDF2-like iterations for PIN verification
- Biometric authentication available on supported devices
- Auto-lock on app backgrounding
- All data stored locally - no cloud sync or data collection

## License

Private - All Rights Reserved
