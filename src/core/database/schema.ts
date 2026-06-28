export const DATABASE_NAME = 'finance.db';
export const DATABASE_VERSION = 2;

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    icon TEXT NOT NULL DEFAULT 'wallet',
    color TEXT NOT NULL DEFAULT '#4CAF50',
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'category',
    color TEXT NOT NULL DEFAULT '#2196F3',
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    budget_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    description TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    spent REAL NOT NULL DEFAULT 0,
    period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'savings',
    color TEXT NOT NULL DEFAULT '#FF9800',
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    interest_rate REAL NOT NULL DEFAULT 0,
    minimum_payment REAL NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    lender TEXT NOT NULL DEFAULT '',
    is_paid INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    description TEXT NOT NULL DEFAULT '',
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval INTEGER NOT NULL DEFAULT 1,
    next_date TEXT NOT NULL,
    end_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS recurring_rules (
    id TEXT PRIMARY KEY,
    template_transaction_id TEXT,
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval_value INTEGER NOT NULL DEFAULT 1,
    day_of_month INTEGER,
    day_of_week INTEGER,
    month_of_year INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT,
    max_occurrences INTEGER,
    occurrence_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (template_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS transaction_versions (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    wallet_id TEXT,
    category_id TEXT,
    amount REAL,
    type TEXT,
    description TEXT,
    date TEXT,
    is_recurring INTEGER,
    recurring_id TEXT,
    change_type TEXT NOT NULL CHECK(change_type IN ('created', 'updated', 'deleted', 'restored')),
    changed_by TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
  CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date);
  CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_id);
  CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON recurring_rules(is_active);
  CREATE INDEX IF NOT EXISTS idx_transaction_versions_txn ON transaction_versions(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
`;

export const DROP_TABLES = `
  DROP TABLE IF EXISTS transaction_versions;
  DROP TABLE IF EXISTS sync_queue;
  DROP TABLE IF EXISTS recurring_rules;
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS budgets;
  DROP TABLE IF EXISTS recurring_transactions;
  DROP TABLE IF EXISTS savings_goals;
  DROP TABLE IF EXISTS debts;
  DROP TABLE IF EXISTS categories;
  DROP TABLE IF EXISTS wallets;
  DROP TABLE IF EXISTS settings;
`;

export const EXPECTED_TABLES = [
  'wallets',
  'categories',
  'transactions',
  'budgets',
  'savings_goals',
  'debts',
  'recurring_transactions',
  'recurring_rules',
  'transaction_versions',
  'sync_queue',
  'settings',
];

export const TABLE_COLUMNS: Record<string, string[]> = {
  wallets: ['id', 'name', 'balance', 'currency', 'icon', 'color', 'is_archived', 'created_at', 'updated_at'],
  categories: ['id', 'name', 'icon', 'color', 'type', 'budget_id', 'created_at', 'updated_at'],
  transactions: ['id', 'wallet_id', 'category_id', 'amount', 'type', 'description', 'date', 'is_recurring', 'recurring_id', 'created_at', 'updated_at'],
  budgets: ['id', 'category_id', 'amount', 'spent', 'period', 'start_date', 'end_date', 'created_at', 'updated_at'],
  savings_goals: ['id', 'name', 'target_amount', 'current_amount', 'deadline', 'icon', 'color', 'is_completed', 'created_at', 'updated_at'],
  debts: ['id', 'name', 'total_amount', 'remaining_amount', 'interest_rate', 'minimum_payment', 'due_date', 'lender', 'is_paid', 'created_at', 'updated_at'],
  recurring_transactions: ['id', 'wallet_id', 'category_id', 'amount', 'type', 'description', 'frequency', 'interval', 'next_date', 'end_date', 'is_active', 'created_at', 'updated_at'],
  recurring_rules: ['id', 'template_transaction_id', 'frequency', 'interval_value', 'day_of_month', 'day_of_week', 'month_of_year', 'start_date', 'end_date', 'max_occurrences', 'occurrence_count', 'is_active', 'created_at', 'updated_at'],
  transaction_versions: ['id', 'transaction_id', 'version_number', 'wallet_id', 'category_id', 'amount', 'type', 'description', 'date', 'is_recurring', 'recurring_id', 'change_type', 'changed_by', 'created_at'],
  sync_queue: ['id', 'entity_type', 'entity_id', 'operation', 'payload', 'status', 'retry_count', 'max_retries', 'error_message', 'created_at', 'updated_at'],
  settings: ['key', 'value'],
};

export const EXPECTED_INDEXES = [
  'idx_transactions_date',
  'idx_transactions_wallet',
  'idx_transactions_category',
  'idx_transactions_type',
  'idx_budgets_category',
  'idx_budgets_period',
  'idx_recurring_next_date',
  'idx_transactions_recurring',
  'idx_recurring_rules_active',
  'idx_transaction_versions_txn',
  'idx_sync_queue_status',
  'idx_categories_type',
];
