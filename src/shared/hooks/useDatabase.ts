import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../core/database/connection';
import type { SQLiteDatabase } from 'expo-sqlite';

interface UseDatabaseResult {
  database: SQLiteDatabase | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDatabase(): UseDatabaseResult {
  const [database, setDatabase] = useState<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      setDatabase(db);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize database';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return { database, isLoading, error, refresh: init };
}
