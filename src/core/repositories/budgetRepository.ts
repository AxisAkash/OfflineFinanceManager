import { BaseRepository } from './baseRepository';
import { Budget } from '../../shared/types';

interface BudgetRow {
  id: string;
  category_id: string;
  amount: number;
  spent: number;
  period: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    spent: row.spent,
    period: row.period as 'weekly' | 'monthly' | 'yearly',
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BudgetRepository extends BaseRepository {
  constructor() {
    super('budgets');
  }

  async findAllActive(): Promise<Budget[]> {
    const now = new Date().toISOString();
    const rows = await this.executeSql<BudgetRow>(
      'SELECT * FROM budgets WHERE end_date >= ? ORDER BY end_date ASC',
      [now]
    );
    return rows.map(rowToBudget);
  }

  async findAllMapped(): Promise<Budget[]> {
    const rows = await this.findAll<BudgetRow>();
    return rows.map(rowToBudget);
  }

  async findByCategoryId(categoryId: string): Promise<Budget | null> {
    const row = await this.executeSqlSingle<BudgetRow>(
      'SELECT * FROM budgets WHERE category_id = ? AND end_date >= ? ORDER BY end_date DESC LIMIT 1',
      [categoryId, new Date().toISOString()]
    );
    return row ? rowToBudget(row) : null;
  }

  async create(budget: Budget): Promise<void> {
    const row: BudgetRow = {
      id: budget.id,
      category_id: budget.categoryId,
      amount: budget.amount,
      spent: budget.spent,
      period: budget.period,
      start_date: budget.startDate,
      end_date: budget.endDate,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt,
    };
    await this.insert(row);
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    const rowUpdates: Partial<BudgetRow> = {};
    if (updates.categoryId !== undefined) rowUpdates.category_id = updates.categoryId;
    if (updates.amount !== undefined) rowUpdates.amount = updates.amount;
    if (updates.spent !== undefined) rowUpdates.spent = updates.spent;
    if (updates.period !== undefined) rowUpdates.period = updates.period;
    if (updates.startDate !== undefined) rowUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) rowUpdates.end_date = updates.endDate;
    rowUpdates.updated_at = new Date().toISOString();
    await this.update(id, rowUpdates);
  }

  async updateSpent(id: string, spent: number): Promise<void> {
    await this.update(id, {
      spent,
      updated_at: new Date().toISOString(),
    } as Partial<BudgetRow>);
  }

  async getBudgetOverview(): Promise<{
    totalBudget: number;
    totalSpent: number;
    remaining: number;
  }> {
    const now = new Date().toISOString();
    const result = await this.executeSqlSingle<{
      totalBudget: number;
      totalSpent: number;
    }>(
      'SELECT COALESCE(SUM(amount), 0) as totalBudget, COALESCE(SUM(spent), 0) as totalSpent FROM budgets WHERE end_date >= ?',
      [now]
    );
    const totalBudget = result?.totalBudget || 0;
    const totalSpent = result?.totalSpent || 0;
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }
}

export const budgetRepository = new BudgetRepository();
