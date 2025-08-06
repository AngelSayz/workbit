import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, ScrollView, RefreshControl, TouchableOpacity, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import GridLayout from '../components/GridLayout';
import ApiService from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast, useConfirmation } from '../hooks/useNotifications';

const SpacesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const styles = getStyles(insets);
  const [spaces, setSpaces] = useState([]);
  const [gridConfig, setGridConfig] = useState({ rows: 5, cols: 8 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState(60); // Duración en minutos (por defecto 1 hora)
  const [creatingReservation, setCreatingReservation] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [participantRows, setParticipantRows] = useState([{ id: 1, username: '', isValidating: false, isValid: null }]);
  const [validatingUsers, setValidatingUsers] = useState(new Set());

  // Notification hooks
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const { confirmation, showConfirmation, handleConfirm, handleCancel } = useConfirmation();

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
      showToast('No se pudieron cargar los espacios. Inténtalo de nuevo.', 'error');
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
      const info = [
        `Estado: ${getStatusText(space.status)}`,
        `Capacidad: ${space.capacity} personas`,
        `Posición: (${space.position_x}, ${space.position_y})`
      ].join('\n');
      
      showToast(`${space.name}\n\n${info}`, 'info');
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

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      // Mantener la hora actual pero cambiar solo la fecha
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setSelectedDate(newDate);
      
      // También actualizar startTime para mantener consistencia
      const newStartTime = new Date(startTime);
      newStartTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setStartTime(newStartTime);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      // Crear nueva fecha con la fecha seleccionada pero nueva hora
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setStartTime(newStartTime);
      
      // También actualizar selectedDate para mantener consistencia
      setSelectedDate(newStartTime);
    }
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setReason('');
    setDuration(60);
    setParticipants([]);
    setNewParticipant('');
    setParticipantRows([{ id: 1, username: '', isValidating: false, isValid: null }]);
    setValidatingUsers(new Set());
  };

  const validateUser = async (username, rowId) => {
    if (!username.trim()) return;

    setValidatingUsers(prev => new Set([...prev, rowId]));
    
    try {
      // Aquí deberías hacer la llamada a tu API para verificar si el usuario existe
      const response = await ApiService.validateUser(username.trim());
      
      setParticipantRows(prev => prev.map(row => 
        row.id === rowId 
          ? { ...row, isValidating: false, isValid: response.exists }
          : row
      ));

      if (response.exists) {
        // Si el usuario es válido, agregarlo a participantes y preparar nueva fila
        setParticipants(prev => [...prev, username.trim()]);
        
        // Solo agregar nueva fila si no hemos alcanzado el límite del espacio
        const maxCapacity = selectedSpace?.capacity || 1;
        const currentRows = participantRows.filter(row => row.isValid).length;
        
        if (currentRows < maxCapacity - 1) { // -1 porque el owner también ocupa espacio
          const newId = Math.max(...participantRows.map(r => r.id)) + 1;
          setParticipantRows(prev => [...prev, { id: newId, username: '', isValidating: false, isValid: null }]);
        }
      }
    } catch (error) {
      console.error('Error validando usuario:', error);
      setParticipantRows(prev => prev.map(row => 
        row.id === rowId 
          ? { ...row, isValidating: false, isValid: false }
          : row
      ));
    }

    setValidatingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
  };

  const updateParticipantRow = (rowId, username) => {
    setParticipantRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, username, isValid: null } // Resetear el estado de validación al escribir
        : row
    ));
  };

  const removeParticipantRow = (rowId) => {
    setParticipantRows(prev => prev.filter(row => row.id !== rowId));
    setParticipants(prev => {
      const rowToRemove = participantRows.find(row => row.id === rowId);
      return prev.filter(username => username !== rowToRemove?.username);
    });
  };

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleReservation = async () => {
    if (!selectedSpace || !reason.trim()) {
      showError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setCreatingReservation(true);
      
      // Combinar fecha y hora de inicio
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      // Calcular hora de fin basada en la duración
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      // Validar que la reserva no sea en el pasado
      const now = new Date();
      if (startDateTime <= now) {
        showError('No puedes crear reservas en el pasado. Selecciona una fecha y hora futuras.');
        return;
      }

      // Crear fecha en formato ISO pero usando la hora local como si fuera UTC
      // Esto hace que la hora que el usuario selecciona sea exactamente la que se guarda
      const formatLocalAsUTC = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Formato ISO pero con la hora local (sin conversión de zona horaria)
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      };

      const reservationData = {
        reason: reason.trim(),
        space_id: selectedSpace.id,
        start_time: formatLocalAsUTC(startDateTime),
        end_time: formatLocalAsUTC(endDateTime),
        participants: participantRows
          .filter(row => row.isValid === true && row.username.trim())
          .map(row => row.username.trim())
      };

      console.log('📋 Datos de reserva a enviar:', JSON.stringify(reservationData, null, 2));
      console.log('🕐 Start time local:', startDateTime.toString());
      console.log('🕑 End time local:', endDateTime.toString());
      console.log('🌐 Start time como UTC:', reservationData.start_time);
      console.log('🌐 End time como UTC:', reservationData.end_time);
      console.log('⏱️ Duration:', duration, 'minutes');
      console.log('🏢 Space ID:', selectedSpace.id);
      console.log('📝 Reason:', reason.trim());

      await ApiService.createReservation(reservationData);
      
      // Cerrar modal primero
      closeReservationModal();
      
      // Mostrar notificación de éxito
      showSuccess(`Reserva creada exitosamente para ${selectedSpace.name}`, 4000);
      
      // Recargar espacios para actualizar el estado
      await loadSpacesData();

    } catch (error) {
      console.error('❌ Error creating reservation:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'No se pudo crear la reserva';
      
      if (error.message.includes('already reserved')) {
        errorMessage = 'El espacio ya está reservado para ese horario. Por favor selecciona otro horario.';
      } else if (error.message.includes('not available')) {
        errorMessage = 'El espacio no está disponible para reservas en este momento.';
      } else if (error.message.includes('past')) {
        errorMessage = 'No puedes crear reservas en el pasado.';
      } else if (error.message.includes('Validation failed')) {
        errorMessage = 'Datos inválidos. Verifica la información e intenta de nuevo.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      showError(errorMessage, 5000);
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
          onEmptySpacePress={() => showToast('Esta posición no tiene un cubículo asignado', 'info')}
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
        onRequestClose={closeReservationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>{selectedSpace?.name}</Text>
                <View style={styles.capacityInfo}>
                  <Ionicons name="person-outline" size={16} color="#6b7280" />
                  <Text style={styles.capacityText}>{selectedSpace?.capacity}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={closeReservationModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {selectedSpace && (
              <ScrollView style={styles.reservationForm}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Motivo de la reserva</Text>
                  <Input
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Describe el propósito de tu reserva..."
                    multiline
                    numberOfLines={3}
                    style={styles.reasonInput}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Fecha y hora de inicio</Text>
                  <View style={styles.dateTimeRow}>
                    <TouchableOpacity 
                      style={[styles.dateInput, { flex: 1, marginRight: 8 }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                      <Text style={styles.dateText}>
                        {selectedDate.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.timeButton, { flex: 1, marginLeft: 8 }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text style={styles.timeText}>
                        {startTime.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Duración de la reunión</Text>
                  <View style={styles.durationOptions}>
                    {[30, 60, 120, 180].map((minutes) => (
                      <TouchableOpacity
                        key={minutes}
                        style={[
                          styles.durationButton,
                          duration === minutes && styles.durationButtonActive
                        ]}
                        onPress={() => setDuration(minutes)}
                      >
                        <Text style={[
                          styles.durationText,
                          duration === minutes && styles.durationTextActive
                        ]}>
                          {minutes === 30 ? '30 min' : 
                           minutes === 60 ? '1 hora' :
                           minutes === 120 ? '2 horas' : '3 horas'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <View style={styles.durationSummary}>
                    <Text style={styles.durationSummaryText}>
                      La reunión terminará a las{' '}
                      {(() => {
                        const endTime = new Date(selectedDate);
                        endTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
                        endTime.setMinutes(endTime.getMinutes() + duration);
                        return endTime.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      })()}
                    </Text>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>
                    Invitados (opcional) - Máximo {Math.max(0, (selectedSpace?.capacity || 1) - 1)} invitados
                  </Text>
                  
                  {selectedSpace?.capacity > 1 ? (
                    <View style={styles.participantsContainer}>
                      {participantRows.map((row, index) => (
                        <View key={row.id} style={styles.participantRow}>
                          <TextInput
                            value={row.username}
                            onChangeText={(text) => updateParticipantRow(row.id, text)}
                            placeholder={
                              row.isValid === false 
                                ? "❌ Usuario no encontrado" 
                                : `Nombre de usuario del invitado ${index + 1}`
                            }
                            placeholderTextColor={row.isValid === false ? '#ef4444' : '#9ca3af'}
                            style={[
                              styles.participantInputField,
                              row.isValid === false && styles.participantInputError,
                              row.isValid === true && styles.participantInputSuccess
                            ]}
                            editable={row.isValid !== true}
                          />
                          
                          {row.isValid !== true && (
                            <TouchableOpacity
                              style={[
                                styles.validateButton,
                                (!row.username.trim() || validatingUsers.has(row.id)) && styles.validateButtonDisabled
                              ]}
                              onPress={() => validateUser(row.username, row.id)}
                              disabled={!row.username.trim() || validatingUsers.has(row.id)}
                            >
                              {validatingUsers.has(row.id) ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                              ) : (
                                <Ionicons 
                                  name="add" 
                                  size={20} 
                                  color={row.username.trim() ? '#3b82f6' : '#9ca3af'} 
                                />
                              )}
                            </TouchableOpacity>
                          )}
                          
                          {row.isValid === true && (
                            <TouchableOpacity
                              style={styles.removeParticipantButton}
                              onPress={() => removeParticipantRow(row.id)}
                            >
                              <Ionicons name="close" size={20} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noInvitesText}>
                      Este espacio tiene capacidad para 1 persona únicamente. No se pueden agregar invitados.
                    </Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={closeReservationModal}
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

      {/* Selectores de Fecha y Hora */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Toast Notifications */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onDismiss={hideToast}
        position="top"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmation.visible}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        type={confirmation.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={confirmation.loading}
      />
    </SafeAreaView>
  );
};

const getStyles = (insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingBottom: 56, // Espacio exacto para TabBar (sin duplicar insets.bottom)
  },
  header: {
    paddingHorizontal: 16,
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
    paddingHorizontal: 16, // Márgenes laterales para stats
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
    paddingHorizontal: 16, // Márgenes laterales para el grid
  },
  instructionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 56, // Espacio exacto para TabBar (sin duplicar insets.bottom)
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
    marginHorizontal: 16,
    height: '80%',
    width: '90%',
    maxWidth: 400,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  reservationForm: {
    flex: 1,
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
    width: '100%',
    textAlignVertical: 'top',
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
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  durationTextActive: {
    color: 'white',
  },
  durationSummary: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  durationSummaryText: {
    fontSize: 12,
    color: '#0369a1',
    textAlign: 'center',
  },
  participantInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  participantInput: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  participantsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  participantName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  removeButton: {
    marginLeft: 8,
  },
  participantsContainer: {
    gap: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantInputField: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
  },
  participantInputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  participantInputSuccess: {
    borderColor: '#10b981',
    borderWidth: 1,
    backgroundColor: '#f0fdf4',
  },
  validateButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  removeParticipantButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noInvitesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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