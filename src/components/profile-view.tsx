/**
 * ProfileView
 *
 * Account management, security (password change), and backend diagnostic controls.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { authService } from '@/services/api';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProfileViewProps {
  onRequireAuth?: () => void;
}

export function ProfileView({ onRequireAuth }: ProfileViewProps) {
  const { user, isAuthenticated, logout, serverUrl, isServerOnline, pingServer } = useAuth();
  const theme = useTheme();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPassMsg({ type: 'err', text: 'Please fill both password fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setPassMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
      return;
    }

    setChangingPass(true);
    setPassMsg(null);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPassMsg({ type: 'ok', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassMsg({ type: 'err', text: err.detail || err.message || 'Failed to update password' });
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to log out?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <ThemedView type="backgroundElement" style={styles.authPromptCard}>
        <Ionicons name="person-circle-outline" size={48} color="#3B82F6" />
        <ThemedText type="subtitle">Account & Settings</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ textAlign: 'center', maxWidth: 380 }}>
          Sign in or register to manage your personal profile, credentials, and cloud preferences.
        </ThemedText>
        <Pressable
          onPress={onRequireAuth}
          style={[styles.primaryButton, { backgroundColor: '#3B82F6' }]}>
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
      {/* Profile Card */}
      <ThemedView type="backgroundElement" style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatarCircle, { backgroundColor: '#3B82F622' }]}>
            <ThemedText type="title" style={{ color: '#3B82F6', fontSize: 24, lineHeight: 28 }}>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="default" style={{ fontWeight: '700', fontSize: 18 }}>
              {user.full_name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {user.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ThemedText type="code" style={{ fontSize: 11, opacity: 0.7 }}>
            USER ID: {user.id}
          </ThemedText>
          <ThemedText type="code" style={{ fontSize: 11, opacity: 0.7 }}>
            ACTIVE STATUS: {user.is_active ? 'ACTIVE' : 'INACTIVE'}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Backend Diagnostics Card */}
      <ThemedView type="backgroundElement" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color={theme.text} />
          <ThemedText type="smallBold">Server Connection</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Target Endpoint:
          </ThemedText>
          <ThemedText type="code" style={{ fontSize: 12 }}>
            {serverUrl}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Connection State:
          </ThemedText>
          <View style={styles.statusDotRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isServerOnline ? '#10B981' : '#EF4444' },
              ]}
            />
            <ThemedText
              type="smallBold"
              style={{ color: isServerOnline ? '#10B981' : '#EF4444' }}>
              {isServerOnline ? 'Online (FastAPI 0.115)' : 'Unreachable'}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={() => pingServer()}
          style={[styles.smallButton, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="sync-outline" size={16} color={theme.text} />
          <ThemedText type="small">Test Backend Ping</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Change Password Card */}
      <ThemedView type="backgroundElement" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
          <ThemedText type="smallBold">Security & Password</ThemedText>
        </View>

        {passMsg && (
          <ThemedText
            type="small"
            style={{ color: passMsg.type === 'ok' ? '#10B981' : '#EF4444' }}>
            {passMsg.text}
          </ThemedText>
        )}

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Current Password
          </ThemedText>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.backgroundSelected,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            New Password
          </ThemedText>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.backgroundSelected,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={handleChangePassword}
          disabled={changingPass}
          style={[styles.smallButton, { backgroundColor: '#3B82F6' }]}>
          {changingPass ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              Update Password
            </ThemedText>
          )}
        </Pressable>
      </ThemedView>

      {/* Log out button */}
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
          Log Out from Server
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  profileCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    paddingTop: Spacing.two,
  },
  sectionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    marginTop: 4,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#EF444455',
    backgroundColor: '#EF444415',
    marginBottom: Spacing.six,
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
