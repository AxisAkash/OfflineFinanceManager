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
  notes: string | null;
  time: string | null;
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
    notes: row.notes || undefined,
    time: row.time || undefined,
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
    const db = await this.dbPromise;
    await db.runAsync('BEGIN TRANSACTION');
    try {
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
        notes: transaction.notes || null,
        time: transaction.time || null,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      };
      await this.insert(row);

      const sign = transaction.type === 'income' ? 1 : -1;
      await db.runAsync(
        'UPDATE wallets SET balance = balance + (?), updated_at = ? WHERE id = ?',
        [sign * transaction.amount, transaction.createdAt, transaction.walletId]
      );

      if (transaction.type === 'expense') {
        const activeBudget = await this.executeSqlSingle<{ id: string; spent: number }>(
          `SELECT id, spent FROM budgets WHERE category_id = ? AND end_date >= ? LIMIT 1`,
          [transaction.categoryId, transaction.date]
        );
        if (activeBudget) {
          await db.runAsync(
            'UPDATE budgets SET spent = spent + ?, updated_at = ? WHERE id = ?',
            [transaction.amount, transaction.createdAt, activeBudget.id]
          );
        }
      }

      await db.runAsync('COMMIT');
    } catch (err) {
      await db.runAsync('ROLLBACK');
      throw err;
    }
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
    if (updates.notes !== undefined) rowUpdates.notes = updates.notes || null;
    if (updates.time !== undefined) rowUpdates.time = updates.time || null;
    rowUpdates.updated_at = new Date().toISOString();

    await this.update(id, rowUpdates);
  }

  async getCategoryBreakdown(startDate: string, endDate: string): Promise<{ categoryId: string; amount: number }[]> {
    const db = await this.dbPromise;
    const rows = await db.getAllAsync<{ category_id: string; amount: number }>(
      `SELECT category_id, SUM(amount) as amount FROM transactions
       WHERE type = 'expense' AND date >= ? AND date <= ?
       GROUP BY category_id ORDER BY amount DESC`,
      [startDate, endDate]
    );
    return rows.map((r) => ({ categoryId: r.category_id, amount: r.amount }));
  }

  async findByIdTransformed(id: string): Promise<Transaction | null> {
    const row = await this.executeSqlSingle<TransactionRow>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return row ? rowToTransaction(row) : null;
  }

  async getByWalletId(walletId: string): Promise<Transaction[]> {
    return this.findAllFiltered({ walletId, sortBy: 'date', sortOrder: 'DESC' });
  }

  async getByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.findAllFiltered({ categoryId, sortBy: 'date', sortOrder: 'DESC' });
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await this.dbPromise;
    const txn = await this.findByIdTransformed(id);
    if (!txn) return;

    await db.runAsync('BEGIN TRANSACTION');
    try {
      const sign = txn.type === 'income' ? -1 : 1;
      await db.runAsync(
        'UPDATE wallets SET balance = balance + (?), updated_at = ? WHERE id = ?',
        [sign * txn.amount, new Date().toISOString(), txn.walletId]
      );

      if (txn.type === 'expense') {
        await db.runAsync(
          'UPDATE budgets SET spent = MAX(0, spent - ?), updated_at = ? WHERE category_id = ? AND end_date >= ?',
          [txn.amount, new Date().toISOString(), txn.categoryId, txn.date]
        );
      }

      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
      await db.runAsync('COMMIT');
    } catch (err) {
      await db.runAsync('ROLLBACK');
      throw err;
    }
  }
}

export const transactionRepository = new TransactionRepository();
