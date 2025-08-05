import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import GridLayout from '../components/GridLayout';
import ApiService from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

const SpacesScreen = ({ navigation }) => {
  const [spaces, setSpaces] = useState([]);
  const [gridConfig, setGridConfig] = useState({ rows: 5, cols: 8 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  });
  const [creatingReservation, setCreatingReservation] = useState(false);

  useEffect(() => {
    loadSpacesData();
  }, []);

  const loadSpacesData = async () => {
    try {
      setLoading(true);
      // Cargar configuración de grilla y espacios
      const response = await ApiService.getGridSpaces();
      if (response && response.success) {
        setSpaces(response.data.spaces || []);
        setGridConfig(response.data.grid || { rows: 5, cols: 8 });
      } else {
        // Fallback si no hay configuración de grilla
        const spacesResponse = await ApiService.getAllSpaces();
        setSpaces(Array.isArray(spacesResponse) ? spacesResponse : []);
      }
    } catch (error) {
      console.error('Error loading spaces data:', error);
      Alert.alert('Error', 'No se pudieron cargar los espacios. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSpacesData();
    setRefreshing(false);
  };

  const handleSpacePress = (space) => {
    if (space.status === 'available') {
      setSelectedSpace(space);
      setShowReservationModal(true);
    } else {
      Alert.alert(
        'Información del Espacio',
        `${space.name}\n` +
        `Estado: ${getStatusText(space.status)}\n` +
        `Capacidad: ${space.capacity} personas\n` +
        `Posición: (${space.position_x}, ${space.position_y})`,
        [{ text: 'Cerrar' }]
      );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupado';
      case 'reserved': return 'Reservado';
      case 'maintenance': return 'En mantenimiento';
      case 'unavailable': return 'No disponible';
      default: return 'Desconocido';
    }
  };

  const handleReservation = async () => {
    if (!selectedSpace || !reason.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setCreatingReservation(true);
      
      // Crear las fechas de inicio y fin
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      // Validar que la hora de fin sea después de la de inicio
      if (endDateTime <= startDateTime) {
        Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      const reservationData = {
        reason: reason.trim(),
        space_id: selectedSpace.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        participants: []
      };

      await ApiService.createReservation(reservationData);
      
      Alert.alert(
        'Reserva Creada',
        `Se ha creado tu reserva para ${selectedSpace.name}`,
        [{ text: 'OK', onPress: () => {
          setShowReservationModal(false);
          setReason('');
          setSelectedSpace(null);
        }}]
      );
      
      // Recargar espacios para actualizar el estado
      await loadSpacesData();

    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', 'No se pudo crear la reserva. Inténtalo de nuevo.');
    } finally {
      setCreatingReservation(false);
    }
  };

  const getStatusStats = () => {
    const stats = {
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      unavailable: 0,
    };

    spaces.forEach(space => {
      if (stats.hasOwnProperty(space.status)) {
        stats[space.status]++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Ionicons name="grid-outline" size={48} color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando espacios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mapa de Cubículos</Text>
        <Text style={styles.subtitle}>Selecciona un espacio disponible para reservar</Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statText}>Disponible: {stats.available}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.statText}>Ocupado: {stats.occupied}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.statText}>Reservado: {stats.reserved}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#9E9E9E' }]} />
            <Text style={styles.statText}>Mantenimiento: {stats.maintenance}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Grid Layout */}
      <View style={styles.gridContainer}>
        <GridLayout
          spaces={spaces}
          gridConfig={gridConfig}
          onSpacePress={handleSpacePress}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          💡 Usa gestos para hacer zoom y desplazarte por la grilla
        </Text>
        <Text style={styles.instructionsText}>
          👆 Toca un espacio disponible para reservarlo
        </Text>
      </View>

      {/* Reservation Modal */}
      <Modal
        visible={showReservationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reservar Espacio</Text>
              <TouchableOpacity
                onPress={() => setShowReservationModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {selectedSpace && (
              <ScrollView style={styles.reservationForm}>
                <View style={styles.spaceInfo}>
                  <Text style={styles.spaceName}>{selectedSpace.name}</Text>
                  <Text style={styles.spaceCapacity}>Capacidad: {selectedSpace.capacity} personas</Text>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Motivo de la reserva</Text>
                  <Input
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Ej: Reunión de equipo, trabajo individual..."
                    multiline
                    style={styles.reasonInput}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Fecha</Text>
                  <TouchableOpacity style={styles.dateInput}>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    <Text style={styles.dateText}>
                      {selectedDate.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeSection}>
                  <View style={styles.timeInput}>
                    <Text style={styles.formLabel}>Hora de inicio</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text style={styles.timeText}>
                        {startTime.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeInput}>
                    <Text style={styles.formLabel}>Hora de fin</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text style={styles.timeText}>
                        {endTime.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={() => setShowReservationModal(false)}
                    style={styles.modalButton}
                  />
                  <Button
                    title="Reservar"
                    onPress={handleReservation}
                    loading={creatingReservation}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  gridContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  instructionsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 24,
    maxHeight: '80%',
    minWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  reservationForm: {
    flex: 1,
  },
  spaceInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  spaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  spaceCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  reasonInput: {
    minHeight: 80,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  timeInput: {
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default SpacesScreen;