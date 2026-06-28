import { useState, useEffect, useCallback } from 'react';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { Transaction } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await transactionRepository.getRecent(50);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const createTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      await transactionRepository.create(newTransaction);
      await loadTransactions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      return false;
    }
  }, [loadTransactions]);

  const updateTransaction = useCallback(async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<boolean> => {
    try {
      await transactionRepository.updateTransaction(id, updates);
      await loadTransactions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      return false;
    }
  }, [loadTransactions]);

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await transactionRepository.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      return false;
    }
  }, []);

  return {
    transactions,
    isLoading,
    error,
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: loadTransactions,
  };
}
