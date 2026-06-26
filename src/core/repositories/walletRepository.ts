import { BaseRepository } from './baseRepository';
import { Wallet } from '../../shared/types';

interface WalletRow {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function rowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    currency: row.currency,
    icon: row.icon,
    color: row.color,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WalletRepository extends BaseRepository {
  constructor() {
    super('wallets');
  }

  async findAllActive(): Promise<Wallet[]> {
    const rows = await this.executeSql<WalletRow>(
      'SELECT * FROM wallets WHERE is_archived = 0 ORDER BY created_at ASC'
    );
    return rows.map(rowToWallet);
  }

  async findAllIncludingArchived(): Promise<Wallet[]> {
    const rows = await this.findAll<WalletRow>();
    return rows.map(rowToWallet);
  }

  async findArchived(): Promise<Wallet[]> {
    const rows = await this.executeSql<WalletRow>(
      'SELECT * FROM wallets WHERE is_archived = 1 ORDER BY created_at ASC'
    );
    return rows.map(rowToWallet);
  }

  async create(wallet: Wallet): Promise<void> {
    const row: WalletRow = {
      id: wallet.id,
      name: wallet.name,
      balance: wallet.balance,
      currency: wallet.currency,
      icon: wallet.icon,
      color: wallet.color,
      is_archived: wallet.isArchived ? 1 : 0,
      created_at: wallet.createdAt,
      updated_at: wallet.updatedAt,
    };
    await this.insert(row);
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await this.update(id, {
      balance: newBalance,
      updated_at: new Date().toISOString(),
    } as Partial<WalletRow>);
  }

  async archive(id: string): Promise<void> {
    await this.update(id, {
      is_archived: 1,
      updated_at: new Date().toISOString(),
    } as Partial<WalletRow>);
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, {
      is_archived: 0,
      updated_at: new Date().toISOString(),
    } as Partial<WalletRow>);
  }

  async getTotalBalance(): Promise<number> {
    const result = await this.executeSqlSingle<{ total: number }>(
      'SELECT COALESCE(SUM(balance), 0) as total FROM wallets WHERE is_archived = 0'
    );
    return result?.total || 0;
  }
}

export const walletRepository = new WalletRepository();
