import type { SQLiteDatabase } from 'expo-sqlite';
import { EXPECTED_TABLES, TABLE_COLUMNS, EXPECTED_INDEXES } from './schema';

export interface SchemaValidationResult {
  isValid: boolean;
  missingTables: string[];
  missingColumns: Record<string, string[]>;
  missingIndexes: string[];
  errors: string[];
}

export async function validateSchema(
  db: SQLiteDatabase
): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    isValid: true,
    missingTables: [],
    missingColumns: {},
    missingIndexes: [],
    errors: [],
  };

  const tableRows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
  );
  const existingTables = new Set(tableRows.map((r) => r.name));

  for (const table of EXPECTED_TABLES) {
    if (!existingTables.has(table)) {
      result.missingTables.push(table);
      result.isValid = false;
      continue;
    }

    const columnRows = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM pragma_table_info(?)`,
      [table]
    );
    const existingColumns = new Set(columnRows.map((r) => r.name));
    const expectedCols = TABLE_COLUMNS[table];

    if (expectedCols) {
      const missing = expectedCols.filter((col) => !existingColumns.has(col));
      if (missing.length > 0) {
        result.missingColumns[table] = missing;
        result.isValid = false;
      }
    }
  }

  const indexRows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`
  );
  const existingIndexes = new Set(indexRows.map((r) => r.name));

  for (const index of EXPECTED_INDEXES) {
    if (!existingIndexes.has(index)) {
      result.missingIndexes.push(index);
      result.isValid = false;
    }
  }

  if (!existingTables.has('settings') && !result.missingTables.includes('settings')) {
    result.missingTables.push('settings');
    result.isValid = false;
  }

  return result;
}

export function formatValidationErrors(result: SchemaValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    return '';
  }

  if (result.missingTables.length > 0) {
    lines.push(`Missing tables: ${result.missingTables.join(', ')}`);
  }

  for (const [table, columns] of Object.entries(result.missingColumns)) {
    lines.push(`Table "${table}" missing columns: ${columns.join(', ')}`);
  }

  if (result.missingIndexes.length > 0) {
    lines.push(`Missing indexes: ${result.missingIndexes.join(', ')}`);
  }

  return lines.join('; ');
}
