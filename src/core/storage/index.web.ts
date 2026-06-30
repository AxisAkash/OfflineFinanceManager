import { BackupData } from '../../shared/types';

const BACKUP_KEY = '__finance_backup__';
const EXPORT_KEY = '__finance_export__';

function getFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export async function saveBackup(data: BackupData): Promise<string> {
  const json = JSON.stringify(data, null, 2);
  setToStorage(BACKUP_KEY, json);
  return BACKUP_KEY;
}

export async function loadBackup(): Promise<BackupData | null> {
  const json = getFromStorage(BACKUP_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as BackupData;
  } catch {
    return null;
  }
}

export async function exportBackup(data: BackupData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  setToStorage(EXPORT_KEY, json);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function getBackupInfo(): {
  exists: boolean;
  size: number;
  modifiedAt: string | null;
} | null {
  const json = getFromStorage(BACKUP_KEY);
  if (!json) return null;
  return {
    exists: true,
    size: new Blob([json]).size,
    modifiedAt: null,
  };
}

export async function deleteBackup(): Promise<void> {
  removeFromStorage(BACKUP_KEY);
}

export async function isBackupAvailable(): Promise<boolean> {
  return typeof document !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getStorageUsage(): {
  databaseSize: number;
  backupSize: number;
  cacheSize: number;
} {
  const backupJson = getFromStorage(BACKUP_KEY);
  return {
    databaseSize: 0,
    backupSize: backupJson ? new Blob([backupJson]).size : 0,
    cacheSize: 0,
  };
}
