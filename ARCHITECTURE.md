# Architecture

## Overview

The Offline Finance Manager follows a **Feature-First Architecture** with clear separation of concerns:

- **Core Layer** (`src/core/`): Low-level infrastructure (database, encryption, storage, repositories)
- **Feature Layer** (`src/features/`): Business logic and UI for each feature module
- **Shared Layer** (`src/shared/`): Reusable components, hooks, utils, and theme

## Data Flow

```
UI (Screens) → Hooks → Repositories → SQLite Database
                  ↓
              Shared Components (Button, Card, Input, etc.)
```

## Security Architecture

```
Authentication Flow:
App Launch → Check PIN Setup → [No] Create PIN + Biometric Setup
                              → [Yes] Enter PIN / Biometric Auth → App Unlocked

Encryption:
- PIN: SHA-256 hash with 100K iterations + 16-byte random salt
- Keys: expo-secure-store (Keychain/Keystore)
- Biometrics: expo-local-authentication
```

## Database Schema

Seven main tables with proper indexing:
- wallets, categories, transactions, budgets, savings_goals, debts, recurring_transactions

## Navigation Structure

```
RootStack
├── Auth (Stack)
│   ├── CreatePin
│   └── EnterPin
└── Main (Tabs)
    ├── Dashboard
    ├── Transactions
    ├── Budget
    ├── Analytics
    └── Settings
```

## Theme System

- Light and dark color schemes
- System theme detection (useColorScheme)
- Consistent spacing, typography, and border radius
