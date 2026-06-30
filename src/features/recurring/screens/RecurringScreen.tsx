import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage, Button, Input, ScreenHeader } from '../../../shared/components';
import { recurringRepository } from '../../../core/repositories/recurringRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { RecurringTransaction, Category, Wallet } from '../../../shared/types';
import { formatCurrency, formatDate, generateId } from '../../../shared/utils';

export function RecurringScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [items, allCategories, activeWallets] = await Promise.all([
        recurringRepository.findAllActive(),
        categoryRepository.findAllMapped(),
        walletRepository.findAllActive(),
      ]);
      setRecurring(items);
      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
      setWallets(activeWallets);
      if (activeWallets.length > 0) setWalletId(activeWallets[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.recurring.loadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0 || !categoryId || !walletId || !nextDate.trim()) {
      Alert.alert(t.common.error, t.recurring.allFieldsRequired);
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const item: RecurringTransaction = {
        id: generateId(),
        walletId,
        categoryId,
        amount: amountNum,
        type,
        description: description.trim(),
        frequency,
        interval: 1,
        nextDate,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await recurringRepository.create(item);
      setShowCreate(false);
      setDescription('');
      setAmount('');
      setCategoryId('');
      setNextDate('');
      await loadData();
    } catch {
      Alert.alert(t.common.error, t.recurring.createFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: RecurringTransaction) => {
    Alert.alert(
      t.recurring.delete,
      translate('recurring.deleteConfirm', { name: item.description || t.recurring.description }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete, style: 'destructive',
          onPress: async () => {
            try {
              await recurringRepository.delete(item.id);
              await loadData();
            } catch { Alert.alert(t.common.error, t.recurring.deleteFailed); }
          },
        },
      ]
    );
  };

  const filteredCategories = Object.values(categories).filter((c) => c.type === type);

  if (isLoading) return <LoadingScreen type="list" />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  if (recurring.length === 0 && !showCreate) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title={t.recurring.title}
          rightAction={
            <TouchableOpacity onPress={() => setShowCreate(true)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>+ New</Text>
            </TouchableOpacity>
          }
        />
        <EmptyState
          icon={'\uD83D\uDD04'}
          title={t.recurring.noRecurring}
          description={t.recurring.noRecurringDescription}
          actionLabel={t.recurring.addFirst}
          onAction={() => setShowCreate(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      {showCreate ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.formTitle, { color: colors.text }]}>{t.recurring.add}</Text>
          <View style={[styles.typeToggle, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'expense' && { backgroundColor: colors.expense }]}
              onPress={() => { setType('expense'); setCategoryId(''); }}
            >
              <Text style={{ color: type === 'expense' ? colors.textOnPrimary : colors.text }}>{t.recurring.expense}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'income' && { backgroundColor: colors.income }]}
              onPress={() => { setType('income'); setCategoryId(''); }}
            >
              <Text style={{ color: type === 'income' ? colors.textOnPrimary : colors.text }}>{t.recurring.income}</Text>
            </TouchableOpacity>
          </View>
          <Input label={t.recurring.description} value={description} onChangeText={setDescription} placeholder={t.recurring.descriptionPlaceholder} />
          <Input label={t.recurring.amount} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.recurring.category}</Text>
          <View style={styles.optionsRow}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, { backgroundColor: categoryId === cat.id ? cat.color : colors.surfaceVariant, borderColor: categoryId === cat.id ? cat.color : colors.border }]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={{ color: categoryId === cat.id ? colors.textOnPrimary : colors.text }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.recurring.wallet}</Text>
          <View style={styles.optionsRow}>
            {wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.chip, { backgroundColor: walletId === w.id ? w.color : colors.surfaceVariant, borderColor: walletId === w.id ? w.color : colors.border }]}
                onPress={() => setWalletId(w.id)}
              >
                <Text style={{ color: walletId === w.id ? colors.textOnPrimary : colors.text }}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.recurring.frequency}</Text>
          <View style={styles.optionsRow}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, { backgroundColor: frequency === f ? colors.primary : colors.surfaceVariant, borderColor: frequency === f ? colors.primary : colors.border }]}
                onPress={() => setFrequency(f)}
              >
                <Text style={{ color: frequency === f ? colors.textOnPrimary : colors.text }}>
                  {t.recurring[f as keyof typeof t.recurring]?.toString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label={t.recurring.nextDate} value={nextDate} onChangeText={setNextDate} placeholder={t.recurring.nextDatePlaceholder} />
          <View style={styles.createActions}>
            <Button title={t.recurring.save} onPress={handleCreate} loading={isSaving} disabled={!amount || !categoryId || !nextDate} fullWidth size="lg" />
            <View style={styles.spacer} />
            <Button title={t.common.cancel} onPress={() => setShowCreate(false)} variant="ghost" fullWidth />
          </View>
        </ScrollView>
      ) : (
        <>
          <ScreenHeader
            title={t.recurring.title}
            rightAction={
              <TouchableOpacity onPress={() => setShowCreate(true)}>
                <Text style={[styles.addButton, { color: colors.primary }]}>+ New</Text>
              </TouchableOpacity>
            }
          />
          <FlatList
            data={recurring}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const category = categories[item.categoryId];
              return (
                <TouchableOpacity activeOpacity={0.7} onLongPress={() => handleDelete(item)}>
                  <View style={[styles.recurringItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.recurringHeader}>
                      <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? colors.income : colors.expense }]} />
                      <View style={styles.recurringInfo}>
                        <Text style={[styles.recurringDescription, { color: colors.text }]}>{item.description || category?.name || t.common.noData}</Text>
                        <Text style={[styles.recurringCategory, { color: colors.textSecondary }]}>{category?.name || t.common.unknown} · {t.recurring[item.frequency as keyof typeof t.recurring]?.toString()}</Text>
                      </View>
                      <Text style={[styles.recurringAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </Text>
                    </View>
                    <View style={styles.recurringFooter}>
                      <Text style={[styles.recurringNext, { color: colors.textSecondary }]}>{translate('recurring.next', { date: formatDate(item.nextDate) })}</Text>
                      {item.endDate && <Text style={[styles.recurringEnd, { color: colors.textTertiary }]}>{translate('recurring.until', { date: formatDate(item.endDate) })}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formTitle: { ...typography.h2, marginBottom: spacing.lg },
  addButton: { ...typography.button },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  fieldLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  createActions: { marginTop: spacing.xl },
  spacer: { height: spacing.md },
  typeToggle: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing.xs, marginBottom: spacing.xl },
  typeButton: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  recurringItem: { padding: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1 },
  recurringHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  typeIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: spacing.md },
  recurringInfo: { flex: 1 },
  recurringDescription: { ...typography.body, fontWeight: '500', marginBottom: 2 },
  recurringCategory: { ...typography.caption },
  recurringAmount: { ...typography.body, fontWeight: '700' },
  recurringFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: spacing.lg },
  recurringNext: { ...typography.caption },
  recurringEnd: { ...typography.caption },
});
