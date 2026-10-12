/**
 * ExpensesView
 *
 * Expense tracking and financial analytics view connected to the FastAPI backend.
 * Provides monthly category summaries, expense logging, and history.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { expenseService } from '@/services/api';
import type { Expense, ExpenseCategory, ExpenseSummary } from '@/services/types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES: { label: string; value: ExpenseCategory; icon: string; color: string }[] = [
  { label: 'Food & Dining', value: 'food', icon: 'restaurant-outline', color: '#F59E0B' },
  { label: 'Transport', value: 'transport', icon: 'car-outline', color: '#3B82F6' },
  { label: 'Housing', value: 'housing', icon: 'home-outline', color: '#8B5CF6' },
  { label: 'Utilities', value: 'utilities', icon: 'flash-outline', color: '#06B6D4' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film-outline', color: '#EC4899' },
  { label: 'Health', value: 'health', icon: 'fitness-outline', color: '#10B981' },
  { label: 'Shopping', value: 'shopping', icon: 'bag-handle-outline', color: '#F97316' },
  { label: 'Education', value: 'education', icon: 'school-outline', color: '#6366F1' },
  { label: 'Savings', value: 'savings', icon: 'wallet-outline', color: '#14B8A6' },
  { label: 'Other', value: 'other', icon: 'pricetag-outline', color: '#6B7280' },
];

interface ExpensesViewProps {
  onRequireAuth?: () => void;
}

export function ExpensesView({ onRequireAuth }: ExpensesViewProps) {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaries, setSummaries] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // New Expense Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, _setCurrency] = useState('USD');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('food');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // ── Fetch Data ───────────────────────────────────────────

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [listData, summaryData] = await Promise.all([
        expenseService.list(),
        expenseService.summary(currentYear, currentMonth).catch(() => []),
      ]);
      setExpenses(listData);
      setSummaries(summaryData);
    } catch (err: any) {
      console.warn('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // ── Create Expense ───────────────────────────────────────

  const handleCreateExpense = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await expenseService.create({
        amount: parsedAmount,
        currency,
        category: selectedCategory,
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
      });

      setExpenses((prev) => [created, ...prev]);
      // re-fetch summary
      expenseService
        .summary(currentYear, currentMonth)
        .then(setSummaries)
        .catch(() => {});

      setAmount('');
      setMerchant('');
      setDescription('');
      setModalVisible(false);
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Expense ───────────────────────────────────────

  const handleDeleteExpense = async (id: string) => {
    const doDelete = async () => {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      try {
        await expenseService.delete(id);
        expenseService
          .summary(currentYear, currentMonth)
          .then(setSummaries)
          .catch(() => {});
      } catch {
        fetchData();
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Delete this expense entry?')) {
        await doDelete();
      }
    } else {
      Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const totalMonthlySpend = summaries.reduce((acc, curr) => acc + curr.total, 0);

  // If not authenticated
  if (!isAuthenticated) {
    return (
      <ThemedView type="backgroundElement" style={styles.authPromptCard}>
        <Ionicons name="pie-chart-outline" size={48} color="#10B981" />
        <ThemedText type="subtitle">AI Expense Analytics</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ textAlign: 'center', maxWidth: 380 }}>
          Track daily transactions, observe monthly category distributions, and receive AI
          spending optimization insights with PostgreSQL storage.
        </ThemedText>
        <Pressable
          onPress={onRequireAuth}
          style={[styles.primaryButton, { backgroundColor: '#10B981' }]}>
          <Ionicons name="log-in-outline" size={18} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            Sign In / Register
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="subtitle">Expenses & Budget</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </ThemedText>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={fetchData}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="refresh" size={18} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: '#10B981' }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              Log Expense
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Monthly Summary Hero Card */}
      <ThemedView
        type="backgroundElement"
        style={[styles.heroCard, { borderColor: '#10B98133', borderWidth: 1 }]}>
        <View style={styles.heroTopRow}>
          <View>
            <ThemedText type="code" style={styles.heroSubLabel}>
              TOTAL SPENT THIS MONTH
            </ThemedText>
            <ThemedText type="title" style={styles.heroAmount}>
              ${totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </ThemedText>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: '#10B98122' }]}>
            <Ionicons name="trending-up-outline" size={18} color="#10B981" />
            <ThemedText type="code" style={{ color: '#10B981', fontSize: 11 }}>
              LIVE SYNC
            </ThemedText>
          </View>
        </View>

        {/* Category Breakdown Bars */}
        {summaries.length > 0 && (
          <View style={styles.breakdownContainer}>
            <ThemedText type="code" style={styles.breakdownTitle}>
              CATEGORY BREAKDOWN
            </ThemedText>
            {summaries.slice(0, 4).map((s) => {
              const meta = CATEGORIES.find((c) => c.value === s.category) || CATEGORIES[9];
              const pct = totalMonthlySpend > 0 ? (s.total / totalMonthlySpend) * 100 : 0;
              return (
                <View key={s.category || 'other'} style={styles.barRow}>
                  <View style={styles.barLabelGroup}>
                    <ThemedText type="small" style={{ textTransform: 'capitalize' }}>
                      {meta.label}
                    </ThemedText>
                    <ThemedText type="smallBold">${s.total.toFixed(2)}</ThemedText>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: theme.backgroundSelected }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: meta.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ThemedView>

      {/* Expense History List */}
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold">Recent Transactions ({expenses.length})</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : expenses.length === 0 ? (
        <ThemedView type="backgroundElement" style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
          <ThemedText type="default">No expenses recorded yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tap "+ Log Expense" to track your spending.
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.expenseList}>
          {expenses.map((expense) => {
            const meta = CATEGORIES.find((c) => c.value === expense.category) || CATEGORIES[9];

            return (
              <ThemedView key={expense.id} type="backgroundElement" style={styles.expenseCard}>
                <View style={[styles.iconCircle, { backgroundColor: `${meta.color}22` }]}>
                  <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                </View>

                <View style={styles.expenseMain}>
                  <ThemedText type="default" style={{ fontWeight: '600' }}>
                    {expense.merchant || meta.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {expense.description || meta.label} • {expense.expense_date}
                  </ThemedText>
                </View>

                <View style={styles.expenseRight}>
                  <ThemedText type="default" style={styles.expenseAmountText}>
                    -${Number(expense.amount).toFixed(2)}
                  </ThemedText>
                  <Pressable
                    onPress={() => handleDeleteExpense(expense.id)}
                    hitSlop={8}
                    style={{ marginTop: 4 }}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </ThemedView>
            );
          })}
        </View>
      )}

      {/* Log Expense Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView
            type="backgroundElement"
            style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Log New Expense</ThemedText>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              {errorMsg && (
                <ThemedText type="small" style={{ color: '#EF4444', marginBottom: 8 }}>
                  {errorMsg}
                </ThemedText>
              )}

              {/* Amount & Currency */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Amount ({currency}) *
                </ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                      fontSize: 20,
                      fontWeight: '700',
                    },
                  ]}
                />
              </View>

              {/* Merchant / Vendor */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Merchant / Payee
                </ThemedText>
                <TextInput
                  value={merchant}
                  onChangeText={setMerchant}
                  placeholder="e.g. Whole Foods, Uber, Netflix"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              {/* Category Picker */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Category
                </ThemedText>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <Pressable
                        key={cat.value}
                        onPress={() => setSelectedCategory(cat.value)}
                        style={[
                          styles.catItem,
                          isSelected && {
                            borderColor: cat.color,
                            backgroundColor: `${cat.color}25`,
                          },
                        ]}>
                        <Ionicons
                          name={cat.icon as any}
                          size={18}
                          color={isSelected ? cat.color : theme.textSecondary}
                        />
                        <ThemedText
                          type="small"
                          style={[
                            { fontSize: 12 },
                            isSelected && { color: cat.color, fontWeight: '700' },
                          ]}>
                          {cat.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Note / Description
                </ThemedText>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional notes..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              <Pressable
                onPress={handleCreateExpense}
                disabled={submitting}
                style={[
                  styles.primaryButton,
                  { backgroundColor: '#10B981', height: 48, marginTop: Spacing.three },
                ]}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    Save Expense to Server
                  </ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  heroCard: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  breakdownContainer: {
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    paddingTop: Spacing.two,
  },
  breakdownTitle: {
    fontSize: 10,
    opacity: 0.7,
  },
  barRow: {
    gap: 4,
  },
  barLabelGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
  },
  expenseList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseMain: {
    flex: 1,
    gap: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  authPromptCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  inputGroup: {
    gap: 4,
    marginBottom: Spacing.two,
  },
  fieldLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  textInput: {
    height: 46,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
