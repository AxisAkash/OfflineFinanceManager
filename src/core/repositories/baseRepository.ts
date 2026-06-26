import { getDatabase } from '../database/connection';
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

export class BaseRepository {
  protected tableName: string;
  protected dbPromise: Promise<SQLiteDatabase>;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dbPromise = getDatabase();
  }

  async findAll<T>(): Promise<T[]> {
    const db = await this.dbPromise;
    const rows = await db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    return rows;
  }

  async findById<T>(id: string): Promise<T | null> {
    const db = await this.dbPromise;
    const row = await db.getFirstAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return row || null;
  }

  async insert<T>(item: T): Promise<void> {
    const db = await this.dbPromise;
    const keys = Object.keys(item as Record<string, unknown>);
    const values: SQLiteBindValue[] = Object.values(item as Record<string, unknown>) as SQLiteBindValue[];
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');

    await db.runAsync(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values
    );
  }

  async update<T>(id: string, updates: Partial<T>): Promise<void> {
    const db = await this.dbPromise;
    const keys = Object.keys(updates as Record<string, unknown>);
    const values: SQLiteBindValue[] = Object.values(updates as Record<string, unknown>) as SQLiteBindValue[];
    const setClause = keys.map((key) => `${key} = ?`).join(', ');

    await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  async count(): Promise<number> {
    const db = await this.dbPromise;
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count || 0;
  }

  async exists(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    const result = await db.getFirstAsync<{ exists: number }>(
      `SELECT 1 as exists FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return !!result;
  }

  async executeSql<T>(sql: string, params?: SQLiteBindValue[]): Promise<T[]> {
    const db = await this.dbPromise;
    const rows = await db.getAllAsync<T>(sql, params || []);
    return rows;
  }

  async executeSqlSingle<T>(sql: string, params?: SQLiteBindValue[]): Promise<T | null> {
    const db = await this.dbPromise;
    const row = await db.getFirstAsync<T>(sql, params || []);
    return row || null;
  }
}
