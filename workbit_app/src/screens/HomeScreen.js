import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast, useConfirmation } from '../hooks/useNotifications';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todaySpaces, setTodaySpaces] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's available spaces
      const spaces = await ApiService.getAvailableSpaces(today);
      setTodaySpaces(Array.isArray(spaces) ? spaces.slice(0, 3) : []); // Show only first 3
      
      // Load user's reservations
      const allReservations = await ApiService.getAllReservations();
      const userReservations = Array.isArray(allReservations) ? allReservations.filter(
        reservation => reservation.OwnerName === user?.fullname?.split(' ')[0]
      ) : [];
      setMyReservations(userReservations.slice(0, 3)); // Show only recent 3
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't show alert for now as we're transitioning
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return [styles.statusBadge, styles.statusConfirmed];
      case 'pending':
        return [styles.statusBadge, styles.statusPending];
      default:
        return [styles.statusBadge, styles.statusCancelled];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      default: return 'Cancelada';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.greeting}>
              ¡Hola, {user?.fullname?.split(' ')[0] || 'Usuario'}!
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flash-outline" size={20} color="#3b82f6" />
              <Text style={styles.cardTitle}>Acciones Rápidas</Text>
            </View>
            <View style={styles.buttonRow}>
              <Button
                title="Ver Espacios"
                onPress={() => navigation.navigate('Spaces')}
                size="sm"
                style={styles.flexButton}
              />
              <Button
                title="Mis Reservas"
                onPress={() => navigation.navigate('Reservations')}
                variant="outline"
                size="sm"
                style={styles.flexButton}
              />
            </View>
          </View>

          {/* Available Spaces Today */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={20} color="#3b82f6" />
              <Text style={styles.cardTitle}>Espacios Disponibles Hoy</Text>
              <Button
                title="Ver Todos"
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate('Spaces')}
              />
            </View>
            {loading ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : todaySpaces.length > 0 ? (
              todaySpaces.map((space, index) => (
                <View key={index} style={[styles.listItem, index === todaySpaces.length - 1 && styles.lastListItem]}>
                  <View style={styles.listItemHeader}>
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text style={styles.itemTitle}>{space.Name}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Ionicons name="people-outline" size={14} color="#9ca3af" />
                    <Text style={styles.itemSubtitle}>Capacidad: {space.Capacity}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
                <Text style={styles.emptyText}>No hay espacios disponibles</Text>
              </View>
            )}
          </View>

          {/* My Recent Reservations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
              <Text style={styles.cardTitle}>Mis Reservas Recientes</Text>
              <Button
                title="Ver Todas"
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate('Reservations')}
              />
            </View>
            {loading ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : myReservations.length > 0 ? (
              myReservations.map((reservation, index) => (
                <View key={index} style={[styles.listItem, index === myReservations.length - 1 && styles.lastListItem]}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.itemTitle}>{reservation.Reason}</Text>
                    <View style={getStatusBadgeStyle(reservation.Status)}>
                      <Text style={styles.statusText}>{getStatusText(reservation.Status)}</Text>
                    </View>
                  </View>
                  <View style={styles.itemDetails}>
                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                    <Text style={styles.itemSubtitle}>
                      {formatDate(reservation.StartTime)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
                <Text style={styles.emptyText}>No tienes reservas recientes</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <Toast />
      <ConfirmationModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  welcomeContainer: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 16,
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});

export default HomeScreen; 