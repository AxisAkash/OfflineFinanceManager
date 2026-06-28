class MockSQLiteDatabase {
  private tables: Record<string, Record<string, unknown>[]> = {};
  private schema: Record<string, string[]> = {};

  async execAsync(sql: string): Promise<void> {
    // Parse CREATE TABLE and TRACK schema
    const createMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    if (createMatch) {
      this.schema[createMatch[1]] = [];
    }
  }

  async runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const insertMatch = sql.match(/INSERT (?:OR IGNORE )?INTO (\w+)/);
    if (insertMatch) {
      const table = insertMatch[1];
      if (!this.tables[table]) this.tables[table] = [];
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const countMatch = sql.match(/SELECT COUNT\(\*\) as count FROM (\w+)/);
    if (countMatch) {
      const table = countMatch[1];
      const count = (this.tables[table] || []).length;
      return { count } as unknown as T;
    }
    const valueMatch = sql.match(/SELECT value FROM settings WHERE key = '(.+?)'/);
    if (valueMatch) {
      return null;
    }
    return null;
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const pragmaMatch = sql.match(/SELECT name FROM pragma_table_info\('(\w+)'\)/);
    if (pragmaMatch) {
      const table = pragmaMatch[1];
      const columns = this.schema[table] || [];
      return columns.map((name) => ({ name })) as unknown as T[];
    }
    const masterMatch = sql.match(/SELECT name FROM sqlite_master/);
    if (masterMatch) {
      return Object.keys(this.schema).map((name) => ({ name })) as unknown as T[];
    }
    return [];
  }

  async closeAsync(): Promise<void> {
    this.tables = {};
    this.schema = {};
  }
}

export function openDatabaseAsync(): Promise<MockSQLiteDatabase> {
  return Promise.resolve(new MockSQLiteDatabase());
}

export const SQLiteDatabase = MockSQLiteDatabase;
export type SQLiteBindValue = string | number | null | Uint8Array;
