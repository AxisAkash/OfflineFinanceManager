import { BaseRepository } from './baseRepository';
import { Category } from '../../shared/types';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  budget_id: string | null;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as 'income' | 'expense',
    budgetId: row.budget_id || undefined,
  };
}

export class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  async findAllByType(type: 'income' | 'expense'): Promise<Category[]> {
    const rows = await this.executeSql<CategoryRow>(
      'SELECT * FROM categories WHERE type = ? ORDER BY name ASC',
      [type]
    );
    return rows.map(rowToCategory);
  }

  async findAllIncome(): Promise<Category[]> {
    return this.findAllByType('income');
  }

  async findAllExpense(): Promise<Category[]> {
    return this.findAllByType('expense');
  }

  async findAllMapped(): Promise<Category[]> {
    const rows = await this.findAll<CategoryRow>();
    return rows.map(rowToCategory);
  }

  async create(category: Category): Promise<void> {
    const row: CategoryRow = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      budget_id: category.budgetId || null,
    };
    await this.insert(row);
  }

  async getCategoryStats(): Promise<{ totalIncome: number; totalExpense: number }> {
    const incomeResult = await this.executeSqlSingle<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories WHERE type = ?',
      ['income']
    );
    const expenseResult = await this.executeSqlSingle<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories WHERE type = ?',
      ['expense']
    );

    return {
      totalIncome: incomeResult?.count || 0,
      totalExpense: expenseResult?.count || 0,
    };
  }
}

export const categoryRepository = new CategoryRepository();
