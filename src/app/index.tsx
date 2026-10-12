/**
 * Listokes — AI Life Optimization Dashboard
 *
 * Flagship home screen connected to the FastAPI PostgreSQL server.
 * Combines Tasks, Expenses, Subscriptions, and Profile controls.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { ServerStatusBanner } from '@/components/server-status-banner';
import { AuthModal } from '@/components/auth-modal';
import { TasksView } from '@/components/tasks-view';
import { ExpensesView } from '@/components/expenses-view';
import { SubscriptionView } from '@/components/subscription-view';
import { ProfileView } from '@/components/profile-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActiveTab = 'tasks' | 'expenses' | 'subscription' | 'profile';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const TABS: { id: ActiveTab; label: string; icon: string; color: string }[] = [
    { id: 'tasks', label: 'Tasks', icon: 'checkbox-outline', color: '#3B82F6' },
    { id: 'expenses', label: 'Expenses', icon: 'pie-chart-outline', color: '#10B981' },
    { id: 'subscription', label: 'AI Plans', icon: 'sparkles-outline', color: '#8B5CF6' },
    { id: 'profile', label: 'Profile', icon: 'person-outline', color: '#6366F1' },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Server Connectivity Banner */}
          <ServerStatusBanner />

          {/* Hero Branding & User Info */}
          <View style={styles.headerHero}>
            <View style={styles.heroTextGroup}>
              <View style={styles.brandRow}>
                <ThemedText type="title" style={styles.brandTitle}>
                  Listokes
                </ThemedText>
                <View style={[styles.aiPill, { backgroundColor: '#8B5CF625' }]}>
                  <Ionicons name="sparkles" size={13} color="#8B5CF6" />
                  <ThemedText type="code" style={styles.aiPillText}>
                    AI OPTIMIZER
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {isAuthenticated
                  ? `Welcome back, ${user?.full_name} • Cloud sync active`
                  : 'Server-backed personal tasks, finances & life optimization'}
              </ThemedText>
            </View>

            {/* Quick Auth Trigger */}
            {!isAuthenticated ? (
              <Pressable
                onPress={() => setAuthModalVisible(true)}
                style={[styles.authButton, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="log-in-outline" size={16} color="#fff" />
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  Sign In
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setActiveTab('profile')}
                style={[styles.userBadge, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="person-circle" size={20} color="#3B82F6" />
                <ThemedText type="smallBold" numberOfLines={1} style={{ maxWidth: 100 }}>
                  {user?.full_name?.split(' ')[0]}
                </ThemedText>
              </Pressable>
            )}
          </View>

          {/* Segment Navigation */}
          <View
            style={[
              styles.segmentContainer,
              { backgroundColor: theme.backgroundElement },
            ]}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.segmentButton,
                    isActive && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Ionicons
                    name={tab.icon as any}
                    size={17}
                    color={isActive ? tab.color : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.segmentLabel,
                      { color: isActive ? theme.text : theme.textSecondary },
                      isActive && { fontWeight: '700' },
                    ]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Active Tab View */}
          <View style={styles.viewContainer}>
            {activeTab === 'tasks' && (
              <TasksView onRequireAuth={() => setAuthModalVisible(true)} />
            )}
            {activeTab === 'expenses' && (
              <ExpensesView onRequireAuth={() => setAuthModalVisible(true)} />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionView onRequireAuth={() => setAuthModalVisible(true)} />
            )}
            {activeTab === 'profile' && (
              <ProfileView onRequireAuth={() => setAuthModalVisible(true)} />
            )}
          </View>
        </ScrollView>

        {/* Global Auth Modal */}
        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  headerHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  heroTextGroup: {
    flex: 1,
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiPillText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Spacing.two,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Spacing.five,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Spacing.two,
  },
  segmentLabel: {
    fontSize: 13,
  },
  viewContainer: {
    width: '100%',
    marginTop: Spacing.two,
  },
});
