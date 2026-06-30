import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { isBiometricEnabled, getLockoutState, LockoutState } from '../../../core/encryption';

interface EnterPinScreenProps {
  onPinSubmit: (pin: string) => Promise<boolean>;
  onBiometricLogin: () => Promise<boolean>;
}

export function EnterPinScreen({
  onPinSubmit,
  onBiometricLogin,
}: EnterPinScreenProps) {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [lockout, setLockout] = useState<LockoutState>({ attempts: 0, lockedUntil: null, isLocked: false, remainingSeconds: 0 });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkBiometricStatus();
    checkLockout();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (lockout.isLocked && lockout.remainingSeconds > 0) {
      countdownRef.current = setInterval(() => {
        setLockout((prev) => {
          const newSecs = prev.remainingSeconds - 1;
          if (newSecs <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            checkLockout();
            return { ...prev, isLocked: false, remainingSeconds: 0, attempts: 0 };
          }
          return { ...prev, remainingSeconds: newSecs };
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [lockout.isLocked]);

  const checkLockout = async () => {
    const state = await getLockoutState();
    setLockout(state);
  };

  const checkBiometricStatus = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricEnabled(enabled);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!pin) {
      setError(t.auth.pinRequired);
      return;
    }

    try {
      setIsLoading(true);
      const success = await onPinSubmit(pin);

      if (!success) {
        const state = await getLockoutState();
        setLockout(state);
        if (state.isLocked) {
          setError(t.auth.tooManyAttempts);
        } else {
          setError(translate('auth.attemptsRemaining', { count: Math.max(0, 5 - state.attempts) }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    try {
      setIsBiometricLoading(true);
      const success = await onBiometricLogin();
      if (!success) {
        setError(t.auth.biometricAuthFailed);
      }
    } catch {
      setError(t.auth.biometricAuthFailed);
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.auth.enterPin}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t.auth.enterPinDescription}
        </Text>

        {lockout.isLocked ? (
          <View style={styles.lockoutContainer}>
            <Text style={[styles.lockoutText, { color: colors.error }]}>
              {t.auth.tooManyAttempts}
            </Text>
            <Text style={[styles.lockoutTimer, { color: colors.textSecondary }]}>
              {translate('auth.lockoutTimer', { seconds: lockout.remainingSeconds })}
            </Text>
          </View>
        ) : (
          <>
            <Input
              label={t.auth.enterPin}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={error || undefined}
              containerStyle={styles.input}
            />

            <Button
              title={t.auth.unlock}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!pin}
              fullWidth
              size="lg"
            />
          </>
        )}

        {biometricEnabled && (
          <Button
            title={t.auth.biometricLogin}
            onPress={handleBiometric}
            loading={isBiometricLoading}
            variant="outline"
            fullWidth
            size="md"
          />
        )}
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  input: {
    marginBottom: spacing.lg,
  },
  lockoutContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  lockoutText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lockoutTimer: {
    ...typography.h3,
    fontWeight: '700',
  },
});
