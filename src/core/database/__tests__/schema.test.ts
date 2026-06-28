import { EXPECTED_TABLES, TABLE_COLUMNS, EXPECTED_INDEXES, DATABASE_VERSION } from '../schema';

describe('Database Schema Definition', () => {
  it('should have DATABASE_VERSION set to 2', () => {
    expect(DATABASE_VERSION).toBe(2);
  });

  it('should have 11 expected tables', () => {
    expect(EXPECTED_TABLES).toHaveLength(11);
    expect(EXPECTED_TABLES).toContain('wallets');
    expect(EXPECTED_TABLES).toContain('categories');
    expect(EXPECTED_TABLES).toContain('transactions');
    expect(EXPECTED_TABLES).toContain('budgets');
    expect(EXPECTED_TABLES).toContain('savings_goals');
    expect(EXPECTED_TABLES).toContain('debts');
    expect(EXPECTED_TABLES).toContain('recurring_transactions');
    expect(EXPECTED_TABLES).toContain('recurring_rules');
    expect(EXPECTED_TABLES).toContain('transaction_versions');
    expect(EXPECTED_TABLES).toContain('sync_queue');
    expect(EXPECTED_TABLES).toContain('settings');
  });

  it('should have 12 expected indexes', () => {
    expect(EXPECTED_INDEXES).toHaveLength(12);
  });

  it('wallets table should have all required columns', () => {
    const cols = TABLE_COLUMNS.wallets;
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('balance');
    expect(cols).toContain('currency');
    expect(cols).toContain('icon');
    expect(cols).toContain('color');
    expect(cols).toContain('is_archived');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('categories table should have created_at and updated_at columns', () => {
    const cols = TABLE_COLUMNS.categories;
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
    expect(cols).toContain('budget_id');
    expect(cols).toContain('type');
  });

  it('transactions table should have all required columns', () => {
    const cols = TABLE_COLUMNS.transactions;
    expect(cols).toContain('id');
    expect(cols).toContain('wallet_id');
    expect(cols).toContain('category_id');
    expect(cols).toContain('amount');
    expect(cols).toContain('type');
    expect(cols).toContain('description');
    expect(cols).toContain('date');
    expect(cols).toContain('is_recurring');
    expect(cols).toContain('recurring_id');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('budgets table should have all required columns', () => {
    const cols = TABLE_COLUMNS.budgets;
    expect(cols).toContain('id');
    expect(cols).toContain('category_id');
    expect(cols).toContain('amount');
    expect(cols).toContain('spent');
    expect(cols).toContain('period');
    expect(cols).toContain('start_date');
    expect(cols).toContain('end_date');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('savings_goals table should have all required columns', () => {
    const cols = TABLE_COLUMNS['savings_goals'];
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('target_amount');
    expect(cols).toContain('current_amount');
    expect(cols).toContain('deadline');
    expect(cols).toContain('icon');
    expect(cols).toContain('color');
    expect(cols).toContain('is_completed');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('debts table should have all required columns', () => {
    const cols = TABLE_COLUMNS.debts;
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('total_amount');
    expect(cols).toContain('remaining_amount');
    expect(cols).toContain('interest_rate');
    expect(cols).toContain('minimum_payment');
    expect(cols).toContain('due_date');
    expect(cols).toContain('lender');
    expect(cols).toContain('is_paid');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('recurring_transactions table should have all required columns', () => {
    const cols = TABLE_COLUMNS.recurring_transactions;
    expect(cols).toContain('id');
    expect(cols).toContain('wallet_id');
    expect(cols).toContain('category_id');
    expect(cols).toContain('amount');
    expect(cols).toContain('type');
    expect(cols).toContain('description');
    expect(cols).toContain('frequency');
    expect(cols).toContain('interval');
    expect(cols).toContain('next_date');
    expect(cols).toContain('end_date');
    expect(cols).toContain('is_active');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('recurring_rules table should have all required columns', () => {
    const cols = TABLE_COLUMNS.recurring_rules;
    expect(cols).toContain('id');
    expect(cols).toContain('template_transaction_id');
    expect(cols).toContain('frequency');
    expect(cols).toContain('interval_value');
    expect(cols).toContain('day_of_month');
    expect(cols).toContain('day_of_week');
    expect(cols).toContain('month_of_year');
    expect(cols).toContain('start_date');
    expect(cols).toContain('end_date');
    expect(cols).toContain('max_occurrences');
    expect(cols).toContain('occurrence_count');
    expect(cols).toContain('is_active');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('transaction_versions table should have all required columns', () => {
    const cols = TABLE_COLUMNS.transaction_versions;
    expect(cols).toContain('id');
    expect(cols).toContain('transaction_id');
    expect(cols).toContain('version_number');
    expect(cols).toContain('change_type');
    expect(cols).toContain('changed_by');
    expect(cols).toContain('created_at');
  });

  it('sync_queue table should have all required columns', () => {
    const cols = TABLE_COLUMNS.sync_queue;
    expect(cols).toContain('id');
    expect(cols).toContain('entity_type');
    expect(cols).toContain('entity_id');
    expect(cols).toContain('operation');
    expect(cols).toContain('payload');
    expect(cols).toContain('status');
    expect(cols).toContain('retry_count');
    expect(cols).toContain('max_retries');
    expect(cols).toContain('error_message');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('every table should have created_at column', () => {
    for (const table of EXPECTED_TABLES) {
      const cols = TABLE_COLUMNS[table];
      if (table !== 'settings') {
        expect(cols).toContain('created_at');
      }
    }
  });
});
