import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import Button from '../components/Button';

const ReservationsScreen = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeReservation, setActiveReservation] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const allReservations = await ApiService.getAllReservations();
      const userReservations = Array.isArray(allReservations) ? allReservations.filter(
        reservation => reservation.OwnerName === user?.fullname?.split(' ')[0]
      ) : [];
      
      setReservations(userReservations);
      
      // Find active reservation (confirmed and current time is within reservation period)
      const active = userReservations.find(res => 
        res.Status === 'confirmed' && 
        new Date() >= new Date(res.StartTime) && 
        new Date() <= new Date(res.EndTime)
      );
      setActiveReservation(active);
      
    } catch (error) {
      console.error('Error loading reservations:', error);
      // Don't show alert for now as we're transitioning API
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle-outline';
      case 'pending': return 'time-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.Status === filter;
  });

  const isReservationActive = (reservation) => {
    const now = new Date();
    const start = new Date(reservation.StartTime);
    const end = new Date(reservation.EndTime);
    return reservation.Status === 'confirmed' && now >= start && now <= end;
  };

  const FilterButton = ({ filterType, title, isActive }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        isActive && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ReservationCard = ({ reservation, isActive = false }) => (
    <TouchableOpacity 
      style={[
        styles.reservationCard,
        isActive && styles.activeReservationCard
      ]}
      activeOpacity={0.7}
    >
      {isActive && (
        <View style={styles.activeIndicator}>
          <View style={styles.activeIndicatorDot} />
          <Text style={styles.activeIndicatorText}>Reserva Activa</Text>
        </View>
      )}
      
      <View style={styles.reservationHeader}>
        <View style={styles.reservationTitle}>
          <Ionicons name="calendar-outline" size={18} color="#3b82f6" />
          <Text style={styles.reservationReason}>{reservation.Reason}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(reservation.Status)}20` }]}>
          <Ionicons 
            name={getStatusIcon(reservation.Status)} 
            size={14} 
            color={getStatusColor(reservation.Status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(reservation.Status) }]}>
            {getStatusText(reservation.Status)}
          </Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{reservation.SpaceName || 'Espacio no especificado'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatTime(reservation.StartTime)} - {formatTime(reservation.EndTime)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(reservation.StartTime)}</Text>
        </View>
      </View>

      {isActive && (
        <View style={styles.activeActions}>
          <Text style={styles.activeActionsTitle}>Monitoreo en Tiempo Real</Text>
          <Text style={styles.workingOnItText}>Working on it...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Reservas</Text>
        <Text style={styles.subtitle}>
          {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'} en total
        </Text>
      </View>

      {/* Active Reservation Alert */}
      {activeReservation && (
        <View style={styles.activeAlert}>
          <View style={styles.activeAlertHeader}>
            <Ionicons name="radio-outline" size={20} color="#10b981" />
            <Text style={styles.activeAlertTitle}>Tienes una reserva activa</Text>
          </View>
          <Text style={styles.activeAlertText}>
            {activeReservation.Reason} • Termina a las {formatTime(activeReservation.EndTime)}
          </Text>
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <FilterButton filterType="all" title="Todas" isActive={filter === 'all'} />
          <FilterButton filterType="confirmed" title="Confirmadas" isActive={filter === 'confirmed'} />
          <FilterButton filterType="pending" title="Pendientes" isActive={filter === 'pending'} />
          <FilterButton filterType="cancelled" title="Canceladas" isActive={filter === 'cancelled'} />
        </ScrollView>
      </View>

      {/* Reservations List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Cargando reservas...</Text>
          </View>
        ) : filteredReservations.length > 0 ? (
          <View style={styles.reservationsContainer}>
            {filteredReservations.map((reservation, index) => (
              <ReservationCard 
                key={index} 
                reservation={reservation} 
                isActive={isReservationActive(reservation)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No tienes reservas' : `No tienes reservas ${filter === 'confirmed' ? 'confirmadas' : filter === 'pending' ? 'pendientes' : 'canceladas'}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              Las reservas que realices aparecerán aquí
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  filterContainer: { marginBottom: 8 },
  filterScroll: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
  filterButtonActive: { backgroundColor: '#3b82f6' },
  filterButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  filterButtonTextActive: { color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  loadingText: { color: '#9CA3AF', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  reservationsContainer: { paddingVertical: 16 },
  reservationCard: { backgroundColor: 'white', borderRadius: 12, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  activeReservationCard: {
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  activeIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  reservationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reservationTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reservationReason: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500', marginLeft: 8 },
  reservationDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { color: '#6B7280', marginLeft: 8, fontSize: 14 },
  activeActions: { marginTop: 16 },
  activeActionsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  workingOnItText: { fontSize: 12, color: '#6B7280' },
  activeAlert: {
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  activeAlertText: {
    fontSize: 14,
    color: '#10b981',
  },
});

export default ReservationsScreen; 