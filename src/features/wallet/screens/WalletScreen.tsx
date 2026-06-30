import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { useWallets } from '../hooks/useWallets';
import { Wallet } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils';

export function WalletScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const {
    wallets,
    isLoading,
    error,
    totalBalance,
    createWallet,
    archiveWallet,
    refresh,
  } = useWallets();

  const handleCreate = async () => {
    const success = await createWallet(t.wallet.mainWallet);
    if (!success) {
      Alert.alert(t.common.error, t.wallet.createFailed);
    }
  };

  const handleArchive = (wallet: Wallet) => {
    Alert.alert(
      t.wallet.archive,
      translate('wallet.archiveConfirm', { name: wallet.name }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.wallet.archive,
          style: 'destructive',
          onPress: () => archiveWallet(wallet.id),
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.wallet.title}
        </Text>
        <Text style={[styles.totalBalance, { color: colors.primary }]}>
          {t.wallet.totalBalance}: {formatCurrency(totalBalance)}
        </Text>
      </View>

      {wallets.length === 0 ? (
        <EmptyState
          title={t.wallet.noWallets}
          description={t.wallet.noWalletsDescription}
          actionLabel={t.wallet.createFirst}
          onAction={handleCreate}
        />
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.walletItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onLongPress={() => handleArchive(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.walletIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={[styles.walletIconText, { color: item.color }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={[styles.walletName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.walletCurrency, { color: colors.textSecondary }]}>
                  {item.currency}
                </Text>
              </View>
              <Text style={[styles.walletBalance, { color: colors.text }]}>
                {formatCurrency(item.balance, item.currency)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  totalBalance: {
    ...typography.numberSmall,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  walletIconText: {
    ...typography.h3,
    fontWeight: '700',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  walletCurrency: {
    ...typography.caption,
  },
  walletBalance: {
    ...typography.h4,
    fontWeight: '700',
  },
});
