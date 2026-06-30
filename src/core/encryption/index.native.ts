import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  PIN_HASH: 'app_pin_hash',
  PIN_SALT: 'app_pin_salt',
  ENCRYPTION_KEY: 'app_encryption_key',
  BIOMETRIC_ENABLED: 'app_biometric_enabled',
  BACKUP_ENCRYPTION_KEY: 'app_backup_key',
  LOCKOUT_ATTEMPTS: 'app_lockout_attempts',
  LOCKOUT_UNTIL: 'app_lockout_until',
} as const;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

export interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  isLocked: boolean;
  remainingSeconds: number;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateSalt(): Promise<string> {
  const salt = await Crypto.getRandomBytesAsync(16);
  return uint8ArrayToHex(salt);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const iterations = 100000;
  let hash = pin + salt;
  for (let i = 0; i < iterations; i++) {
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hash);
  }
  return hash;
}

export async function setupPin(pin: string): Promise<void> {
  const salt = await generateSalt();
  const hash = await hashPin(pin, salt);

  await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, hash);
  await SecureStore.setItemAsync(STORAGE_KEYS.PIN_SALT, salt);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
  const salt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);

  if (!hash || !salt) {
    return false;
  }

  const computedHash = await hashPin(pin, salt);
  return computedHash === hash;
}

export async function isPinSetup(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
  return hash !== null;
}

export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  const isValid = await verifyPin(oldPin);
  if (!isValid) {
    return false;
  }

  await setupPin(newPin);
  return true;
}

export async function generateEncryptionKey(): Promise<string> {
  const key = await Crypto.getRandomBytesAsync(32);
  const keyHex = uint8ArrayToHex(key);
  await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, keyHex);
  return keyHex;
}

export async function getEncryptionKey(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    STORAGE_KEYS.BIOMETRIC_ENABLED,
    JSON.stringify(enabled)
  );
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return value ? JSON.parse(value) : false;
}

export async function generateBackupKey(): Promise<string> {
  const key = await Crypto.getRandomBytesAsync(32);
  const keyHex = uint8ArrayToHex(key);
  await SecureStore.setItemAsync(STORAGE_KEYS.BACKUP_ENCRYPTION_KEY, keyHex);
  return keyHex;
}

export async function getBackupKey(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.BACKUP_ENCRYPTION_KEY);
}

export async function getLockoutState(): Promise<LockoutState> {
  const attemptsStr = await SecureStore.getItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
  const lockedUntilStr = await SecureStore.getItemAsync(STORAGE_KEYS.LOCKOUT_UNTIL);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
  const lockedUntil = lockedUntilStr ? parseInt(lockedUntilStr, 10) : null;
  const now = Date.now();

  if (lockedUntil && now < lockedUntil) {
    return {
      attempts,
      lockedUntil,
      isLocked: true,
      remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
    };
  }

  if (lockedUntil && now >= lockedUntil) {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_UNTIL);
    return { attempts: 0, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
  }

  return { attempts, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
}

export async function incrementLockoutAttempts(): Promise<LockoutState> {
  const state = await getLockoutState();
  const newAttempts = state.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    await SecureStore.setItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS, newAttempts.toString());
    await SecureStore.setItemAsync(STORAGE_KEYS.LOCKOUT_UNTIL, lockedUntil.toString());
    return {
      attempts: newAttempts,
      lockedUntil,
      isLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS, newAttempts.toString());
  return { attempts: newAttempts, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
}

export async function resetLockout(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_UNTIL);
}

export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_SALT);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTION_KEY);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.BACKUP_ENCRYPTION_KEY);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCKOUT_UNTIL);
}
