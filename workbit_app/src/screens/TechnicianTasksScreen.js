import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

const statusMeta = {
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  in_progress: { label: 'En progreso', color: '#3B82F6', bg: '#DBEAFE' },
  completed: { label: 'Completada', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelada', color: '#EF4444', bg: '#FEE2E2' },
};

const TaskCard = ({ task, onChangeStatus }) => {
  const renderRightActions = () => (
    <View style={styles.swipeActionsRight}>
      <Button title="En progreso" size="sm" variant="outline" style={[styles.actionBtn, styles.actionOutline]} onPress={() => onChangeStatus(task.id, 'in_progress')} />
      <Button title="Cancelar" size="sm" style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => onChangeStatus(task.id, 'cancelled')} />
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.swipeActionsLeft}>
      <Button title="Completar" size="sm" style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => onChangeStatus(task.id, 'completed')} />
    </View>
  );

  const meta = statusMeta[task.status] || statusMeta.pending;

  return (
    <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}> 
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={styles.taskDesc}>{task.description}</Text>
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="alert-circle-outline" size={16} color="#9CA3AF" />
            <Text style={styles.metaText}>Prioridad: {task.priority}</Text>
          </View>
          {task.spaces?.name && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metaText}>{task.spaces.name}</Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );
};

const TechnicianTasksScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await ApiService.getTasks();
      const mine = Array.isArray(list) ? list.filter(t => !t.assigned_to || t.assigned_to === user?.id) : [];
      setTasks(mine);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await ApiService.updateTaskStatus(id, status);
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.header}> 
          <Text style={styles.title}>Mis Tareas</Text>
          <Text style={styles.subtitle}>Desliza una tarjeta: derecha = completar, izquierda = más opciones</Text>
        </View>

        <View style={styles.content}>
          {loading ? (
            <Text style={styles.muted}>Cargando...</Text>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={32} color="#9CA3AF" />
              <Text style={styles.muted}>No tienes tareas asignadas</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {tasks.map(t => (
                <TaskCard key={t.id} task={t} onChangeStatus={changeStatus} />
              ))}
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { color: '#6B7280', marginTop: 4 },
  content: { padding: 16 },
  muted: { color: '#9CA3AF', textAlign: 'center', padding: 16 },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  taskDesc: { color: '#6B7280', marginBottom: 12 },
  taskMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6B7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  swipeActionsRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  swipeActionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8, justifyContent: 'flex-start' },
  actionBtn: { borderRadius: 8 },
  actionOutline: { borderColor: '#3B82F6' },
});

export default TechnicianTasksScreen;
