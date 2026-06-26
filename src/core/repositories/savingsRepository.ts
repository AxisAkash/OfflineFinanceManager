import { BaseRepository } from './baseRepository';
import { SavingsGoal } from '../../shared/types';

interface SavingsGoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  icon: string;
  color: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

function rowToGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline,
    icon: row.icon,
    color: row.color,
    isCompleted: row.is_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SavingsRepository extends BaseRepository {
  constructor() {
    super('savings_goals');
  }

  async findAllActive(): Promise<SavingsGoal[]> {
    const rows = await this.executeSql<SavingsGoalRow>(
      'SELECT * FROM savings_goals WHERE is_completed = 0 ORDER BY deadline ASC'
    );
    return rows.map(rowToGoal);
  }

  async findAllMapped(): Promise<SavingsGoal[]> {
    const rows = await this.findAll<SavingsGoalRow>();
    return rows.map(rowToGoal);
  }

  async create(goal: SavingsGoal): Promise<void> {
    const row: SavingsGoalRow = {
      id: goal.id,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline,
      icon: goal.icon,
      color: goal.color,
      is_completed: goal.isCompleted ? 1 : 0,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt,
    };
    await this.insert(row);
  }

  async updateProgress(id: string, amount: number): Promise<void> {
    const goal = await this.executeSqlSingle<SavingsGoalRow>(
      'SELECT * FROM savings_goals WHERE id = ?',
      [id]
    );
    if (!goal) return;

    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.target_amount ? 1 : 0;

    await this.update(id, {
      current_amount: newAmount,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    } as Partial<SavingsGoalRow>);
  }
}

export const savingsRepository = new SavingsRepository();
