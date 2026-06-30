import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_VERSION } from './schema';

export interface Migration {
  version: number;
  name: string;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

async function ensureSettingsTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  );
}

export async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    await ensureSettingsTable(db);
    const result = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM settings WHERE key = 'schema_version'`
    );
    return result ? parseInt(result.value, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setSchemaVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', ?)`,
    [String(version)]
  );
}

export async function logMigration(
  db: SQLiteDatabase,
  version: number,
  name: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [`migration_${version}_status`, success ? 'completed' : `failed: ${errorMessage || 'unknown error'}`]
    );
  } catch {
    // Logging failures should never block the app
  }
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'migration_001_initial_schema',
    description: 'Create initial schema with all core tables (wallets, categories, transactions, budgets, savings_goals, debts, recurring_transactions, settings)',
    up: async (db: SQLiteDatabase) => {
      const createInitial = `
        CREATE TABLE IF NOT EXISTS wallets (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, balance REAL NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'USD', icon TEXT NOT NULL DEFAULT 'wallet',
          color TEXT NOT NULL DEFAULT '#4CAF50', is_archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL DEFAULT 'category',
          color TEXT NOT NULL DEFAULT '#2196F3',
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          budget_id TEXT,
          FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL, category_id TEXT NOT NULL,
          amount REAL NOT NULL, type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          description TEXT NOT NULL DEFAULT '', date TEXT NOT NULL,
          is_recurring INTEGER NOT NULL DEFAULT 0, recurring_id TEXT,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY, category_id TEXT NOT NULL, amount REAL NOT NULL,
          spent REAL NOT NULL DEFAULT 0,
          period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
          start_date TEXT NOT NULL, end_date TEXT NOT NULL,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, target_amount REAL NOT NULL,
          current_amount REAL NOT NULL DEFAULT 0, deadline TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT 'savings', color TEXT NOT NULL DEFAULT '#FF9800',
          is_completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS debts (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, total_amount REAL NOT NULL,
          remaining_amount REAL NOT NULL, interest_rate REAL NOT NULL DEFAULT 0,
          minimum_payment REAL NOT NULL DEFAULT 0, due_date TEXT NOT NULL,
          lender TEXT NOT NULL DEFAULT '', is_paid INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recurring_transactions (
          id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL, category_id TEXT NOT NULL,
          amount REAL NOT NULL, type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          description TEXT NOT NULL DEFAULT '',
          frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
          interval INTEGER NOT NULL DEFAULT 1, next_date TEXT NOT NULL, end_date TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
        CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
        CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date);
        CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_id);
      `;
      await db.execAsync(createInitial);
    },
  },
  {
    version: 2,
    name: 'migration_002_add_missing_columns_and_tables',
    description: 'Add created_at/updated_at to categories, add recurring_rules/transaction_versions/sync_queue tables',
    up: async (db: SQLiteDatabase) => {
      const pragmaResult = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('categories') WHERE name = 'created_at'`
      );
      if (pragmaResult.length === 0) {
        await db.execAsync(
          `ALTER TABLE categories ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`
        );
      }
      const pragmaResult2 = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('categories') WHERE name = 'updated_at'`
      );
      if (pragmaResult2.length === 0) {
        await db.execAsync(
          `ALTER TABLE categories ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`
        );
      }
      const tablesExist = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('recurring_rules', 'transaction_versions', 'sync_queue')`
      );
      const existingNames = tablesExist.map((r) => r.name);
      if (!existingNames.includes('recurring_rules')) {
        await db.execAsync(`
          CREATE TABLE recurring_rules (
            id TEXT PRIMARY KEY, template_transaction_id TEXT,
            frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
            interval_value INTEGER NOT NULL DEFAULT 1, day_of_month INTEGER,
            day_of_week INTEGER, month_of_year INTEGER, start_date TEXT NOT NULL, end_date TEXT,
            max_occurrences INTEGER, occurrence_count INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            FOREIGN KEY (template_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
          );
        `);
      }
      if (!existingNames.includes('transaction_versions')) {
        await db.execAsync(`
          CREATE TABLE transaction_versions (
            id TEXT PRIMARY KEY, transaction_id TEXT NOT NULL,
            version_number INTEGER NOT NULL, wallet_id TEXT, category_id TEXT,
            amount REAL, type TEXT, description TEXT, date TEXT,
            is_recurring INTEGER, recurring_id TEXT,
            change_type TEXT NOT NULL CHECK(change_type IN ('created', 'updated', 'deleted', 'restored')),
            changed_by TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
          );
        `);
      }
      if (!existingNames.includes('sync_queue')) {
        await db.execAsync(`
          CREATE TABLE sync_queue (
            id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
            operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
            payload TEXT, status TEXT NOT NULL DEFAULT 'pending'
            CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
            retry_count INTEGER NOT NULL DEFAULT 0, max_retries INTEGER NOT NULL DEFAULT 3,
            error_message TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
          );
        `);
      }
      const idxPragma = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_categories_type', 'idx_recurring_rules_active', 'idx_transaction_versions_txn', 'idx_sync_queue_status')`
      );
      const existingIdx = idxPragma.map((r) => r.name);
      if (!existingIdx.includes('idx_categories_type')) {
        await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);`);
      }
      if (!existingIdx.includes('idx_recurring_rules_active')) {
        await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON recurring_rules(is_active);`);
      }
      if (!existingIdx.includes('idx_transaction_versions_txn')) {
        await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transaction_versions_txn ON transaction_versions(transaction_id);`);
      }
      if (!existingIdx.includes('idx_sync_queue_status')) {
        await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);`);
      }
    },
  },
  {
    version: 3,
    name: 'migration_003_add_notes_time_to_transactions',
    description: 'Add notes and time columns to transactions table',
    up: async (db: SQLiteDatabase) => {
      const cols = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('transactions') WHERE name = 'notes'`
      );
      if (cols.length === 0) {
        await db.execAsync(`ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT '';`);
      }
      const timeCols = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM pragma_table_info('transactions') WHERE name = 'time'`
      );
      if (timeCols.length === 0) {
        await db.execAsync(`ALTER TABLE transactions ADD COLUMN time TEXT DEFAULT '';`);
      }
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(db);

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion && m.version <= DATABASE_VERSION);

  for (const migration of pending) {
    await db.runAsync('BEGIN TRANSACTION');
    try {
      await migration.up(db);
      await setSchemaVersion(db, migration.version);
      await logMigration(db, migration.version, migration.name, true);
      await db.runAsync('COMMIT');
    } catch (err) {
      await db.runAsync('ROLLBACK');
      const message = err instanceof Error ? err.message : String(err);
      await logMigration(db, migration.version, migration.name, false, message);
      throw new Error(
        `Migration v${migration.version} ("${migration.name}") failed: ${message}`
      );
    }
  }
}
