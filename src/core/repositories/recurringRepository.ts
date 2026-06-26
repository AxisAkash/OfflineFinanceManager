import { BaseRepository } from './baseRepository';
import { RecurringTransaction } from '../../shared/types';

interface RecurringRow {
  id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: string;
  description: string;
  frequency: string;
  interval: number;
  next_date: string;
  end_date: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function rowToRecurring(row: RecurringRow): RecurringTransaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    categoryId: row.category_id,
    amount: row.amount,
    type: row.type as 'income' | 'expense',
    description: row.description,
    frequency: row.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: row.interval,
    nextDate: row.next_date,
    endDate: row.end_date || undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class RecurringRepository extends BaseRepository {
  constructor() {
    super('recurring_transactions');
  }

  async findAllActive(): Promise<RecurringTransaction[]> {
    const rows = await this.executeSql<RecurringRow>(
      'SELECT * FROM recurring_transactions WHERE is_active = 1 ORDER BY next_date ASC'
    );
    return rows.map(rowToRecurring);
  }

  async findAllMapped(): Promise<RecurringTransaction[]> {
    const rows = await this.findAll<RecurringRow>();
    return rows.map(rowToRecurring);
  }

  async findDueSoon(days: number = 3): Promise<RecurringTransaction[]> {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + days * 86400000).toISOString();
    const rows = await this.executeSql<RecurringRow>(
      'SELECT * FROM recurring_transactions WHERE is_active = 1 AND next_date BETWEEN ? AND ? ORDER BY next_date ASC',
      [now, future]
    );
    return rows.map(rowToRecurring);
  }

  async create(recurring: RecurringTransaction): Promise<void> {
    const row: RecurringRow = {
      id: recurring.id,
      wallet_id: recurring.walletId,
      category_id: recurring.categoryId,
      amount: recurring.amount,
      type: recurring.type,
      description: recurring.description,
      frequency: recurring.frequency,
      interval: recurring.interval,
      next_date: recurring.nextDate,
      end_date: recurring.endDate || null,
      is_active: recurring.isActive ? 1 : 0,
      created_at: recurring.createdAt,
      updated_at: recurring.updatedAt,
    };
    await this.insert(row);
  }

  async toggleActive(id: string): Promise<void> {
    const item = await this.executeSqlSingle<RecurringRow>(
      'SELECT * FROM recurring_transactions WHERE id = ?',
      [id]
    );
    if (!item) return;

    await this.update(id, {
      is_active: item.is_active ? 0 : 1,
      updated_at: new Date().toISOString(),
    } as Partial<RecurringRow>);
  }
}

export const recurringRepository = new RecurringRepository();
