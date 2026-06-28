import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { isBiometricEnabled } from '../../../core/encryption';

interface EnterPinScreenProps {
  onPinSubmit: (pin: string) => Promise<boolean>;
  onBiometricLogin: () => Promise<boolean>;
  onLockout?: () => void;
}

export function EnterPinScreen({
  onPinSubmit,
  onBiometricLogin,
  onLockout,
}: EnterPinScreenProps) {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    checkBiometricStatus();
  }, []);

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
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          onLockout?.();
        } else {
          setError(translate('auth.attemptsRemaining', { count: MAX_ATTEMPTS - newAttempts }));
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
      await onBiometricLogin();
    } catch {
      setError(t.auth.biometricAuthFailed);
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.auth.enterPin}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t.auth.enterPinDescription}
        </Text>

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
});
