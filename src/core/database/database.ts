import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from './schema';

const GLOBAL_DB_KEY = '__finance_db_instance__';

function getStoredDb(): SQLite.SQLiteDatabase | null {
  return (globalThis as unknown as Record<string, SQLite.SQLiteDatabase | null>)[GLOBAL_DB_KEY] ?? null;
}

function setStoredDb(db: SQLite.SQLiteDatabase | null): void {
  (globalThis as unknown as Record<string, SQLite.SQLiteDatabase | null>)[GLOBAL_DB_KEY] = db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const existing = getStoredDb();
  if (existing) {
    return existing;
  }
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  setStoredDb(db);
  return db;
}

export async function closeDatabase(): Promise<void> {
  const db = getStoredDb();
  if (db) {
    await db.closeAsync();
    setStoredDb(null);
  }
}
