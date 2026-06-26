import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BackupData } from '../../shared/types';

const BACKUP_FILE_NAME = 'finance_backup.json';
const EXPORT_FILE_NAME = 'finance_export.json';

function getBackupDir(): Directory {
  const backupDir = new Directory(Paths.document, 'backups');
  if (!backupDir.exists) {
    backupDir.create({ intermediates: true });
  }
  return backupDir;
}

export async function saveBackup(data: BackupData): Promise<string> {
  const backupDir = getBackupDir();
  const file = new File(backupDir, BACKUP_FILE_NAME);
  const json = JSON.stringify(data, null, 2);
  file.write(json);
  return file.uri;
}

export async function loadBackup(): Promise<BackupData | null> {
  const backupDir = getBackupDir();
  const file = new File(backupDir, BACKUP_FILE_NAME);
  if (!file.exists) {
    return null;
  }
  const json = await file.text();
  return JSON.parse(json) as BackupData;
}

export async function exportBackup(data: BackupData): Promise<void> {
  const file = new File(Paths.cache, EXPORT_FILE_NAME);
  const json = JSON.stringify(data, null, 2);
  file.write(json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Finance Data',
    });
  }
}

export function getBackupInfo(): {
  exists: boolean;
  size: number;
  modifiedAt: string | null;
} | null {
  const backupDir = getBackupDir();
  const file = new File(backupDir, BACKUP_FILE_NAME);
  if (!file.exists) {
    return null;
  }
  const info = file.info();
  return {
    exists: true,
    size: info.size || 0,
    modifiedAt: info.modificationTime
      ? new Date(info.modificationTime * 1000).toISOString()
      : null,
  };
}

export async function deleteBackup(): Promise<void> {
  const backupDir = getBackupDir();
  const file = new File(backupDir, BACKUP_FILE_NAME);
  if (file.exists) {
    file.delete();
  }
}

export async function isBackupAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

export function getStorageUsage(): {
  databaseSize: number;
  backupSize: number;
  cacheSize: number;
} {
  const dbFile = new File(Paths.document, 'SQLite', 'finance.db');
  const backupInfo = getBackupInfo();

  return {
    databaseSize: dbFile.exists ? dbFile.info().size || 0 : 0,
    backupSize: backupInfo?.size || 0,
    cacheSize: 0,
  };
}
