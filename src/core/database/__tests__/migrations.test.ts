import type { SQLiteDatabase } from 'expo-sqlite';
import { getSchemaVersion, setSchemaVersion, runMigrations } from '../migrations';
import { DATABASE_VERSION } from '../schema';

jest.mock('expo-sqlite');

type MockDb = {
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  getAllAsync: jest.Mock;
  execAsync: jest.Mock;
};

function createMockDb() {
  const store: Record<string, string> = {};
  return {
    db: {
      runAsync: jest.fn().mockImplementation(async (_sql: string, params?: unknown[]) => {
        store['schema_version'] = String(params?.[0] ?? '');
      }),
      getFirstAsync: jest.fn().mockImplementation(async (sql: string, _params?: unknown[]) => {
        if (sql.includes("key = 'schema_version'")) {
          return store['schema_version'] ? { value: store['schema_version'] } : null;
        }
        return null;
      }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      execAsync: jest.fn().mockResolvedValue(undefined),
    } satisfies MockDb,
    store,
  };
}

describe('Migration System', () => {
  it('should return version 0 when no schema_version exists', async () => {
    const { db } = createMockDb();
    const version = await getSchemaVersion(db as unknown as SQLiteDatabase);
    expect(version).toBe(0);
  });

  it('should set and get schema version correctly', async () => {
    const { db } = createMockDb();
    await setSchemaVersion(db as unknown as SQLiteDatabase, 2);
    const version = await getSchemaVersion(db as unknown as SQLiteDatabase);
    expect(version).toBe(2);
  });

  it('should skip migrations if already at target version', async () => {
    const { db, store } = createMockDb();
    store['schema_version'] = String(DATABASE_VERSION);
    const runSpy = jest.spyOn(db, 'runAsync');
    await runMigrations(db as unknown as SQLiteDatabase);
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('should not throw when schema version matches', async () => {
    const { db, store } = createMockDb();
    store['schema_version'] = String(DATABASE_VERSION);
    await expect(runMigrations(db as unknown as SQLiteDatabase)).resolves.not.toThrow();
  });

  it('should throw on migration failure', async () => {
    const { db } = createMockDb();
    db.execAsync = jest.fn().mockRejectedValue(new Error('Migration failed'));
    await expect(runMigrations(db as unknown as SQLiteDatabase)).rejects.toThrow();
  });
});
