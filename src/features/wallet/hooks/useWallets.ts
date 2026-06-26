import { useState, useEffect, useCallback } from 'react';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { Wallet } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

interface UseWalletsResult {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  totalBalance: number;
  createWallet: (name: string, currency?: string) => Promise<boolean>;
  archiveWallet: (id: string) => Promise<boolean>;
  unarchiveWallet: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useWallets(): UseWalletsResult {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);

  const loadWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [active, total] = await Promise.all([
        walletRepository.findAllActive(),
        walletRepository.getTotalBalance(),
      ]);
      setWallets(active);
      setTotalBalance(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const createWallet = useCallback(async (name: string, currency: string = 'USD'): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const wallet: Wallet = {
        id: generateId(),
        name: name.trim(),
        balance: 0,
        currency,
        icon: 'wallet',
        color: '#4CAF50',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      await walletRepository.create(wallet);
      await loadWallets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      return false;
    }
  }, [loadWallets]);

  const archiveWallet = useCallback(async (id: string): Promise<boolean> => {
    try {
      await walletRepository.archive(id);
      await loadWallets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive wallet');
      return false;
    }
  }, [loadWallets]);

  const unarchiveWallet = useCallback(async (id: string): Promise<boolean> => {
    try {
      await walletRepository.unarchive(id);
      await loadWallets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive wallet');
      return false;
    }
  }, [loadWallets]);

  return {
    wallets,
    isLoading,
    error,
    totalBalance,
    createWallet,
    archiveWallet,
    unarchiveWallet,
    refresh: loadWallets,
  };
}
