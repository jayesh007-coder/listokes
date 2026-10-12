/**
 * AuthModal
 *
 * Polished modal for user registration and login, with validation,
 * error reporting, and one-tap demo account testing.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ visible, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const theme = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
  };

  const fillDemoAccount = () => {
    setEmail('demo@listokes.ai');
    setPassword('Password123!');
    if (mode === 'register') {
      setFullName('Alex Mercer');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        await register({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          password: password.trim(),
        });
      } else {
        await login({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
      }
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ThemedView
          type="backgroundElement"
          style={[styles.modalCard, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <ThemedText type="subtitle">
                  {mode === 'login' ? 'Sign In to Listokes' : 'Create an Account'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {mode === 'login'
                    ? 'Access your AI life dashboard & data'
                    : 'Get started with AI task & expense optimization'}
                </ThemedText>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Mode Switch Tabs */}
            <View
              style={[
                styles.tabContainer,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <Pressable
                onPress={() => handleSwitchMode('login')}
                style={[
                  styles.tabButton,
                  mode === 'login' && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText
                  type="smallBold"
                  themeColor={mode === 'login' ? 'text' : 'textSecondary'}>
                  Sign In
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleSwitchMode('register')}
                style={[
                  styles.tabButton,
                  mode === 'register' && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText
                  type="smallBold"
                  themeColor={mode === 'register' ? 'text' : 'textSecondary'}>
                  Register
                </ThemedText>
              </Pressable>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <ThemedText type="small" style={styles.errorText}>
                  {errorMessage}
                </ThemedText>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {mode === 'register' && (
                <View style={styles.inputWrapper}>
                  <ThemedText type="small" style={styles.label}>
                    Full Name
                  </ThemedText>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Alex Mercer"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <ThemedText type="small" style={styles.label}>
                  Email Address
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="alex@example.com"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              <View style={styles.inputWrapper}>
                <ThemedText type="small" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Quick Demo Helper */}
            <Pressable onPress={fillDemoAccount} style={styles.demoButton}>
              <Ionicons name="sparkles-outline" size={15} color="#8B5CF6" />
              <ThemedText type="small" style={{ color: '#8B5CF6' }}>
                Fill Demo Credentials
              </ThemedText>
            </Pressable>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, loading && styles.buttonDisabled]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="default" style={styles.submitButtonText}>
                  {mode === 'login' ? 'Sign In' : 'Create Free Account'}
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    backgroundColor: '#EF444422',
    borderColor: '#EF444455',
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  errorText: {
    color: '#EF4444',
    flex: 1,
  },
  formGroup: {
    gap: Spacing.two,
  },
  inputWrapper: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    height: 50,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
