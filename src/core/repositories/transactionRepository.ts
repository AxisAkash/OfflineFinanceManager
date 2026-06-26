import { BaseRepository } from './baseRepository';
import { Transaction } from '../../shared/types';
import type { SQLiteBindValue } from 'expo-sqlite';

interface TransactionRow {
  id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  is_recurring: number;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    categoryId: row.category_id,
    amount: row.amount,
    type: row.type as 'income' | 'expense',
    description: row.description,
    date: row.date,
    isRecurring: row.is_recurring === 1,
    recurringId: row.recurring_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  async findAllFiltered(filter: TransactionFilter = {}): Promise<Transaction[]> {
    const conditions: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (filter.walletId) {
      conditions.push('wallet_id = ?');
      params.push(filter.walletId);
    }
    if (filter.categoryId) {
      conditions.push('category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.startDate) {
      conditions.push('date >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('date <= ?');
      params.push(filter.endDate);
    }
    if (filter.searchQuery) {
      conditions.push('description LIKE ?');
      params.push(`%${filter.searchQuery}%`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sortBy = filter.sortBy || 'date';
    const sortOrder = filter.sortOrder || 'DESC';
    const limit = filter.limit ? `LIMIT ${filter.limit}` : '';
    const offset = filter.offset ? `OFFSET ${filter.offset}` : '';

    const sql = `SELECT * FROM transactions ${whereClause} ORDER BY ${sortBy} ${sortOrder} ${limit} ${offset}`;
    const rows = await this.executeSql<TransactionRow>(sql, params);
    return rows.map(rowToTransaction);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return this.findAllFiltered({ startDate, endDate, sortBy: 'date', sortOrder: 'DESC' });
  }

  async getRecent(limit: number = 10): Promise<Transaction[]> {
    return this.findAllFiltered({ limit, sortBy: 'date', sortOrder: 'DESC' });
  }

  async getMonthlyTotals(year: number, month: number): Promise<{ income: number; expense: number }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const db = await this.dbPromise;
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['income', startDate, endDate]
    );
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['expense', startDate, endDate]
    );

    return {
      income: incomeResult?.total || 0,
      expense: expenseResult?.total || 0,
    };
  }

  async getYearlyTotals(year: number): Promise<{ income: number; expense: number }> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return this.getDateRangeTotals(startDate, endDate);
  }

  async getDateRangeTotals(startDate: string, endDate: string): Promise<{ income: number; expense: number }> {
    const db = await this.dbPromise;
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['income', startDate, endDate]
    );
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['expense', startDate, endDate]
    );

    return {
      income: incomeResult?.total || 0,
      expense: expenseResult?.total || 0,
    };
  }

  async create(transaction: Transaction): Promise<void> {
    const row: TransactionRow = {
      id: transaction.id,
      wallet_id: transaction.walletId,
      category_id: transaction.categoryId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      is_recurring: transaction.isRecurring ? 1 : 0,
      recurring_id: transaction.recurringId || null,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
    };
    await this.insert(row);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const rowUpdates: Partial<TransactionRow> = {};
    if (updates.walletId !== undefined) rowUpdates.wallet_id = updates.walletId;
    if (updates.categoryId !== undefined) rowUpdates.category_id = updates.categoryId;
    if (updates.amount !== undefined) rowUpdates.amount = updates.amount;
    if (updates.type !== undefined) rowUpdates.type = updates.type;
    if (updates.description !== undefined) rowUpdates.description = updates.description;
    if (updates.date !== undefined) rowUpdates.date = updates.date;
    if (updates.isRecurring !== undefined) rowUpdates.is_recurring = updates.isRecurring ? 1 : 0;
    if (updates.recurringId !== undefined) rowUpdates.recurring_id = updates.recurringId || null;
    rowUpdates.updated_at = new Date().toISOString();

    await this.update(id, rowUpdates);
  }

  async getByWalletId(walletId: string): Promise<Transaction[]> {
    return this.findAllFiltered({ walletId, sortBy: 'date', sortOrder: 'DESC' });
  }

  async getByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.findAllFiltered({ categoryId, sortBy: 'date', sortOrder: 'DESC' });
  }
}

export const transactionRepository = new TransactionRepository();
