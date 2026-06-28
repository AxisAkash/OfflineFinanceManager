import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage, Button, Input, Snackbar } from '../../../shared/components';
import { debtRepository } from '../../../core/repositories/debtRepository';
import { Debt } from '../../../shared/types';
import { formatCurrency, formatDate, formatPercentage, generateId } from '../../../shared/utils';

export function DebtScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lender, setLender] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await debtRepository.findAllActive();
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.debt.loadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const amountNum = parseFloat(totalAmount);
    if (!name.trim() || !amountNum || amountNum <= 0 || !dueDate.trim()) {
      Alert.alert(t.common.error, t.debt.allFieldsRequired);
      return;
    }
    setIsSaving(true);
    try {
      if (editingDebt) {
        await debtRepository.updateDebt(editingDebt.id, {
          name: name.trim(),
          totalAmount: amountNum,
          interestRate: parseFloat(interestRate) || 0,
          minimumPayment: parseFloat(minimumPayment) || 0,
          dueDate,
          lender: lender.trim(),
        });
      } else {
        const now = new Date().toISOString();
        const debt: Debt = {
          id: generateId(),
          name: name.trim(),
          totalAmount: amountNum,
          remainingAmount: amountNum,
          interestRate: parseFloat(interestRate) || 0,
          minimumPayment: parseFloat(minimumPayment) || 0,
          dueDate,
          lender: lender.trim(),
          isPaid: false,
          createdAt: now,
          updatedAt: now,
        };
        await debtRepository.create(debt);
      }
      setShowCreate(false);
      setEditingDebt(null);
      setName('');
      setTotalAmount('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDate('');
      setLender('');
      await loadDebts();
    } catch {
      Alert.alert(t.common.error, t.debt.createFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMakePayment = async () => {
    const amountNum = parseFloat(paymentAmount);
    if (!payingDebt || !amountNum || amountNum <= 0) {
      Alert.alert(t.common.error, t.debt.enterPayment);
      return;
    }
    if (amountNum > payingDebt.remainingAmount) {
      Alert.alert(t.common.error, t.debt.paymentExceeds);
      return;
    }
    setIsPaying(true);
    try {
      await debtRepository.makePayment(payingDebt.id, amountNum);
      setPayingDebt(null);
      setPaymentAmount('');
      await loadDebts();
      setSnackbar({ visible: true, message: t.debt.paymentMade, type: 'success' });
    } catch {
      Alert.alert(t.common.error, t.debt.paymentFailed);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = (debt: Debt) => {
    Alert.alert(
      t.debt.delete,
      translate('debt.deleteConfirm', { name: debt.name }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await debtRepository.delete(debt.id);
              await loadDebts();
              setSnackbar({ visible: true, message: t.common.deletedToast, type: 'success' });
            } catch {
              Alert.alert(t.common.error, t.debt.deleteFailed);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDebts} />;
  }

  if (debts.length === 0 && !showCreate) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={'\uD83D\uDCB8'}
          title={t.debt.noDebts}
          description={t.debt.noDebtsDescription}
          actionLabel={t.debt.addFirst}
          onAction={() => setShowCreate(true)}
        />
      </View>
    );
  }

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalOwed = debts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showCreate ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{editingDebt ? t.debt.edit : t.debt.add}</Text>
          <Input label={t.debt.name} value={name} onChangeText={setName} placeholder={t.debt.namePlaceholder} />
          <Input label={t.debt.totalAmount} value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" placeholder="0.00" />
          <Input label={t.debt.interestRate} value={interestRate} onChangeText={setInterestRate} keyboardType="decimal-pad" placeholder="0.00" />
          <Input label={t.debt.minimumPayment} value={minimumPayment} onChangeText={setMinimumPayment} keyboardType="decimal-pad" placeholder="0.00" />
          <Input label={t.debt.dueDate} value={dueDate} onChangeText={setDueDate} placeholder="2025-12-31" />
          <Input label={t.debt.lender} value={lender} onChangeText={setLender} placeholder={t.debt.lenderPlaceholder} />
          <View style={styles.createActions}>
            <Button title={editingDebt ? t.debt.edit : t.debt.add} onPress={handleSave} loading={isSaving} disabled={!name || !totalAmount || !dueDate} fullWidth size="lg" />
            <View style={styles.spacer} />
            <Button title={t.common.cancel} onPress={() => { setShowCreate(false); setEditingDebt(null); }} variant="ghost" fullWidth />
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t.debt.title}</Text>
            <TouchableOpacity onPress={() => setShowCreate(true)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>+ New</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>{t.debt.totalOwed}</Text>
                <Text style={[styles.overviewValue, { color: colors.expense }]}>{formatCurrency(totalOwed)}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>{t.debt.remaining}</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{formatCurrency(totalRemaining)}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>{t.debt.paid}</Text>
                <Text style={[styles.overviewValue, { color: colors.income }]}>{formatCurrency(totalOwed - totalRemaining)}</Text>
              </View>
            </View>
          </Card>

          <FlatList
            data={debts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const paidPercentage = item.totalAmount > 0
                ? ((item.totalAmount - item.remainingAmount) / item.totalAmount) * 100
                : 0;

              return (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setPayingDebt(item)} onLongPress={() => handleDelete(item)}>
                  <Card style={styles.debtCard}>
                    <View style={styles.debtHeader}>
                      <TouchableOpacity onPress={() => {
                        setEditingDebt(item);
                        setName(item.name);
                        setTotalAmount(item.totalAmount.toString());
                        setInterestRate(item.interestRate.toString());
                        setMinimumPayment(item.minimumPayment.toString());
                        setDueDate(item.dueDate);
                        setLender(item.lender);
                        setShowCreate(true);
                      }}>
                        <Text style={[styles.debtName, { color: colors.text }]}>{item.name}</Text>
                      </TouchableOpacity>
                      {item.lender ? <Text style={[styles.debtLender, { color: colors.textSecondary }]}>{item.lender}</Text> : null}
                    </View>
                    <View style={styles.debtAmounts}>
                      <View style={styles.debtAmountItem}>
                        <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>{t.debt.remaining}</Text>
                        <Text style={[styles.debtAmountValue, { color: colors.expense }]}>{formatCurrency(item.remainingAmount)}</Text>
                      </View>
                      <View style={styles.debtAmountItem}>
                        <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>{t.debt.totalOwed}</Text>
                        <Text style={[styles.debtAmountValue, { color: colors.text }]}>{formatCurrency(item.totalAmount)}</Text>
                      </View>
                      <View style={styles.debtAmountItem}>
                        <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>{t.debt.interestRate}</Text>
                        <Text style={[styles.debtAmountValue, { color: colors.warning }]}>{formatPercentage(item.interestRate)}</Text>
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(paidPercentage, 100)}%` }]} />
                    </View>
                    <View style={styles.debtFooter}>
                      <Text style={[styles.debtDue, { color: colors.textSecondary }]}>{translate('debt.due', { date: formatDate(item.dueDate) })}</Text>
                      <Text style={[styles.debtMinPayment, { color: colors.textSecondary }]}>{translate('debt.minPayment', { amount: formatCurrency(item.minimumPayment) })}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
      <Modal visible={payingDebt !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {translate('debt.makePayment', { name: payingDebt?.name ?? '' })}
            </Text>
            {payingDebt && (
              <Text style={[styles.modalSubtext, { color: colors.textSecondary }]}>
                {translate('debt.remaining', { amount: formatCurrency(payingDebt.remainingAmount) })}
              </Text>
            )}
            <Input
              label={t.debt.paymentAmount}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View style={styles.createActions}>
              <Button
                title={t.debt.pay}
                onPress={handleMakePayment}
                loading={isPaying}
                disabled={!paymentAmount}
                fullWidth
                size="lg"
              />
              <View style={styles.spacer} />
              <Button
                title={t.common.cancel}
                onPress={() => { setPayingDebt(null); setPaymentAmount(''); }}
                variant="ghost"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2 },
  addButton: { ...typography.button },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  createActions: { marginTop: spacing.xl },
  spacer: { height: spacing.md },
  overviewCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  overviewRow: { flexDirection: 'row', gap: spacing.sm },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewLabel: { ...typography.caption, marginBottom: spacing.xs },
  overviewValue: { ...typography.h4, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  debtCard: { marginBottom: spacing.md },
  debtHeader: { marginBottom: spacing.md },
  debtName: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  debtLender: { ...typography.caption },
  debtAmounts: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  debtAmountItem: { flex: 1 },
  debtAmountLabel: { ...typography.caption, marginBottom: spacing.xxs },
  debtAmountValue: { ...typography.bodySmall, fontWeight: '700' },
  progressBar: { height: 6, borderRadius: 3, marginBottom: spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  debtFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  debtDue: { ...typography.caption },
  debtMinPayment: { ...typography.caption },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', borderRadius: 16, padding: spacing.xl },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  modalSubtext: { ...typography.caption, marginBottom: spacing.lg },
});
