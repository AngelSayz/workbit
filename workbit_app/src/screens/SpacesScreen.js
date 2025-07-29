import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import GridLayout from '../components/GridLayout';
import ApiService from '../services/api';
import Button from '../components/Button';

const SpacesScreen = ({ navigation }) => {
  const [spaces, setSpaces] = useState([]);
  const [gridConfig, setGridConfig] = useState({ rows: 5, cols: 8 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

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
        'Espacio no disponible',
        `El espacio "${space.name}" está ${getStatusText(space.status).toLowerCase()}.`
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

  const handleReservation = () => {
    if (selectedSpace) {
      setShowReservationModal(false);
      // Navegar a la pantalla de reserva con el espacio seleccionado
      navigation.navigate('Reservations', { selectedSpace });
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
        <Text style={styles.title}>Espacios</Text>
        <Text style={styles.subtitle}>Layout visual de cubículos</Text>
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
              <Button
                title="✕"
                variant="ghost"
                size="sm"
                onPress={() => setShowReservationModal(false)}
              />
            </View>
            
            {selectedSpace && (
              <View style={styles.spaceDetails}>
                <Text style={styles.spaceName}>{selectedSpace.name}</Text>
                <Text style={styles.spaceInfo}>Capacidad: {selectedSpace.capacity} personas</Text>
                <Text style={styles.spaceInfo}>Estado: {getStatusText(selectedSpace.status)}</Text>
              </View>
            )}

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
                style={styles.modalButton}
              />
            </View>
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
  spaceDetails: {
    marginBottom: 24,
  },
  spaceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  spaceInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
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