export function validatePin(pin: string): { isValid: boolean; error?: string } {
  if (!pin) {
    return { isValid: false, error: 'PIN is required' };
  }
  if (pin.length < 4) {
    return { isValid: false, error: 'PIN must be at least 4 digits' };
  }
  if (pin.length > 6) {
    return { isValid: false, error: 'PIN must be at most 6 digits' };
  }
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, error: 'PIN must contain only digits' };
  }
  return { isValid: true };
}

export function validateAmount(amount: number): { isValid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { isValid: false, error: 'Amount is required' };
  }
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  if (amount > 999999999.99) {
    return { isValid: false, error: 'Amount is too large' };
  }
  return { isValid: true };
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true };
}

export function validateRequired(value: string, fieldName: string): { isValid: boolean; error?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

export function validateBackupSchema(data: unknown): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid backup format' };
  }

  const backup = data as Record<string, unknown>;

  if (!backup.version || typeof backup.version !== 'string') {
    return { isValid: false, error: 'Invalid backup version' };
  }

  if (!backup.exportedAt || typeof backup.exportedAt !== 'string') {
    return { isValid: false, error: 'Invalid backup date' };
  }

  const requiredArrays = ['transactions', 'wallets', 'categories'];
  for (const key of requiredArrays) {
    if (!Array.isArray(backup[key])) {
      return { isValid: false, error: `Invalid or missing ${key} in backup` };
    }
  }

  return { isValid: true };
}
