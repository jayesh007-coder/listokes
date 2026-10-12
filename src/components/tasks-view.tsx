/**
 * TasksView
 *
 * Full-featured Task management interface connected to the FastAPI backend.
 * Supports task creation, status toggle, filtering, priority badges, and deletion.
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
import { taskService } from '@/services/api';
import type { Task, TaskPriority, TaskStatus } from '@/services/types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TasksViewProps {
  onRequireAuth?: () => void;
}

export function TasksView({ onRequireAuth }: TasksViewProps) {
  const { isAuthenticated, isServerOnline } = useAuth();
  const theme = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // New Task Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState('Personal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Fetch Tasks ──────────────────────────────────────────

  const fetchTasks = async (showSpinner = true) => {
    if (!isAuthenticated) return;
    if (showSpinner) setLoading(true);
    try {
      const filters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      };
      const data = await taskService.list(filters);
      setTasks(data);
    } catch (err: any) {
      console.warn('Failed to load tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated, statusFilter, priorityFilter]);

  // ── Toggle Status ────────────────────────────────────────

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await taskService.update(task.id, { status: nextStatus });
    } catch {
      // Rollback on error
      fetchTasks(false);
    }
  };

  // ── Delete Task ──────────────────────────────────────────

  const deleteTask = async (taskId: string) => {
    const doDelete = async () => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      try {
        await taskService.delete(taskId);
      } catch {
        fetchTasks(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Delete this task?')) {
        await doDelete();
      }
    } else {
      Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ── Create Task ──────────────────────────────────────────

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await taskService.create({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        category: newCategory.trim() || undefined,
      });

      setTasks((prev) => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setModalVisible(false);
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Priority Colors ──────────────────────────────────────

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const percentComplete = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // If not logged in
  if (!isAuthenticated) {
    return (
      <ThemedView type="backgroundElement" style={styles.authPromptCard}>
        <Ionicons name="checkbox-outline" size={48} color="#3B82F6" />
        <ThemedText type="subtitle">AI Task Optimizer</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ textAlign: 'center', maxWidth: 380 }}>
          Tasks are synchronized in real-time with your FastAPI PostgreSQL server. Sign in to
          organize your priorities and access AI life insights.
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
      {/* Header with Metrics & Add Button */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="subtitle">Tasks & Focus</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {doneCount} of {totalCount} completed ({percentComplete}%)
          </ThemedText>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => fetchTasks(true)}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="refresh" size={18} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.primaryButton, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              New Task
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.progressBarFill, { width: `${percentComplete}%` }]} />
      </View>

      {/* Status Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filterChip,
              statusFilter === s
                ? { backgroundColor: '#3B82F6' }
                : { backgroundColor: theme.backgroundElement },
            ]}>
            <ThemedText
              type="smallBold"
              style={{
                color: statusFilter === s ? '#fff' : theme.textSecondary,
                textTransform: 'capitalize',
              }}>
              {s.replace('_', ' ')}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Task List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
            Loading tasks from server...
          </ThemedText>
        </View>
      ) : tasks.length === 0 ? (
        <ThemedView type="backgroundElement" style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.textSecondary} />
          <ThemedText type="default">No tasks found</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tap "+ New Task" to schedule your next achievement.
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.taskList}>
          {tasks.map((task) => {
            const isDone = task.status === 'done';
            const priorityColor = getPriorityColor(task.priority);

            return (
              <ThemedView
                key={task.id}
                type="backgroundElement"
                style={[styles.taskCard, isDone && styles.taskCardDone]}>
                {/* Checkbox */}
                <Pressable
                  onPress={() => toggleTaskStatus(task)}
                  hitSlop={8}
                  style={styles.checkboxTouch}>
                  <Ionicons
                    name={isDone ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isDone ? '#10B981' : theme.textSecondary}
                  />
                </Pressable>

                {/* Content */}
                <View style={styles.taskContent}>
                  <ThemedText
                    type="default"
                    style={[
                      styles.taskTitle,
                      isDone && { textDecorationLine: 'line-through', opacity: 0.6 },
                    ]}>
                    {task.title}
                  </ThemedText>

                  {task.description ? (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={2}
                      style={isDone && { opacity: 0.5 }}>
                      {task.description}
                    </ThemedText>
                  ) : null}

                  {/* Badges Row */}
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { borderColor: priorityColor, backgroundColor: `${priorityColor}15` },
                      ]}>
                      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                      <ThemedText
                        type="code"
                        style={{ color: priorityColor, fontSize: 11, textTransform: 'uppercase' }}>
                        {task.priority}
                      </ThemedText>
                    </View>

                    {task.category && (
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: theme.backgroundSelected },
                        ]}>
                        <ThemedText type="code" style={{ fontSize: 11 }}>
                          📁 {task.category}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Delete button */}
                <Pressable
                  onPress={() => deleteTask(task.id)}
                  hitSlop={10}
                  style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </ThemedView>
            );
          })}
        </View>
      )}

      {/* Create Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView
            type="backgroundElement"
            style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add New Task</ThemedText>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {errorMsg && (
              <ThemedText type="small" style={{ color: '#EF4444' }}>
                {errorMsg}
              </ThemedText>
            )}

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.fieldLabel}>
                Title *
              </ThemedText>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Complete quarterly budget review"
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

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.fieldLabel}>
                Description
              </ThemedText>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Details, subtasks, notes..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                style={[
                  styles.textArea,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
              />
            </View>

            {/* Priority Selection */}
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.fieldLabel}>
                Priority
              </ThemedText>
              <View style={styles.prioritySelector}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                  const color = getPriorityColor(p);
                  const isSelected = newPriority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setNewPriority(p)}
                      style={[
                        styles.prioritySelectBtn,
                        isSelected && { borderColor: color, backgroundColor: `${color}25` },
                      ]}>
                      <View style={[styles.priorityDot, { backgroundColor: color }]} />
                      <ThemedText
                        type="small"
                        style={[
                          { textTransform: 'capitalize' },
                          isSelected && { color, fontWeight: '700' },
                        ]}>
                        {p}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category selection */}
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.fieldLabel}>
                Category
              </ThemedText>
              <View style={styles.categoryPills}>
                {['Personal', 'Work', 'Health', 'Finance', 'Study'].map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setNewCategory(cat)}
                    style={[
                      styles.categoryPill,
                      newCategory === cat
                        ? { backgroundColor: '#3B82F6' }
                        : { backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText
                      type="small"
                      style={{ color: newCategory === cat ? '#fff' : theme.textSecondary }}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleCreateTask}
              disabled={submitting}
              style={[styles.primaryButton, { backgroundColor: '#3B82F6', height: 48, marginTop: 8 }]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  Save Task to Server
                </ThemedText>
              )}
            </Pressable>
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
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: Spacing.four,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Spacing.three,
    marginRight: Spacing.two,
  },
  taskList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  taskCardDone: {
    opacity: 0.7,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 4,
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
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputGroup: {
    gap: 4,
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
  textArea: {
    minHeight: 70,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  prioritySelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Spacing.two,
  },
});
