const STORAGE_KEYS = {
  PIN_HASH: 'web_app_pin_hash',
  PIN_SALT: 'web_app_pin_salt',
  ENCRYPTION_KEY: 'web_app_encryption_key',
  BIOMETRIC_ENABLED: 'web_app_biometric_enabled',
  BACKUP_ENCRYPTION_KEY: 'web_app_backup_key',
  LOCKOUT_ATTEMPTS: 'web_app_lockout_attempts',
  LOCKOUT_UNTIL: 'web_app_lockout_until',
} as const;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

export interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  isLocked: boolean;
  remainingSeconds: number;
}

function getItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function removeItem(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function generateSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return uint8ArrayToHex(salt);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  let hash = pin + salt;
  for (let i = 0; i < 100000; i++) {
    const data = encoder.encode(hash);
    const digest = await crypto.subtle.digest('SHA-256', data);
    hash = uint8ArrayToHex(new Uint8Array(digest));
  }
  return hash;
}

export async function setupPin(pin: string): Promise<void> {
  const salt = await generateSalt();
  const hash = await hashPin(pin, salt);
  setItem(STORAGE_KEYS.PIN_HASH, hash);
  setItem(STORAGE_KEYS.PIN_SALT, salt);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = getItem(STORAGE_KEYS.PIN_HASH);
  const salt = getItem(STORAGE_KEYS.PIN_SALT);
  if (!hash || !salt) return false;
  const computedHash = await hashPin(pin, salt);
  return computedHash === hash;
}

export async function isPinSetup(): Promise<boolean> {
  return getItem(STORAGE_KEYS.PIN_HASH) !== null;
}

export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  const isValid = await verifyPin(oldPin);
  if (!isValid) return false;
  await setupPin(newPin);
  return true;
}

export async function generateEncryptionKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const keyHex = uint8ArrayToHex(key);
  setItem(STORAGE_KEYS.ENCRYPTION_KEY, keyHex);
  return keyHex;
}

export async function getEncryptionKey(): Promise<string | null> {
  return getItem(STORAGE_KEYS.ENCRYPTION_KEY);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, JSON.stringify(enabled));
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return value ? JSON.parse(value) : false;
}

export async function generateBackupKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const keyHex = uint8ArrayToHex(key);
  setItem(STORAGE_KEYS.BACKUP_ENCRYPTION_KEY, keyHex);
  return keyHex;
}

export async function getBackupKey(): Promise<string | null> {
  return getItem(STORAGE_KEYS.BACKUP_ENCRYPTION_KEY);
}

export async function getLockoutState(): Promise<LockoutState> {
  const attemptsStr = getItem(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
  const lockedUntilStr = getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
  const lockedUntil = lockedUntilStr ? parseInt(lockedUntilStr, 10) : null;
  const now = Date.now();

  if (lockedUntil && now < lockedUntil) {
    return {
      attempts, lockedUntil, isLocked: true,
      remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
    };
  }

  if (lockedUntil && now >= lockedUntil) {
    removeItem(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
    removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    return { attempts: 0, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
  }

  return { attempts, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
}

export async function incrementLockoutAttempts(): Promise<LockoutState> {
  const state = await getLockoutState();
  const newAttempts = state.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    setItem(STORAGE_KEYS.LOCKOUT_ATTEMPTS, newAttempts.toString());
    setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockedUntil.toString());
    return {
      attempts: newAttempts, lockedUntil, isLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  setItem(STORAGE_KEYS.LOCKOUT_ATTEMPTS, newAttempts.toString());
  return { attempts: newAttempts, lockedUntil: null, isLocked: false, remainingSeconds: 0 };
}

export async function resetLockout(): Promise<void> {
  removeItem(STORAGE_KEYS.LOCKOUT_ATTEMPTS);
  removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
}

export async function clearAll(): Promise<void> {
  Object.values(STORAGE_KEYS).forEach(key => removeItem(key));
}
