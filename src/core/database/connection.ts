import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, DATABASE_VERSION, CREATE_TABLES, CREATE_INDEXES } from './schema';
import { runMigrations, getSchemaVersion, setSchemaVersion } from './migrations';
import { validateSchema, formatValidationErrors } from './validation';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  const currentVersion = await getSchemaVersion(database);

  if (currentVersion === 0) {
    await database.execAsync('BEGIN TRANSACTION');
    try {
      await database.execAsync(CREATE_TABLES);
      await database.execAsync(CREATE_INDEXES);
      await setSchemaVersion(database, DATABASE_VERSION);
      await database.execAsync('COMMIT');
    } catch (err) {
      await database.execAsync('ROLLBACK');
      throw err;
    }
  } else {
    await runMigrations(database);
  }

  try {
    await seedDefaultCategories(database);
  } catch (seedErr) {
    // eslint-disable-next-line no-console
    console.warn('[DB] Category seeding failed (non-fatal):', seedErr);
  }

  try {
    const validation = await validateSchema(database);
    if (!validation.isValid) {
      const errorMsg = formatValidationErrors(validation);
      // eslint-disable-next-line no-console
      console.warn(`[DB] Schema validation issues: ${errorMsg}`);
    }
  } catch {
    // Schema validation is non-critical
  }
}

export async function seedDefaultCategories(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const existingCount = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories`
  );

  if (existingCount && existingCount.count > 0) {
    return;
  }

  const defaultCategories = [
    { id: 'cat_income_salary', name: 'Salary', icon: 'briefcase', color: '#4CAF50', type: 'income' },
    { id: 'cat_income_freelance', name: 'Freelance', icon: 'code', color: '#2196F3', type: 'income' },
    { id: 'cat_income_investment', name: 'Investment', icon: 'trending-up', color: '#9C27B0', type: 'income' },
    { id: 'cat_income_gift', name: 'Gift', icon: 'card-giftcard', color: '#E91E63', type: 'income' },
    { id: 'cat_income_other', name: 'Other Income', icon: 'attach-money', color: '#009688', type: 'income' },
    { id: 'cat_expense_food', name: 'Food & Dining', icon: 'restaurant', color: '#FF5722', type: 'expense' },
    { id: 'cat_expense_groceries', name: 'Groceries', icon: 'shopping-cart', color: '#FF9800', type: 'expense' },
    { id: 'cat_expense_transport', name: 'Transportation', icon: 'directions-car', color: '#795548', type: 'expense' },
    { id: 'cat_expense_housing', name: 'Housing', icon: 'home', color: '#607D8B', type: 'expense' },
    { id: 'cat_expense_utilities', name: 'Utilities', icon: 'bolt', color: '#FFC107', type: 'expense' },
    { id: 'cat_expense_healthcare', name: 'Healthcare', icon: 'local-hospital', color: '#F44336', type: 'expense' },
    { id: 'cat_expense_entertainment', name: 'Entertainment', icon: 'movie', color: '#E91E63', type: 'expense' },
    { id: 'cat_expense_shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9C27B0', type: 'expense' },
    { id: 'cat_expense_education', name: 'Education', icon: 'school', color: '#2196F3', type: 'expense' },
    { id: 'cat_expense_insurance', name: 'Insurance', icon: 'security', color: '#3F51B5', type: 'expense' },
    { id: 'cat_expense_subscription', name: 'Subscriptions', icon: 'subscriptions', color: '#00BCD4', type: 'expense' },
    { id: 'cat_expense_personal', name: 'Personal Care', icon: 'face', color: '#E91E63', type: 'expense' },
    { id: 'cat_expense_travel', name: 'Travel', icon: 'flight', color: '#673AB7', type: 'expense' },
    { id: 'cat_expense_other', name: 'Other Expense', icon: 'more-horiz', color: '#78909C', type: 'expense' },
    { id: 'cat_expense_emergency', name: 'Emergency', icon: 'warning', color: '#D32F2F', type: 'expense' },
  ];

  const now = new Date().toISOString();
  for (const cat of defaultCategories) {
    await database.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, now, now]
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function executeTransaction<T>(
  callback: (database: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  return callback(database);
}
