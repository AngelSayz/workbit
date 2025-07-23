import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import Button from '../components/Button';

const ReservationsScreen = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const allReservations = await ApiService.getAllReservations();
      const userReservations = allReservations.filter(
        reservation => reservation.OwnerName === user?.fullname?.split(' ')[0]
      );
      setReservations(userReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert('Error', 'No se pudieron cargar las reservas');
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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { style: styles.statusConfirmed, text: 'Confirmada', icon: '✅' };
      case 'pending':
        return { style: styles.statusPending, text: 'Pendiente', icon: '⏳' };
      case 'cancelled':
        return { style: styles.statusCancelled, text: 'Cancelada', icon: '❌' };
      default:
        return { style: styles.statusDefault, text: status, icon: '📋' };
    }
  };

  const getFilteredReservations = () => {
    if (filter === 'all') return reservations;
    return reservations.filter(reservation => reservation.Status === filter);
  };

  const handleCancelReservation = async (reservationId) => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que quieres cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.updateReservationStatus(reservationId, 'cancelled');
              await loadReservations();
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la reserva');
            }
          }
        }
      ]
    );
  };

  const filteredReservations = getFilteredReservations();

  const filterOptions = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'cancelled', label: 'Canceladas' }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mis Reservas</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {filterOptions.map((filterOption) => (
              <TouchableOpacity
                key={filterOption.key}
                onPress={() => setFilter(filterOption.key)}
                style={[
                  styles.filterButton,
                  filter === filterOption.key && styles.filterButtonActive
                ]}
              >
                <Text style={[
                  styles.filterText,
                  filter === filterOption.key && styles.filterTextActive
                ]}>
                  {filterOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Cargando reservas...</Text>
          </View>
        ) : filteredReservations.length > 0 ? (
          <View style={styles.reservationsContainer}>
            {filteredReservations.map((reservation, index) => {
              const statusInfo = getStatusInfo(reservation.Status);
              const isUpcoming = new Date(reservation.StartTime) > new Date();
              const canCancel = reservation.Status === 'pending' || reservation.Status === 'confirmed';
              
              return (
                <View key={index} style={styles.reservationCard}>
                  <View style={styles.reservationHeader}>
                    <Text style={styles.reservationTitle}>{reservation.Reason}</Text>
                    <View style={[styles.statusBadge, statusInfo.style]}>
                      <Text style={styles.statusText}>
                        {statusInfo.icon} {statusInfo.text}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.reservationDetails}>
                    <Text style={styles.detailText}>🏢 {reservation.SpaceName}</Text>
                    <Text style={styles.detailText}>📅 Inicio: {formatDate(reservation.StartTime)}</Text>
                    <Text style={styles.detailText}>🕐 Fin: {formatDate(reservation.EndTime)}</Text>
                  </View>

                  {canCancel && isUpcoming && (
                    <View style={styles.actionButtons}>
                      <Button
                        title="Ver Detalles"
                        variant="outline"
                        size="sm"
                        style={styles.actionButton}
                        onPress={() => {
                          Alert.alert('Información', `Reserva ID: ${reservation.Id}`);
                        }}
                      />
                      <Button
                        title="Cancelar"
                        variant="secondary"
                        size="sm"
                        style={styles.actionButton}
                        onPress={() => handleCancelReservation(reservation.Id)}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'No tienes reservas aún'
                : `No tienes reservas ${filter === 'pending' ? 'pendientes' : filter === 'confirmed' ? 'confirmadas' : 'canceladas'}`
              }
            </Text>
            <Button title="Actualizar" variant="ghost" size="sm" onPress={onRefresh} style={styles.refreshButton} />
          </View>
        )}
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            Alert.alert('Próximamente', 'La funcionalidad de crear reserva será implementada pronto');
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  filterContainer: { marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
  filterButtonActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  filterTextActive: { color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  loadingText: { color: '#9CA3AF', fontSize: 16 },
  emptyIcon: { fontSize: 24, marginBottom: 8 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', fontSize: 16, marginBottom: 16 },
  refreshButton: { marginTop: 16 },
  reservationsContainer: { paddingVertical: 16 },
  reservationCard: { backgroundColor: 'white', borderRadius: 12, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  reservationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reservationTitle: { fontSize: 18, fontWeight: '600', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusConfirmed: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusDefault: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 12, fontWeight: '500' },
  reservationDetails: { marginBottom: 16 },
  detailText: { color: '#6B7280', marginBottom: 4, fontSize: 14 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1 },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  fabButton: { width: 56, height: 56, backgroundColor: '#3b82f6', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
});

export default ReservationsScreen; 