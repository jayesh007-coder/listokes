/**
 * SubscriptionView
 *
 * Manages user tiers (Free, Starter, Pro, Enterprise) and AI feature entitlements.
 * Connects with FastAPI backend endpoints (/subscriptions/me, /subscriptions/me/cancel).
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { subscriptionService } from '@/services/api';
import type { Subscription, SubscriptionPlan } from '@/services/types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: string;
  popular?: boolean;
  color: string;
  features: string[];
}[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '$0/mo',
    color: '#6B7280',
    features: ['Up to 50 active tasks', 'Standard expense logging', 'Basic categorization'],
  },
  {
    id: 'starter',
    name: 'Productivity Starter',
    price: '$9/mo',
    color: '#3B82F6',
    features: [
      'Unlimited tasks & categories',
      'Monthly spending forecasting',
      'PostgreSQL cloud database sync',
    ],
  },
  {
    id: 'pro',
    name: 'AI Life Optimization (Pro)',
    price: '$19/mo',
    popular: true,
    color: '#8B5CF6',
    features: [
      'AI Task Auto-Prioritizer & Daily Scheduler',
      'Smart Expense Leakage Detection',
      'Weekly Life Optimization Reports',
      'Real-time Multi-Device Cloud Sync',
    ],
  },
  {
    id: 'enterprise',
    name: 'Executive & Team',
    price: '$49/mo',
    color: '#EC4899',
    features: [
      'Everything in Pro tier',
      'Dedicated Life Coaching Model',
      'Priority REST API Access & Custom Webhooks',
      '24/7 Dedicated Support',
    ],
  },
];

interface SubscriptionViewProps {
  onRequireAuth?: () => void;
}

export function SubscriptionView({ onRequireAuth }: SubscriptionViewProps) {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<SubscriptionPlan | null>(null);

  const fetchSubscription = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await subscriptionService.get();
      setSub(data);
    } catch (err) {
      console.warn('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated]);

  // ── Switch Plan ──────────────────────────────────────────

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (sub?.plan === plan) return;

    setUpdating(plan);
    try {
      const updated = await subscriptionService.update({ plan });
      setSub(updated);
      const msg = `Plan updated to ${plan.toUpperCase()}!`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Subscription Updated', msg);
      }
    } catch (err: any) {
      const errDetail = err.detail || err.message || 'Failed to update plan';
      if (Platform.OS === 'web') alert(errDetail);
      else Alert.alert('Error', errDetail);
    } finally {
      setUpdating(null);
    }
  };

  // ── Cancel Subscription ──────────────────────────────────

  const handleCancel = async () => {
    const doCancel = async () => {
      try {
        const cancelled = await subscriptionService.cancel();
        setSub(cancelled);
        const msg = 'Subscription cancelled successfully.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);
      } catch (err: any) {
        const errDetail = err.detail || err.message || 'Failed to cancel';
        if (Platform.OS === 'web') alert(errDetail);
        else Alert.alert('Error', errDetail);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Cancel your current subscription?')) {
        await doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your current subscription?',
        [
          { text: 'Keep Plan', style: 'cancel' },
          { text: 'Cancel Subscription', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  // Unauthenticated prompt
  if (!isAuthenticated) {
    return (
      <ThemedView type="backgroundElement" style={styles.authPromptCard}>
        <Ionicons name="sparkles" size={48} color="#8B5CF6" />
        <ThemedText type="subtitle">Listokes AI Subscriptions</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ textAlign: 'center', maxWidth: 380 }}>
          Unlock autonomous AI life scheduling, behavioral spending suggestions, and unlimited
          cloud sync.
        </ThemedText>
        <Pressable
          onPress={onRequireAuth}
          style={[styles.primaryButton, { backgroundColor: '#8B5CF6' }]}>
          <Ionicons name="log-in-outline" size={18} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            Sign In / Register
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const currentPlan = sub?.plan || 'free';
  const currentStatus = sub?.status || 'active';

  return (
    <View style={styles.container}>
      {/* Current Plan Card */}
      <ThemedView
        type="backgroundElement"
        style={[styles.currentPlanCard, { borderColor: '#8B5CF644', borderWidth: 1 }]}>
        <View style={styles.currentPlanHeader}>
          <View>
            <ThemedText type="code" style={{ fontSize: 11, color: '#8B5CF6' }}>
              CURRENT MEMBERSHIP
            </ThemedText>
            <ThemedText type="subtitle" style={{ textTransform: 'capitalize' }}>
              {currentPlan} Plan
            </ThemedText>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: currentStatus === 'active' ? '#10B98122' : '#EF444422',
                borderColor: currentStatus === 'active' ? '#10B98166' : '#EF444466',
              },
            ]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: currentStatus === 'active' ? '#10B981' : '#EF4444' },
              ]}
            />
            <ThemedText
              type="code"
              style={{
                color: currentStatus === 'active' ? '#10B981' : '#EF4444',
                fontSize: 11,
                textTransform: 'uppercase',
              }}>
              {currentStatus}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Started on: {sub?.started_at || 'Today'}
          {sub?.expires_at ? ` • Expires: ${sub.expires_at}` : ' • Active subscription'}
        </ThemedText>

        {currentStatus === 'active' && currentPlan !== 'free' && (
          <Pressable onPress={handleCancel} style={styles.cancelLink}>
            <ThemedText type="small" style={{ color: '#EF4444' }}>
              Cancel Subscription
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>

      {/* Plan Tier Selection */}
      <View style={styles.tierSection}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Choose Your AI Tier
        </ThemedText>

        {loading ? (
          <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.plansList}>
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isUpdatingThis = updating === plan.id;

              return (
                <ThemedView
                  key={plan.id}
                  type="backgroundElement"
                  style={[
                    styles.planCard,
                    plan.popular && { borderColor: '#8B5CF6', borderWidth: 1.5 },
                  ]}>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                      <ThemedText type="code" style={styles.popularBadgeText}>
                        MOST POPULAR
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View>
                      <ThemedText type="default" style={{ fontWeight: '700' }}>
                        {plan.name}
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.priceText}>
                        {plan.price}
                      </ThemedText>
                    </View>

                    {isCurrent && (
                      <View style={[styles.activeTag, { backgroundColor: '#10B98122' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <ThemedText type="code" style={{ color: '#10B981', fontSize: 11 }}>
                          ACTIVE
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Features */}
                  <View style={styles.featuresList}>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Ionicons name="checkmark-sharp" size={16} color={plan.color} />
                        <ThemedText type="small" style={{ flex: 1 }}>
                          {feat}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Action button */}
                  <Pressable
                    onPress={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || isUpdatingThis}
                    style={[
                      styles.planButton,
                      isCurrent
                        ? { backgroundColor: theme.backgroundSelected }
                        : { backgroundColor: plan.color },
                    ]}>
                    {isUpdatingThis ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText
                        type="smallBold"
                        style={{ color: isCurrent ? theme.textSecondary : '#fff' }}>
                        {isCurrent ? 'Current Plan' : `Switch to ${plan.name.split(' ')[0]}`}
                      </ThemedText>
                    )}
                  </Pressable>
                </ThemedView>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.four,
  },
  currentPlanCard: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tierSection: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
  },
  plansList: {
    gap: Spacing.three,
  },
  planCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.four,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuresList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  planButton: {
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  authPromptCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
