import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { validatePin } from '../../../shared/utils';
import { getBiometricInfo, type BiometricInfo } from '../services/authService';

interface CreatePinScreenProps {
  onComplete: (pin: string, enableBiometrics: boolean) => Promise<boolean>;
}

export function CreatePinScreen({ onComplete }: CreatePinScreenProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo | null>(null);

  useEffect(() => {
    loadBiometricInfo();
  }, []);

  const loadBiometricInfo = async () => {
    const info = await getBiometricInfo();
    setBiometricInfo(info);
  };

  const handleSubmit = async () => {
    setError(null);

    const validation = validatePin(pin);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid PIN');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      setIsLoading(true);
      const success = await onComplete(pin, enableBiometrics);
      if (!success) {
        setError('Failed to create PIN. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const canUseBiometrics = biometricInfo?.isAvailable && biometricInfo?.isEnrolled;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Security PIN
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Choose a 4-6 digit PIN to protect your financial data
        </Text>
      </View>

      <Input
        label="Enter PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        error={error || undefined}
        containerStyle={styles.input}
      />

      <Input
        label="Confirm PIN"
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        containerStyle={styles.input}
      />

      {canUseBiometrics && (
        <View style={[styles.biometricRow, { borderColor: colors.border }]}>
          <View style={styles.biometricInfo}>
            <Text style={[styles.biometricLabel, { color: colors.text }]}>
              Enable Biometrics
            </Text>
            <Text style={[styles.biometricDescription, { color: colors.textSecondary }]}>
              Use fingerprint or face ID to unlock
            </Text>
          </View>
          <Switch
            value={enableBiometrics}
            onValueChange={setEnableBiometrics}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={enableBiometrics ? colors.primaryDark : colors.textTertiary}
          />
        </View>
      )}

      <Button
        title="Create PIN"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!pin || !confirmPin}
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.lg,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  biometricInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  biometricLabel: {
    ...typography.label,
    marginBottom: spacing.xxs,
  },
  biometricDescription: {
    ...typography.caption,
  },
});
