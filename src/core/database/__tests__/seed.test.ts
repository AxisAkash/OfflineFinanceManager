import type { SQLiteDatabase } from 'expo-sqlite';
import { seedDefaultCategories } from '../connection';

jest.mock('expo-sqlite');

describe('Seed Data', () => {
  const createMockDb = () => {
    const categories: Record<string, unknown>[] = [];
    const db = {
      getFirstAsync: jest.fn().mockImplementation(async (_sql: string) => {
        return { count: categories.length };
      }),
      runAsync: jest.fn().mockImplementation(async (_sql: string, _params: unknown[]) => {
        categories.push({});
      }),
    };
    return { db, getCategories: () => categories };
  };

  it('should insert 20 default categories when none exist', async () => {
    const { db } = createMockDb();
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    expect(db.runAsync).toHaveBeenCalledTimes(20);
  });

  it('should not insert categories if some already exist', async () => {
    const db = {
      getFirstAsync: jest.fn().mockResolvedValue({ count: 5 }),
      runAsync: jest.fn(),
    };
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('should include created_at and updated_at in each insert', async () => {
    const { db } = createMockDb();
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    const calls = (db.runAsync as jest.Mock).mock.calls;
    for (const call of calls) {
      const sql = call[0] as string;
      expect(sql).toContain('created_at');
      expect(sql).toContain('updated_at');
      const params = call[1] as unknown[];
      expect(params.length).toBe(7);
    }
  });

  it('should use INSERT OR IGNORE to prevent duplicates', async () => {
    const { db } = createMockDb();
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    const sql = (db.runAsync as jest.Mock).mock.calls[0][0] as string;
    expect(sql).toContain('INSERT OR IGNORE');
  });

  it('should include income categories', async () => {
    const { db } = createMockDb();
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    const calls = (db.runAsync as jest.Mock).mock.calls;
    const incomeCount = calls.filter((c: unknown[]) => (c[1] as unknown[])[4] === 'income').length;
    expect(incomeCount).toBe(5);
  });

  it('should include expense categories', async () => {
    const { db } = createMockDb();
    await seedDefaultCategories(db as unknown as SQLiteDatabase);
    const calls = (db.runAsync as jest.Mock).mock.calls;
    const expenseCount = calls.filter((c: unknown[]) => (c[1] as unknown[])[4] === 'expense').length;
    expect(expenseCount).toBe(15);
  });
});
