import {
  isPinSetup,
  verifyPin,
  setupPin,
  setBiometricEnabled,
  clearAll,
} from '../../../core/encryption';

export interface BiometricInfo {
  isAvailable: boolean;
  biometryType: null;
  isEnrolled: boolean;
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  return { isAvailable: false, biometryType: null, isEnrolled: false };
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  return false;
}

export async function performAuth(pin: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const hasPin = await isPinSetup();
    if (!hasPin) {
      return { success: false, error: 'No PIN configured' };
    }
    const isValid = await verifyPin(pin);
    if (!isValid) {
      return { success: false, error: 'Invalid PIN' };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Authentication failed',
    };
  }
}

export async function performBiometricAuth(): Promise<{
  success: boolean;
  error?: string;
}> {
  return { success: false, error: 'Biometrics not available on web' };
}

export async function setupNewPin(
  pin: string,
  enableBiometrics: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await setupPin(pin);
    if (enableBiometrics) {
      await setBiometricEnabled(false);
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to setup PIN',
    };
  }
}

const WEB_STORAGE_KEYS = ['web_app_theme_mode', 'web_app_language'];

export async function resetAuth(): Promise<void> {
  await clearAll();
  for (const key of WEB_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
