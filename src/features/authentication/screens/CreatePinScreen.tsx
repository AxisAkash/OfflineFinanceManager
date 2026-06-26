import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { validatePin } from '../../../shared/utils';
import { setupPin } from '../../../core/encryption';

interface CreatePinScreenProps {
  onComplete: () => void;
}

export function CreatePinScreen({ onComplete }: CreatePinScreenProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      await setupPin(pin);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Security PIN
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Choose a 4-6 digit PIN to protect your financial data
        </Text>

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

        <Button
          title="Create PIN"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!pin || !confirmPin}
          fullWidth
          size="lg"
        />
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
