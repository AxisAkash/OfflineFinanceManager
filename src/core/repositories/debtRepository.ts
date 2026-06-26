import { BaseRepository } from './baseRepository';
import { Debt } from '../../shared/types';

interface DebtRow {
  id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_date: string;
  lender: string;
  is_paid: number;
  created_at: string;
  updated_at: string;
}

function rowToDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    name: row.name,
    totalAmount: row.total_amount,
    remainingAmount: row.remaining_amount,
    interestRate: row.interest_rate,
    minimumPayment: row.minimum_payment,
    dueDate: row.due_date,
    lender: row.lender,
    isPaid: row.is_paid === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DebtRepository extends BaseRepository {
  constructor() {
    super('debts');
  }

  async findAllActive(): Promise<Debt[]> {
    const rows = await this.executeSql<DebtRow>(
      'SELECT * FROM debts WHERE is_paid = 0 ORDER BY due_date ASC'
    );
    return rows.map(rowToDebt);
  }

  async findAllMapped(): Promise<Debt[]> {
    const rows = await this.findAll<DebtRow>();
    return rows.map(rowToDebt);
  }

  async create(debt: Debt): Promise<void> {
    const row: DebtRow = {
      id: debt.id,
      name: debt.name,
      total_amount: debt.totalAmount,
      remaining_amount: debt.remainingAmount,
      interest_rate: debt.interestRate,
      minimum_payment: debt.minimumPayment,
      due_date: debt.dueDate,
      lender: debt.lender,
      is_paid: debt.isPaid ? 1 : 0,
      created_at: debt.createdAt,
      updated_at: debt.updatedAt,
    };
    await this.insert(row);
  }

  async makePayment(id: string, amount: number): Promise<void> {
    const debt = await this.executeSqlSingle<DebtRow>(
      'SELECT * FROM debts WHERE id = ?',
      [id]
    );
    if (!debt) return;

    const newRemaining = Math.max(0, debt.remaining_amount - amount);
    const isPaid = newRemaining <= 0 ? 1 : 0;

    await this.update(id, {
      remaining_amount: newRemaining,
      is_paid: isPaid,
      updated_at: new Date().toISOString(),
    } as Partial<DebtRow>);
  }
}

export const debtRepository = new DebtRepository();
