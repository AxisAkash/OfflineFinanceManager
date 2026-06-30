const DB_NAME = 'offline_finance_db';
const SETTINGS_STORE = '_settings';
const SCHEMA_STORE = '_schema_meta';

const KNOWN_TABLES: Record<string, string> = {
  wallets: 'id',
  categories: 'id',
  transactions: 'id',
  budgets: 'id',
  savings_goals: 'id',
  debts: 'id',
  recurring_transactions: 'id',
  recurring_rules: 'id',
  transaction_versions: 'id',
  sync_queue: 'id',
  settings: 'key',
};

interface ColumnDef {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  default?: unknown;
}

interface CreateTableDef {
  name: string;
  columns: ColumnDef[];
}

function createAllStores(db: IDBDatabase): void {
  for (const [tableName, keyPath] of Object.entries(KNOWN_TABLES)) {
    if (!db.objectStoreNames.contains(tableName)) {
      db.createObjectStore(tableName, { keyPath });
    }
  }
  if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains(SCHEMA_STORE)) {
    db.createObjectStore(SCHEMA_STORE, { keyPath: 'tableName' });
  }
}

function openDb(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, version);
    req.onupgradeneeded = () => {
      createAllStores(req.result);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function ensureDb(): Promise<IDBDatabase> {
  const existingReq = indexedDB.open(DB_NAME);
  const existingVersion = await new Promise<number>((resolve, reject) => {
    existingReq.onsuccess = () => {
      const db = existingReq.result;
      const v = db.version;
      db.close();
      resolve(v);
    };
    existingReq.onerror = () => reject(existingReq.error);
  });

  const storeDb = await openDb(existingVersion);
  const missing = Object.keys(KNOWN_TABLES).filter(
    name => !storeDb.objectStoreNames.contains(name)
  );
  if (!storeDb.objectStoreNames.contains(SETTINGS_STORE)) missing.push(SETTINGS_STORE);
  if (!storeDb.objectStoreNames.contains(SCHEMA_STORE)) missing.push(SCHEMA_STORE);

  if (missing.length === 0) return storeDb;

  storeDb.close();
  const upgradeDb = await openDb(existingVersion + missing.length);
  return upgradeDb;
}

async function createObjectStore(tableName: string, keyPath: string): Promise<void> {
  const existingReq = indexedDB.open(DB_NAME);
  const currentVersion = await new Promise<number>((resolve, reject) => {
    existingReq.onsuccess = () => {
      const db = existingReq.result;
      const v = db.version;
      db.close();
      resolve(v);
    };
    existingReq.onerror = () => reject(existingReq.error);
  });
  const req = indexedDB.open(DB_NAME, currentVersion + 1);
  await new Promise<void>((resolve, reject) => {
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(tableName)) {
        req.result.createObjectStore(tableName, { keyPath });
      }
    };
    req.onsuccess = () => { req.result.close(); resolve(); };
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function putInStore(store: IDBObjectStore, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function deleteFromStore(store: IDBObjectStore, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set',
  'delete', 'create', 'table', 'index', 'if', 'not', 'exists', 'primary',
  'key', 'foreign', 'references', 'on', 'cascade', 'set', 'null', 'default',
  'unique', 'check', 'constraint', 'alter', 'add', 'column', 'order', 'by',
  'group', 'having', 'limit', 'offset', 'asc', 'desc', 'and', 'or', 'in',
  'like', 'between', 'is', 'count', 'sum', 'avg', 'min', 'max', 'coalesce',
  'cast', 'as', 'integer', 'text', 'real', 'blob', 'numeric', 'begin',
  'commit', 'rollback', 'transaction', 'pragma', 'journal_mode', 'wal',
  'foreign_keys', 'delete', 'restrict', 'drop', 'indexed', 'date',
  'datetime', 'strftime', 'replace', 'ignore', 'desc', 'asc',
]);

function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === ' ' || sql[i] === '\n' || sql[i] === '\t' || sql[i] === '\r') {
      i++;
      continue;
    }
    if (sql[i] === ',' || sql[i] === '(' || sql[i] === ')' || sql[i] === ';') {
      tokens.push(sql[i]);
      i++;
      continue;
    }
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== "'") {
        if (sql[j] === '\\') j++;
        j++;
      }
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (sql[i] === '"' || sql[i] === '`') {
      const quote = sql[i];
      let j = i + 1;
      while (j < sql.length && sql[j] !== quote) j++;
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < sql.length && !' ,()\n\t\r;'.includes(sql[j])) j++;
    tokens.push(sql.slice(i, j));
    i = j;
  }
  return tokens;
}

function normalizeToken(t: string): string {
  const unquoted = t.replace(/^["'`]|["'`]$/g, '');
  const lower = unquoted.toLowerCase();
  return SQL_KEYWORDS.has(lower) ? lower : unquoted;
}

function cleanIdentifier(t: string): string {
  return t.replace(/^["'`]|["'`]$/g, '');
}

function stripQuotes(val: string): string {
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith('`') && val.endsWith('`'))) {
    return val.slice(1, -1);
  }
  return val;
}

function coerceValue(val: string, colType?: string): unknown {
  const cleaned = stripQuotes(val);
  if (cleaned.toLowerCase() === 'null') return null;
  if (cleaned.toLowerCase() === 'true') return true;
  if (cleaned.toLowerCase() === 'false') return false;
  if (colType === 'integer' || colType === 'int' || colType === 'numeric') {
    const n = Number(cleaned);
    if (!isNaN(n)) return n;
  }
  if (colType === 'real' || colType === 'float' || colType === 'double') {
    const n = Number(cleaned);
    if (!isNaN(n)) return n;
  }
  return cleaned;
}

function resolveParam(sql: string, params: unknown[]): string {
  let idx = 0;
  return sql.replace(/\?/g, () => {
    const p = params[idx++];
    if (p === null || p === undefined) return 'NULL';
    if (typeof p === 'number') return String(p);
    if (typeof p === 'boolean') return p ? '1' : '0';
    return `'${String(p).replace(/'/g, "''")}'`;
  });
}

export class WebDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private tables = new Map<string, CreateTableDef>();
  private pragmas = new Map<string, string>();

  static async create(): Promise<WebDatabase> {
    const instance = new WebDatabase();
    instance.dbPromise = ensureDb();
    instance.pragmas.set('journal_mode', 'memory');
    instance.pragmas.set('foreign_keys', 'on');
    await instance.dbPromise;
    return instance;
  }

  private async withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    const db = await this.dbPromise!;
    return fn(db);
  }

  async execAsync(sql: string): Promise<void> {
    const resolvedSql = sql.replace(/--[^\n]*/g, '').trim();
    if (!resolvedSql) return;

    const statements = resolvedSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await this.execSingle(stmt);
    }
  }

  private async execSingle(sql: string): Promise<void> {
    const tokens = tokenize(sql);
    if (tokens.length === 0) return;
    const first = normalizeToken(tokens[0]);

    if (first === 'create') return this.execCreate(tokens);
    if (first === 'alter') return this.execAlter(tokens);
    if (first === 'drop') return; // no-op for web
    if (first === 'pragma') return this.execPragma(tokens);
    if (first === 'begin') return;
    if (first === 'commit') return;
    if (first === 'rollback') return;
    if (first === 'select') return; // handled by getFirstAsync/getAllAsync
    if (first === 'insert' || first === 'update' || first === 'delete') return; // handled by runAsync

    throw new Error(`Unsupported SQL: ${sql}`);
  }

  async runAsync(
    sql: string,
    params?: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const resolved = params ? resolveParam(sql, params) : sql;
    const tokens = tokenize(resolved);
    const first = normalizeToken(tokens[0]);

    if (first === 'insert') return this.execInsert(tokens);
    if (first === 'update') return this.execUpdate(tokens);
    if (first === 'delete') return this.execDelete(tokens);
    if (first === 'create' || first === 'alter' || first === 'drop' || first === 'pragma' ||
        first === 'begin' || first === 'commit' || first === 'rollback' ||
        first === 'select') {
      await this.execSingle(resolved);
      return { lastInsertRowId: 0, changes: 0 };
    }

    throw new Error(`Unsupported statement: ${sql}`);
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const resolved = params ? resolveParam(sql, params) : sql;
    const all = await this.getAllAsync<T>(resolved);
    return all.length > 0 ? all[0] : null;
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const resolved = params ? resolveParam(sql, params) : sql;
    const tokens = tokenize(resolved);

    if (tokens.length < 2 || normalizeToken(tokens[0]) !== 'select') {
      await this.execSingle(resolved);
      return [];
    }

    return await this.execSelect<T>(tokens);
  }

  async closeAsync(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }

  // --- Schema Management ---

  private async execCreate(tokens: string[]): Promise<void> {
    const type = normalizeToken(tokens[1]);

    if (type === 'table' || type === 'temp' || type === 'temporary') {
      return this.createTable(tokens);
    }
    if (type === 'index') {
      return;
    }
    if (type === 'unique') {
      return;
    }
  }

  private async createTable(tokens: string[]): Promise<void> {
    let idx = 2;
    let ifNotExists = false;
    if (normalizeToken(tokens[2]) === 'if') {
      ifNotExists = true;
      idx = 5;
    }

    const tableName = cleanIdentifier(tokens[idx]);
    if (ifNotExists && this.tables.has(tableName)) return;

    const def: CreateTableDef = { name: tableName, columns: [] };
    idx++;
    if (tokens[idx] !== '(') throw new Error('Expected ( after table name');
    idx++;

    while (idx < tokens.length && tokens[idx] !== ')') {
      if (tokens[idx] === ',') { idx++; continue; }
      if (normalizeToken(tokens[idx]) === 'primary' ||
          normalizeToken(tokens[idx]) === 'foreign' ||
          normalizeToken(tokens[idx]) === 'unique' ||
          normalizeToken(tokens[idx]) === 'constraint' ||
          normalizeToken(tokens[idx]) === 'check') {
        while (idx < tokens.length && tokens[idx] !== ',' && tokens[idx] !== ')') idx++;
        if (tokens[idx] === ',') idx++;
        continue;
      }

      const colName = cleanIdentifier(tokens[idx]); idx++;
      const colType = normalizeToken(tokens[idx]);
      const isInt = colType === 'integer' || colType === 'int';
      const isText = colType === 'text' || colType === 'varchar' || colType === 'character varying';
      const isReal = colType === 'real' || colType === 'float' || colType === 'double' || colType === 'numeric';
      if (isInt || isText || isReal) idx++;

      let primaryKey = false;
      let notNull = false;
      let defaultValue: unknown = undefined;

      while (idx < tokens.length && tokens[idx] !== ',' && tokens[idx] !== ')') {
        const kw = normalizeToken(tokens[idx]);
        if (kw === 'primary' && normalizeToken(tokens[idx + 1]) === 'key') {
          primaryKey = true;
          idx += 2;
        } else if (kw === 'not' && normalizeToken(tokens[idx + 1]) === 'null') {
          notNull = true;
          idx += 2;
        } else if (kw === 'default') {
          idx++;
          if (normalizeToken(tokens[idx]) === 'current_timestamp' ||
              normalizeToken(tokens[idx]).startsWith('datetime(')) {
            defaultValue = new Date().toISOString();
            idx++;
          } else {
            defaultValue = coerceValue(tokens[idx], isInt ? 'integer' : isText ? 'text' : 'real');
            idx++;
          }
        } else if (kw === 'references' || kw === 'on' || kw === 'foreign') {
          break;
        } else {
          idx++;
        }
      }

      def.columns.push({ name: colName, type: colType, primaryKey, notNull, default: defaultValue });
      if (tokens[idx] === ',') idx++;
    }

    this.tables.set(tableName, def);

    const keyPath = def.columns.find(c => c.primaryKey)?.name || 'id';
    await this.withDb(async (db) => {
      if (!db.objectStoreNames.contains(tableName)) {
        db.close();
        await createObjectStore(tableName, keyPath);
        this.dbPromise = ensureDb();
        await this.dbPromise;
      }
    });
  }

  private async execAlter(tokens: string[]): Promise<void> {
    if (normalizeToken(tokens[1]) !== 'table') return;
    const tableName = cleanIdentifier(tokens[2]);
    const action = normalizeToken(tokens[3]);
    if (action === 'add' && normalizeToken(tokens[4]) === 'column') {
      const colName = cleanIdentifier(tokens[5]);
      const colType = normalizeToken(tokens[6]);
      const def = this.tables.get(tableName);
      if (def) {
        def.columns.push({ name: colName, type: colType });
      }
    }
    if (action === 'rename') {
      const newName = cleanIdentifier(tokens[5]);
      const def = this.tables.get(tableName);
      if (def) {
        def.name = newName;
        this.tables.set(newName, def);
        this.tables.delete(tableName);
      }
    }
  }

  private async execPragma(tokens: string[]): Promise<void> {
    const key = normalizeToken(tokens[1]);
    if (tokens.length > 2 && tokens[2] === '=') {
      this.pragmas.set(key, stripQuotes(tokens[3]).toLowerCase());
    }
  }

  // --- Query Execution ---

  private async execInsert(tokens: string[]): Promise<{ lastInsertRowId: number; changes: number }> {
    let idx = 1;
    if (normalizeToken(tokens[1]) === 'or') {
      idx = 3;
    }
    if (normalizeToken(tokens[idx]) === 'into') {
      idx++;
    }
    const tableName = cleanIdentifier(tokens[idx]); idx++;

    idx++;
    const columns: string[] = [];
    while (idx < tokens.length && tokens[idx] !== '(') idx++;
    if (tokens[idx] === '(') {
      idx++;
      while (idx < tokens.length && tokens[idx] !== ')') {
        if (tokens[idx] !== ',') {
          columns.push(cleanIdentifier(tokens[idx]));
        }
        idx++;
      }
      idx++;
    }

    while (idx < tokens.length && normalizeToken(tokens[idx]) !== 'values') idx++;
    idx++;

    const rows: Record<string, unknown>[] = [];
    while (idx < tokens.length) {
      if (tokens[idx] === '(') idx++;
      const values: unknown[] = [];
      while (idx < tokens.length && tokens[idx] !== ')') {
        if (tokens[idx] !== ',') {
          values.push(coerceValue(tokens[idx]));
        }
        idx++;
      }
      if (tokens[idx] === ')') idx++;

      const row: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        row[col] = values[i] ?? null;
      });
      rows.push(row);

      if (tokens[idx] === ',') { idx++; continue; }
      break;
    }

    return await this.withDb(async (db) => {
      const store = db.transaction(tableName, 'readwrite').objectStore(tableName);
      let lastId = 0;
      for (const row of rows) {
        const id = row[store.keyPath as string] as string | undefined;
        const key = id || crypto.randomUUID();
        if (!id) row[store.keyPath as string] = key;
        await putInStore(store, row);
        lastId++;
      }
      return { lastInsertRowId: lastId, changes: rows.length };
    });
  }

  private async execUpdate(tokens: string[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const tableName = cleanIdentifier(tokens[1]);
    let idx = 2;
    if (normalizeToken(tokens[2]) !== 'set') return { lastInsertRowId: 0, changes: 0 };
    idx++;

    const updates: Record<string, unknown> = {};
    while (idx < tokens.length && normalizeToken(tokens[idx]) !== 'where') {
      const col = cleanIdentifier(tokens[idx]); idx++;
      if (tokens[idx] === '=') idx++;
      updates[col] = coerceValue(tokens[idx]); idx++;
      if (tokens[idx] === ',') idx++;
    }

    const whereClauses: { col: string; op: string; val: unknown }[] = [];
    if (idx < tokens.length && normalizeToken(tokens[idx]) === 'where') {
      idx++;
      while (idx < tokens.length && tokens[idx] !== ';') {
        const col = cleanIdentifier(tokens[idx]); idx++;
        const op = tokens[idx]; idx++;
        if (op === '=' || op === '>' || op === '<' || op === '>=' || op === '<=' || op === '!=') {
          whereClauses.push({ col, op, val: coerceValue(tokens[idx]) }); idx++;
        } else if (normalizeToken(op) === 'in') {
          idx++;
          while (idx < tokens.length && tokens[idx] !== ')') idx++;
          idx++;
        } else if (normalizeToken(op) === 'like') {
          whereClauses.push({ col, op: 'LIKE', val: stripQuotes(tokens[idx]) }); idx++;
        }
        if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
      }
    }

    return await this.withDb(async (db) => {
      const store = db.transaction(tableName, 'readwrite').objectStore(tableName);
      const all = await getAllFromStore<Record<string, unknown>>(store);
      let changes = 0;
      for (const row of all) {
        if (matchesWhere(row, whereClauses)) {
          Object.assign(row, updates);
          await putInStore(store, row);
          changes++;
        }
      }
      return { lastInsertRowId: 0, changes };
    });
  }

  private async execDelete(tokens: string[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const tableName = cleanIdentifier(tokens[2]);

    const whereClauses: { col: string; op: string; val: unknown }[] = [];
    let idx = 3;
    if (normalizeToken(tokens[3]) === 'where') {
      idx = 4;
      while (idx < tokens.length && tokens[idx] !== ';') {
        const col = cleanIdentifier(tokens[idx]); idx++;
        const op = tokens[idx]; idx++;
        whereClauses.push({ col, op, val: coerceValue(tokens[idx]) }); idx++;
        if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
      }
    }

    return await this.withDb(async (db) => {
      const store = db.transaction(tableName, 'readwrite').objectStore(tableName);
      const all = await getAllFromStore<Record<string, unknown>>(store);
      let changes = 0;
      for (const row of all) {
        if (matchesWhere(row, whereClauses)) {
          const key = row[store.keyPath as string] as string;
          await deleteFromStore(store, key);
          changes++;
        }
      }
      return { lastInsertRowId: 0, changes };
    });
  }

  private async execSelect<T>(tokens: string[]): Promise<T[]> {
    const { tableName, whereClauses, orderBy, groupBy, limit, offset } = parseSelect(tokens);
    if (!tableName) return [];

    if (tableName === 'sqlite_master') {
      return this.querySqliteMaster(tokens) as Promise<T[]>;
    }
    if (tableName.startsWith('pragma_')) {
      return this.queryPragmaTableInfo(tokens) as Promise<T[]>;
    }
    if (tableName === 'pragma_table_info' || tableName === 'pragma_table_xinfo') {
      return this.queryPragmaTableInfo(tokens) as Promise<T[]>;
    }

    let def = this.tables.get(tableName);
    if (!def) {
      if (KNOWN_TABLES[tableName]) {
        def = { name: tableName, columns: [] };
        this.tables.set(tableName, def);
        await this.withDb(async (db) => {
          if (!db.objectStoreNames.contains(tableName)) {
            db.close();
            await createObjectStore(tableName, KNOWN_TABLES[tableName]);
            this.dbPromise = ensureDb();
            await this.dbPromise;
          }
        });
      }
    }

    const allRows = await this.withDb(async (db) => {
      const store = db.transaction(tableName, 'readonly').objectStore(tableName);
      return getAllFromStore<Record<string, unknown>>(store);
    });

    let filtered = allRows.filter(row => matchesWhere(row, whereClauses));

    if (groupBy) {
      filtered = applyGroupBy(filtered, groupBy, tokens);
    }

    if (orderBy) {
      filtered.sort((a, b) => {
        for (const { col, dir } of orderBy) {
          const va = a[col];
          const vb = b[col];
          if (va == null && vb == null) continue;
          if (va == null) return 1;
          if (vb == null) return -1;
          let cmp: number;
          if (typeof va === 'number' && typeof vb === 'number') {
            cmp = va - vb;
          } else {
            cmp = String(va).localeCompare(String(vb));
          }
          if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    if (offset) filtered = filtered.slice(offset);
    if (limit) filtered = filtered.slice(0, limit);

    return projectColumns(filtered, tokens) as T[];
  }

  private async querySqliteMaster(tokens: string[]): Promise<{ name: string; type: string }[]> {
    const results: { name: string; type: string }[] = [];
    for (const [name] of this.tables) {
      if (name.startsWith('_')) continue;
      results.push({ name, type: 'table' });
    }
    const whereIdx = tokens.findIndex(t => normalizeToken(t) === 'where');
    if (whereIdx >= 0) {
      const typeVal = stripQuotes(tokens[whereIdx + 3]);
      return results.filter(r => {
        if (normalizeToken(tokens[whereIdx + 1]) === 'type') {
          return r.type === typeVal;
        }
        return true;
      });
    }
    return results;
  }

  private async queryPragmaTableInfo(tokens: string[]): Promise<{ name: string; type: string }[]> {
    const tableArg = tokens[tokens.length - 1];
    const tableName = stripQuotes(tableArg);
    const def = this.tables.get(tableName);
    if (!def) return [];
    return def.columns.map(c => ({ name: c.name, type: c.type || 'TEXT', notNull: false, pk: c.primaryKey ? 1 : 0 }));
  }
}

function parseSelect(tokens: string[]) {
  const result: {
    tableName: string | null;
    columns: string[];
    whereClauses: { col: string; op: string; val: unknown }[];
    orderBy: { col: string; dir: string }[];
    groupBy: string[];
    limit: number | null;
    offset: number | null;
  } = {
    tableName: null,
    columns: [],
    whereClauses: [],
    orderBy: [],
    groupBy: [],
    limit: null,
    offset: null,
  };

  let idx = 0;
  if (normalizeToken(tokens[0]) !== 'select') return result;

  idx = 1;
  while (idx < tokens.length && normalizeToken(tokens[idx]) !== 'from') {
    if (tokens[idx] !== ',') {
      result.columns.push(tokens[idx]);
    }
    idx++;
  }
  idx++;

  if (idx < tokens.length) {
    result.tableName = cleanIdentifier(tokens[idx]); idx++;
  }

  while (idx < tokens.length) {
    const kw = normalizeToken(tokens[idx]);
    if (kw === 'where') {
      idx++;
      while (idx < tokens.length &&
             normalizeToken(tokens[idx]) !== 'order' &&
             normalizeToken(tokens[idx]) !== 'group' &&
             normalizeToken(tokens[idx]) !== 'limit' &&
             normalizeToken(tokens[idx]) !== 'offset' &&
             tokens[idx] !== ';') {
        const col = cleanIdentifier(tokens[idx]); idx++;
        if (idx >= tokens.length) break;
        if (normalizeToken(tokens[idx]) === 'in') {
          idx++;
          while (idx < tokens.length && tokens[idx] !== ')') idx++;
          idx++;
          if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
          continue;
        }
        if (normalizeToken(tokens[idx]) === 'is' && normalizeToken(tokens[idx + 1]) === 'not') {
          result.whereClauses.push({ col, op: 'IS NOT', val: null });
          idx += 2;
          if (idx < tokens.length && normalizeToken(tokens[idx]) === 'null') idx++;
          if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
          continue;
        }
        if (normalizeToken(tokens[idx]) === 'is') {
          idx++;
          result.whereClauses.push({ col, op: 'IS', val: normalizeToken(tokens[idx]) === 'null' ? null : coerceValue(tokens[idx]) });
          idx++;
          if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
          continue;
        }
        if (normalizeToken(tokens[idx]) === 'not' && normalizeToken(tokens[idx + 1]) === 'like') {
          idx += 2;
          result.whereClauses.push({ col, op: 'NOT LIKE', val: stripQuotes(tokens[idx]) }); idx++;
          if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
          continue;
        }
        const op = tokens[idx] === '=' || tokens[idx] === '>' || tokens[idx] === '<' ||
                   tokens[idx] === '>=' || tokens[idx] === '<=' || tokens[idx] === '!=' ||
                   normalizeToken(tokens[idx]) === 'like'
                   ? tokens[idx] : '=';
        if (op !== '=' || tokens[idx] === '=') idx++;
        const val = coerceValue(tokens[idx]);
        result.whereClauses.push({ col, op, val });
        idx++;
        if (idx < tokens.length && normalizeToken(tokens[idx]) === 'and') idx++;
      }
    } else if (kw === 'order') {
      idx++;
      if (normalizeToken(tokens[idx]) === 'by') idx++;
      while (idx < tokens.length &&
             normalizeToken(tokens[idx]) !== 'limit' &&
             normalizeToken(tokens[idx]) !== 'offset' &&
             tokens[idx] !== ';') {
        const col = cleanIdentifier(tokens[idx]); idx++;
        const dir = idx < tokens.length ? normalizeToken(tokens[idx]) : 'asc';
        if (dir === 'asc' || dir === 'desc') idx++;
        result.orderBy.push({ col, dir });
        if (idx < tokens.length && tokens[idx] === ',') idx++;
      }
    } else if (kw === 'group') {
      idx++;
      if (normalizeToken(tokens[idx]) === 'by') idx++;
      while (idx < tokens.length &&
             normalizeToken(tokens[idx]) !== 'order' &&
             normalizeToken(tokens[idx]) !== 'limit' &&
             normalizeToken(tokens[idx]) !== 'offset' &&
             normalizeToken(tokens[idx]) !== 'having' &&
             tokens[idx] !== ';') {
        if (tokens[idx] !== ',') {
          result.groupBy.push(cleanIdentifier(tokens[idx]));
        }
        idx++;
      }
    } else if (kw === 'limit') {
      idx++;
      result.limit = parseInt(tokens[idx], 10); idx++;
    } else if (kw === 'offset') {
      idx++;
      result.offset = parseInt(tokens[idx], 10); idx++;
    } else if (tokens[idx] === ';') {
      break;
    } else {
      idx++;
    }
  }

  return result;
}

function matchesWhere(
  row: Record<string, unknown>,
  clauses: { col: string; op: string; val: unknown }[]
): boolean {
  if (clauses.length === 0) return true;
  return clauses.every(({ col, op, val }) => {
    const actual = row[col];
    if (op === '=') return actual == val;
    if (op === '!=') return actual != val;
    if (op === 'IS') return actual === val;
    if (op === 'IS NOT') return actual !== val;
    if (op === '>' || op === '<' || op === '>=' || op === '<=') {
      const a = Number(actual);
      const b = Number(val);
      if (isNaN(a) || isNaN(b)) return false;
      switch (op) {
        case '>': return a > b;
        case '<': return a < b;
        case '>=': return a >= b;
        case '<=': return a <= b;
      }
    }
    if (op === 'LIKE' || op.toLowerCase() === 'like') {
      if (typeof actual !== 'string') return false;
      const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${pattern}$`, 'i').test(actual);
    }
    if (op === 'NOT LIKE') {
      if (typeof actual !== 'string') return true;
      const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.');
      return !new RegExp(`^${pattern}$`, 'i').test(actual);
    }
    return false;
  });
}

function applyGroupBy(
  rows: Record<string, unknown>[],
  groupBy: string[],
  tokens: string[]
): Record<string, unknown>[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = groupBy.map(g => String(row[g] ?? '')).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const selectIdx = tokens.findIndex(t => normalizeToken(t) === 'select');
  const aggColumns = tokens.slice(selectIdx + 1, tokens.findIndex(t => normalizeToken(t) === 'from'));

  const results: Record<string, unknown>[] = [];
  for (const [, groupRows] of groups) {
    const result: Record<string, unknown> = {};
    for (const col of groupBy) {
      result[col] = groupRows[0]?.[col];
    }
    for (const agg of aggColumns) {
      if (tokens.includes(',')) continue;
      const aggStr = agg.toLowerCase();
      if (aggStr.includes('sum(')) {
        const colMatch = aggStr.match(/sum\s*\(\s*(\w+)\s*\)/i);
        if (colMatch) {
          const col = colMatch[1];
          result[col] = groupRows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        }
      } else if (aggStr.includes('count(')) {
        const colMatch = aggStr.match(/count\s*\(\s*(?:\*\s*)?(\w+)?\s*\)/i);
        result['count'] = groupRows.length;
        if (colMatch && colMatch[1]) {
          result[`count_${colMatch[1]}`] = groupRows.length;
        }
      } else if (aggStr.includes('coalesce(sum(')) {
        const colMatch = aggStr.match(/coalesce\s*\(\s*sum\s*\(\s*(\w+)\s*\)/i);
        if (colMatch) {
          const col = colMatch[1];
          result[col] = groupRows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        }
      }
    }
    results.push(result);
  }

  return results;
}

function projectColumns(
  rows: Record<string, unknown>[],
  tokens: string[]
): Record<string, unknown>[] {
  const selectEnd = tokens.findIndex((t, i) => i > 0 && normalizeToken(t) === 'from');
  const columns = tokens.slice(1, selectEnd);

  if (columns.length === 1 && columns[0] === '*') return rows;

  const isSimple = columns.every(c => !c.includes('(') && !c.includes('as') && c !== ',');

  if (isSimple) {
    return rows.map(row => {
      const result: Record<string, unknown> = {};
      for (const col of columns) {
        if (col === ',') continue;
        const name = cleanIdentifier(col);
        const aliasIdx = tokens.indexOf('as', tokens.indexOf(col) + 1);
        if (aliasIdx > 0) {
          const alias = cleanIdentifier(tokens[aliasIdx + 1]);
          result[alias] = row[name];
        } else {
          result[name] = row[name];
        }
      }
      return result;
    });
  }

  return rows.map(row => {
    const result: Record<string, unknown> = {};
    let i = 0;
    while (i < columns.length) {
      if (columns[i] === ',') { i++; continue; }
      const col = columns[i];
      const lower = col.toLowerCase();
      if (lower.includes('count(')) {
        result['count'] = !isNaN(Number(row['count'])) ? row['count'] : 0;
      } else if (lower.includes('sum(') || lower.includes('coalesce(sum(') || lower.includes('coalesce(sum (')) {
        const match = lower.match(/sum\s*\(\s*(\*|\w+)\s*\)/i) || lower.match(/coalesce\s*\(\s*sum\s*\(\s*(\w+)\s*\)/i);
        if (match) {
          const colName = match[1] === '*' ? 'total' : match[1];
          result[colName] = row[colName] ?? 0;
        }
      } else if (lower.includes('cast(') && lower.includes('as')) {
        const match = lower.match(/cast\s*\([^)]+as\s+\w+\)\s+as\s+(\w+)/i) || lower.match(/cast\s*\([^)]+as\s+\w+\)/i);
        if (match) {
          const alias = match[1] || cleanIdentifier(columns[i]);
          const extractMatch = lower.match(/strftime\s*\([^,]+,\s*(\w+)/i);
          if (extractMatch) {
            const inner = extractMatch[1].replace(/['"]/g, '');
            result[alias] = String(row[inner] ?? '');
            const monthMatch = lower.match(/strftime\s*\('%m',\s*(\w+)/i);
            if (monthMatch) {
              const dateStr = String(row[monthMatch[1]] ?? '');
              const month = dateStr ? parseInt(dateStr.split('-')[1], 10) : 1;
              result[alias] = month;
            }
          }
        }
      } else if (lower.includes('strftime(')) {
        const match = lower.match(/strftime\s*\([^,]+,\s*(\w+)/i);
        if (match) {
          const dateCol = match[1].replace(/['"]/g, '');
          const dateStr = String(row[dateCol] ?? '');
          const format = lower.includes("'%m'") ? parseInt(dateStr.split('-')[1], 10) :
                         lower.includes("'%y'") ? dateStr.split('-')[0].slice(-2) :
                         dateStr.split('-')[0];
          const alias = tokens[i + 2] === 'as' ? cleanIdentifier(tokens[i + 3]) : 'month';
          result[alias] = format;
        }
      } else {
        const name = cleanIdentifier(col);
        result[name] = row[name];
      }
      i++;
    }
    return result;
  });
}

const GLOBAL_DB_KEY = '__finance_web_db__';

function getStoredDb(): WebDatabase | null {
  return (globalThis as unknown as Record<string, WebDatabase | null>)[GLOBAL_DB_KEY] ?? null;
}

function setStoredDb(db: WebDatabase | null): void {
  (globalThis as unknown as Record<string, WebDatabase | null>)[GLOBAL_DB_KEY] = db;
}

export async function getDatabase(): Promise<WebDatabase> {
  const existing = getStoredDb();
  if (existing) {
    return existing;
  }
  const db = await WebDatabase.create();
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
