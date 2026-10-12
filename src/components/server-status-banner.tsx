/**
 * ServerStatusBanner
 *
 * Displays live backend connectivity status with quick retry and
 * a dialog to change the backend server URL (e.g. testing on physical devices or web).
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
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

export function ServerStatusBanner() {
  const { serverUrl, isServerOnline, updateServerUrl } = useAuth();
  const theme = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleOpenModal = () => {
    setInputUrl(serverUrl);
    setTestResult(null);
    setModalVisible(true);
  };

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await updateServerUrl(inputUrl.trim());
      if (ok) {
        setTestResult(' Connected successfully!');
        setTimeout(() => setModalVisible(false), 900);
      } else {
        setTestResult(' Could not reach backend at that address.');
      }
    } catch (err: any) {
      setTestResult(` Connection error: ${err.message || 'Failed'}`);
    } finally {
      setTesting(false);
    }
  };

  const isOnline = isServerOnline === true;
  const isChecking = isServerOnline === null;

  return (
    <>
      <Pressable onPress={handleOpenModal} style={styles.bannerWrapper}>
        <ThemedView
          type="backgroundElement"
          style={[
            styles.bannerContainer,
            isOnline ? styles.onlineBorder : styles.offlineBorder,
          ]}>
          <View style={styles.leftInfo}>
            <View
              style={[
                styles.dot,
                isChecking
                  ? styles.dotChecking
                  : isOnline
                  ? styles.dotOnline
                  : styles.dotOffline,
              ]}
            />
            <ThemedText type="small" style={styles.serverText}>
              {isChecking
                ? 'Connecting to backend...'
                : isOnline
                ? `Backend Online • ${serverUrl.replace(/^https?:\/\//, '')}`
                : `Backend Offline • Tap to configure URL`}
            </ThemedText>
          </View>

          <View style={styles.rightAction}>
            <ThemedText type="code" style={styles.actionText}>
              {isOnline ? 'Config' : 'Fix'}
            </ThemedText>
            <Ionicons
              name={isOnline ? 'cloud-done-outline' : 'warning-outline'}
              size={15}
              color={isOnline ? '#10B981' : '#F59E0B'}
            />
          </View>
        </ThemedView>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView
            type="backgroundElement"
            style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="server-outline" size={22} color={theme.text} />
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Backend Server URL
                </ThemedText>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.modalDesc}>
              The Listokes mobile frontend communicates with the FastAPI backend over REST.
              Default: <ThemedText type="code">http://localhost:8000</ThemedText> (Web/iOS) or{' '}
              <ThemedText type="code">http://10.0.2.2:8000</ThemedText> (Android emulator).
            </ThemedText>

            <TextInput
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g. http://192.168.1.100:8000"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.urlInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                },
              ]}
            />

            {testResult && (
              <ThemedText
                type="small"
                style={[
                  styles.testResultText,
                  testResult.includes('') ? styles.successColor : styles.errorColor,
                ]}>
                {testResult}
              </ThemedText>
            )}

            <View style={styles.modalButtonsRow}>
              <Pressable
                onPress={() => setInputUrl('https://listokes-api.onrender.com')}
                style={styles.presetButton}>
                <ThemedText type="small" style={{ color: '#8B5CF6', fontWeight: '600' }}>
                  ☁️ Cloud
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setInputUrl('http://10.236.142.84:8000')}
                style={styles.presetButton}>
                <ThemedText type="small" style={{ color: '#10B981', fontWeight: '600' }}>
                  📱 Wi-Fi:8000
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setInputUrl('http://10.236.142.84:8081')}
                style={styles.presetButton}>
                <ThemedText type="small" style={{ color: '#3B82F6', fontWeight: '600' }}>
                  ⚡ Wi-Fi:8081
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setInputUrl('http://localhost:8000');
                }}
                style={styles.presetButton}>
                <ThemedText type="small">Local</ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSaveAndTest}
                disabled={testing}
                style={[styles.saveButton, testing && styles.buttonDisabled]}>
                {testing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    Save & Test
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  onlineBorder: {
    borderColor: '#10B98144',
  },
  offlineBorder: {
    borderColor: '#F59E0B66',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#F59E0B',
  },
  dotChecking: {
    backgroundColor: '#6B7280',
  },
  serverText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  urlInput: {
    height: 46,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
  },
  testResultText: {
    fontSize: 13,
    marginVertical: 2,
  },
  successColor: {
    color: '#10B981',
  },
  errorColor: {
    color: '#EF4444',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  presetButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
