import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  performAuth,
  performBiometricAuth,
  setupNewPin,
  resetAuth,
  getBiometricInfo,
  BiometricInfo,
} from '../services/authService';
import { isPinSetup, isBiometricEnabled, changePin } from '../../../core/encryption';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  hasPin: boolean;
  biometricInfo: BiometricInfo | null;
  error: string | null;
}

interface AuthActions {
  loginWithPin: (pin: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  createPin: (pin: string, enableBiometrics: boolean) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  lock: () => void;
  logout: () => Promise<void>;
  checkState: () => Promise<void>;
  canUseBiometrics: () => Promise<boolean>;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    isLocked: true,
    hasPin: false,
    biometricInfo: null,
    error: null,
  });

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkState();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/active/) &&
      nextAppState.match(/inactive|background/)
    ) {
      setState((prev) => ({
        ...prev,
        isLocked: true,
        isAuthenticated: false,
      }));
    }

    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      tryBiometricAuth();
    }

    appState.current = nextAppState;
  }, []);

  const tryBiometricAuth = useCallback(async () => {
    const hasPin = await isPinSetup();
    const biometricEnabled = await isBiometricEnabled();

    if (hasPin && biometricEnabled) {
      const result = await performBiometricAuth();
      if (result.success) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLocked: false,
        }));
      }
    }
  }, []);

  const checkState = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const [hasPin, biometricInfo] = await Promise.all([
        isPinSetup(),
        getBiometricInfo(),
      ]);

      setState((prev) => ({
        ...prev,
        hasPin,
        biometricInfo,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to check auth state',
      }));
    }
  }, []);

  const loginWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const result = await performAuth(pin);
    if (result.success) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        isLocked: false,
        error: null,
      }));
      return true;
    }
    setState((prev) => ({ ...prev, error: result.error || 'Invalid PIN' }));
    return false;
  }, []);

  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    const result = await performBiometricAuth();
    if (result.success) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        isLocked: false,
        error: null,
      }));
      return true;
    }
    setState((prev) => ({ ...prev, error: result.error || 'Biometric auth failed' }));
    return false;
  }, []);

  const createPin = useCallback(
    async (pin: string, enableBiometrics: boolean): Promise<boolean> => {
      const result = await setupNewPin(pin, enableBiometrics);
      if (result.success) {
        setState((prev) => ({
          ...prev,
          hasPin: true,
          isAuthenticated: true,
          isLocked: false,
          error: null,
        }));
        return true;
      }
      setState((prev) => ({ ...prev, error: result.error || null }));
      return false;
    },
    []
  );

  const changePinAction = useCallback(
    async (oldPin: string, newPin: string): Promise<boolean> => {
      const result = await changePin(oldPin, newPin);
      if (result) {
        setState((prev) => ({ ...prev, error: null }));
        return true;
      }
      setState((prev) => ({ ...prev, error: 'Failed to change PIN' }));
      return false;
    },
    []
  );

  const lock = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isLocked: true,
    }));
  }, []);

  const logout = useCallback(async () => {
    await resetAuth();
    setState({
      isLoading: false,
      isAuthenticated: false,
      isLocked: true,
      hasPin: false,
      biometricInfo: null,
      error: null,
    });
  }, []);

  const canUseBiometrics = useCallback(async (): Promise<boolean> => {
    const info = await getBiometricInfo();
    return info.isAvailable && info.isEnrolled;
  }, []);

  return {
    ...state,
    loginWithPin,
    loginWithBiometrics,
    createPin,
    changePin: changePinAction,
    lock,
    logout,
    checkState,
    canUseBiometrics,
  };
}
