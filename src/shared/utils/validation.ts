import type { TranslationKeys } from '../localization';

export function validatePin(pin: string, t?: TranslationKeys): { isValid: boolean; error?: string } {
  if (!pin) {
    return { isValid: false, error: t?.validation.pinRequired ?? 'PIN is required' };
  }
  if (pin.length < 4 || pin.length > 6) {
    return { isValid: false, error: t?.validation.pinLengthError ?? 'PIN must be 4-6 digits' };
  }
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, error: t?.validation.pinOnlyDigits ?? 'PIN must contain only digits' };
  }
  return { isValid: true };
}

export function validateAmount(amount: number, t?: TranslationKeys): { isValid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { isValid: false, error: t?.validation.amountRequired ?? 'Amount is required' };
  }
  if (amount <= 0) {
    return { isValid: false, error: t?.validation.amountPositive ?? 'Amount must be greater than 0' };
  }
  if (amount > 999999999.99) {
    return { isValid: false, error: t?.validation.amountTooLarge ?? 'Amount is too large' };
  }
  return { isValid: true };
}

export function validateEmail(email: string, t?: TranslationKeys): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: t?.validation.emailRequired ?? 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: t?.validation.emailInvalid ?? 'Invalid email format' };
  }
  return { isValid: true };
}

export function validateRequired(value: string, fieldName: string, t?: TranslationKeys): { isValid: boolean; error?: string } {
  if (!value || !value.trim()) {
    if (t) {
      return { isValid: false, error: t.validation.required.replace('{{field}}', fieldName) };
    }
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

export function validateBackupSchema(data: unknown, t?: TranslationKeys): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: t?.validation.invalidBackupFormat ?? 'Invalid backup format' };
  }

  const backup = data as Record<string, unknown>;

  if (!backup.version || typeof backup.version !== 'string') {
    return { isValid: false, error: t?.validation.invalidBackupVersion ?? 'Invalid backup version' };
  }

  if (!backup.exportedAt || typeof backup.exportedAt !== 'string') {
    return { isValid: false, error: t?.validation.invalidBackupDate ?? 'Invalid backup date' };
  }

  const requiredArrays = ['transactions', 'wallets', 'categories'];
  for (const key of requiredArrays) {
    if (!Array.isArray(backup[key])) {
      if (t) {
        return { isValid: false, error: t.validation.invalidBackupData.replace('{{key}}', key) };
      }
      return { isValid: false, error: `Invalid or missing ${key} in backup` };
    }
  }

  return { isValid: true };
}
