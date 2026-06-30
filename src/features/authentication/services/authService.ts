import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  isPinSetup,
  verifyPin,
  setupPin,
  isBiometricEnabled,
  setBiometricEnabled,
  clearAll,
} from '../../../core/encryption';

export interface BiometricInfo {
  isAvailable: boolean;
  biometryType: LocalAuthentication.AuthenticationType | null;
  isEnrolled: boolean;
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  const [isAvailable, biometryType, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  return {
    isAvailable,
    biometryType: biometryType.length > 0 ? biometryType[0] : null,
    isEnrolled,
  };
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your finances',
    cancelLabel: 'Use PIN instead',
    disableDeviceFallback: false,
  });

  return result.success;
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
  try {
    const biometricEnabled = await isBiometricEnabled();
    if (!biometricEnabled) {
      return { success: false, error: 'Biometrics not enabled' };
    }

    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      return { success: false, error: 'Biometric authentication failed' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Biometric authentication failed',
    };
  }
}

export async function setupNewPin(
  pin: string,
  enableBiometrics: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await setupPin(pin);

    if (enableBiometrics) {
      const biometricInfo = await getBiometricInfo();
      if (biometricInfo.isAvailable && biometricInfo.isEnrolled) {
        await setBiometricEnabled(true);
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to setup PIN',
    };
  }
}

export async function resetAuth(): Promise<void> {
  await clearAll();
  const keys = ['app_theme_mode', 'app_language'];
  for (const key of keys) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore individual key deletion failures
    }
  }
}
