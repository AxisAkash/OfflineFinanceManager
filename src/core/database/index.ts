export { getDatabase, initializeDatabase, closeDatabase, executeTransaction, seedDefaultCategories } from './connection';
export { DATABASE_NAME, DATABASE_VERSION, CREATE_TABLES, CREATE_INDEXES, EXPECTED_TABLES, TABLE_COLUMNS, EXPECTED_INDEXES } from './schema';
export { runMigrations, getSchemaVersion, setSchemaVersion } from './migrations';
export type { Migration } from './migrations';
export { validateSchema, formatValidationErrors } from './validation';
export type { SchemaValidationResult } from './validation';
