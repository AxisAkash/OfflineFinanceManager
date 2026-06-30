import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { validatePin } from '../../../shared/utils';

interface ChangePinScreenProps {
  onChangePin: (oldPin: string, newPin: string) => Promise<boolean>;
  onClose?: () => void;
}

export function ChangePinScreen({ onChangePin, onClose }: ChangePinScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!currentPin) {
      setError(t.auth.pinRequired);
      return;
    }

    const validation = validatePin(newPin, t);
    if (!validation.isValid) {
      setError(validation.error || t.auth.invalidPin);
      return;
    }

    if (newPin !== confirmPin) {
      setError(t.auth.pinMatchError);
      return;
    }

    if (newPin === currentPin) {
      setError(t.auth.pinSameAsCurrent);
      return;
    }

    try {
      setIsLoading(true);
      const success = await onChangePin(currentPin, newPin);
      if (success) {
        onClose?.();
      } else {
        setError(t.auth.invalidCurrentPin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.auth.changePin}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t.auth.changePinDescription}
        </Text>
      </View>

      <Input
        label={t.auth.currentPin}
        value={currentPin}
        onChangeText={setCurrentPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        containerStyle={styles.input}
      />

      <Input
        label={t.auth.newPin}
        value={newPin}
        onChangeText={setNewPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        containerStyle={styles.input}
      />

      <Input
        label={t.auth.confirmPin}
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        error={error || undefined}
        containerStyle={styles.input}
      />

      <Button
        title={t.auth.changePin}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!currentPin || !newPin || !confirmPin}
        fullWidth
        size="lg"
      />
    </ScrollView>
    </KeyboardAvoidingView>
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
});
