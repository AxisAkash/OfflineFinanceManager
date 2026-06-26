# Database Documentation

## Overview

Uses SQLite via expo-sqlite with 7 tables and proper indexing for performance.

## Tables

### wallets
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| name | TEXT | Wallet name |
| balance | REAL | Current balance |
| currency | TEXT | Currency code (e.g., USD) |
| icon | TEXT | Icon identifier |
| color | TEXT | Hex color |
| is_archived | INTEGER | Soft delete flag |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### categories
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| name | TEXT | Category name |
| icon | TEXT | Icon identifier |
| color | TEXT | Hex color |
| type | TEXT | 'income' or 'expense' |
| budget_id | TEXT FK | Optional budget reference |

### transactions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| wallet_id | TEXT FK | Source wallet |
| category_id | TEXT FK | Transaction category |
| amount | REAL | Transaction amount |
| type | TEXT | 'income' or 'expense' |
| description | TEXT | User description |
| date | TEXT | Transaction date |
| is_recurring | INTEGER | Recurring flag |
| recurring_id | TEXT | Recurring template ref |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### budgets, savings_goals, debts, recurring_transactions
Similar structure with appropriate columns for each domain.

## Indexes

- idx_transactions_date, wallet, category, type
- idx_budgets_category, period
- idx_recurring_next_date
- idx_transactions_recurring

## Performance

- All queries use indexed columns
- Batch writes for bulk operations
- Prepared statements via SQLite API
