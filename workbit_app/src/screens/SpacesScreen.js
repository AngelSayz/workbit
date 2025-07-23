import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ApiService from '../services/api';
import Button from '../components/Button';

const SpacesScreen = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadSpaces();
  }, [selectedDate]);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const availableSpaces = await ApiService.getAvailableSpaces(formattedDate);
      setSpaces(availableSpaces);
    } catch (error) {
      console.error('Error loading spaces:', error);
      Alert.alert('Error', 'No se pudieron cargar los espacios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSpaces();
    setRefreshing(false);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long' 
    });
  };

  const getCapacityIcon = (capacity) => {
    if (capacity <= 2) return '👤';
    if (capacity <= 8) return '👥';
    if (capacity <= 20) return '🏢';
    return '🏟️';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Espacios Disponibles
        </Text>
        
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <Button
            title="◀"
            variant="ghost"
            size="sm"
            onPress={() => changeDate(-1)}
          />
          <Text style={styles.dateText}>
            {formatDate(selectedDate)}
          </Text>
          <Button
            title="▶"
            variant="ghost"
            size="sm"
            onPress={() => changeDate(1)}
          />
        </View>
      </View>

      {/* Spaces List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Cargando espacios...</Text>
          </View>
        ) : spaces.length > 0 ? (
          <View style={styles.spacesContainer}>
            {spaces.map((space, index) => (
              <TouchableOpacity
                key={index}
                style={styles.spaceCard}
                activeOpacity={0.7}
              >
                <View style={styles.spaceHeader}>
                  <Text style={styles.spaceName}>
                    {space.Name}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      Disponible
                    </Text>
                  </View>
                </View>
                
                <View style={styles.spaceInfo}>
                  <Text style={styles.infoText}>
                    📍 {space.Location || 'Ubicación no especificada'}
                  </Text>
                  <Text style={styles.infoText}>
                    {getCapacityIcon(space.Capacity)} {space.Capacity} personas
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    title="Ver Detalles"
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert(
                        'Próximamente', 
                        'La funcionalidad de reserva será implementada pronto'
                      );
                    }}
                  />
                  <Button
                    title="Reservar"
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert(
                        'Próximamente', 
                        'La funcionalidad de reserva será implementada pronto'
                      );
                    }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              No hay espacios disponibles para la fecha seleccionada
            </Text>
            <Button
              title="Actualizar"
              variant="ghost"
              size="sm"
              onPress={onRefresh}
              style={styles.refreshButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  refreshButton: {
    marginTop: 16,
  },
  spacesContainer: {
    paddingVertical: 16,
  },
  spaceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  spaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  spaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default SpacesScreen; 