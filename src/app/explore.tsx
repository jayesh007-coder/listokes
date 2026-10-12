/**
 * Listokes — System Architecture & Developer Guide
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { serverUrl, isServerOnline } = useAuth();

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom },
      ]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <Ionicons name="hardware-chip-outline" size={32} color="#3B82F6" />
          </View>
          <ThemedText type="subtitle">Architecture & Guide</ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={{ textAlign: 'center', maxWidth: 450 }}>
            Listokes is built on a full-stack, server-based AI architecture combining Python
            FastAPI, PostgreSQL, and React Native.
          </ThemedText>
        </View>

        {/* Live Server Status Card */}
        <ThemedView
          type="backgroundElement"
          style={[styles.statusCard, { borderColor: isServerOnline ? '#10B98144' : '#F59E0B44' }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isServerOnline ? '#10B981' : '#F59E0B' },
                ]}
              />
              <ThemedText type="smallBold">
                {isServerOnline ? 'FastAPI Backend Online' : 'Backend Pending Connection'}
              </ThemedText>
            </View>
            <ThemedText type="code" style={{ fontSize: 11 }}>
              v1.0.0
            </ThemedText>
          </View>

          <ThemedText type="code" style={styles.urlCode}>
            ENDPOINT: {serverUrl}
          </ThemedText>

          <ExternalLink href={`${serverUrl}/docs` as any}>
            <View style={[styles.docsButton, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="book-outline" size={16} color={theme.text} />
              <ThemedText type="smallBold">Open Interactive Swagger Docs</ThemedText>
              <Ionicons name="open-outline" size={14} color={theme.textSecondary} />
            </View>
          </ExternalLink>
        </ThemedView>

        {/* Technical Deep Dive Sections */}
        <View style={styles.sectionsWrapper}>
          <Collapsible title="⚡ 1. Python FastAPI Backend">
            <ThemedText type="small">
              The backend is located in <ThemedText type="code">/backend</ThemedText> and runs with
              Uvicorn. It features async request handling, dependency-injected database sessions,
              and HS256 JWT security.
            </ThemedText>
            <ThemedText type="small">
              • <ThemedText type="smallBold">Auth:</ThemedText> Bcrypt password hashing & refresh token rotation.
            </ThemedText>
            <ThemedText type="small">
              • <ThemedText type="smallBold">Endpoints:</ThemedText> /api/v1/auth, /api/v1/tasks, /api/v1/expenses, /api/v1/subscriptions.
            </ThemedText>
          </Collapsible>

          <Collapsible title="🐘 2. PostgreSQL Database & AsyncPG">
            <ThemedText type="small">
              SQLAlchemy 2.0 async engine with <ThemedText type="code">asyncpg</ThemedText> driver for maximum concurrency.
              Every table uses UUID primary keys and strict foreign key isolation.
            </ThemedText>
            <ThemedText type="small">
              • Tables: <ThemedText type="code">users</ThemedText>, <ThemedText type="code">tasks</ThemedText>, <ThemedText type="code">expenses</ThemedText>, <ThemedText type="code">subscriptions</ThemedText>.
            </ThemedText>
            <ThemedText type="small">
              • Migrations: Managed via Alembic (<ThemedText type="code">backend/alembic</ThemedText>).
            </ThemedText>
          </Collapsible>

          <Collapsible title="📱 3. React Native / Expo Frontend">
            <ThemedText type="small">
              Universal Expo application configured with:
            </ThemedText>
            <ThemedText type="small">
              • <ThemedText type="smallBold">Secure Storage:</ThemedText> Encrypted Keychain/Keystore on iOS/Android, localStorage on Web.
            </ThemedText>
            <ThemedText type="small">
              • <ThemedText type="smallBold">Reactive Context:</ThemedText> AuthProvider provides live JWT injection and auto-refresh on 401s.
            </ThemedText>
            <ThemedText type="small">
              • <ThemedText type="smallBold">Cross-Platform:</ThemedText> Runs on iOS, Android, and Web browsers.
            </ThemedText>
          </Collapsible>

          <Collapsible title="🚀 4. How to Run the Server">
            <ThemedText type="small">
              In your terminal, navigate to the backend directory and launch the server:
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.codeBlock}>
              <ThemedText type="code">
                cd backend{'\n'}
                python -m venv venv{'\n'}
                venv\Scripts\activate{'\n'}
                pip install -r requirements.txt{'\n'}
                uvicorn app.main:app --reload --port 8000
              </ThemedText>
            </ThemedView>
            <ThemedText type="small">
              Once started, the green indicator on the Listokes dashboard will light up automatically!
            </ThemedText>
          </Collapsible>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F618',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  statusCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urlCode: {
    fontSize: 12,
    opacity: 0.8,
  },
  docsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionsWrapper: {
    gap: Spacing.three,
  },
  codeBlock: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginVertical: Spacing.one,
  },
});
