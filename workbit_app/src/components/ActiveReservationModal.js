import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import EnvironmentalWidget from './EnvironmentalWidget';
import { useToast } from '../hooks/useNotifications';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ActiveReservationModal = ({ 
  visible, 
  onClose, 
  reservation, 
  onEndSession 
}) => {
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      if (reservation?.id) {
        fetchEnvironmentalData();
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, reservation]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!visible || !reservation?.id) return;

    const interval = setInterval(() => {
      fetchEnvironmentalData(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [visible, reservation]);

  const fetchEnvironmentalData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      
      const data = await ApiService.getReservationEnvironmentalData(reservation.id);
      setEnvironmentalData(data.data);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching environmental data:', err);
      setError('Error al cargar datos ambientales');
      if (!silent) {
        showToast('Error al cargar datos ambientales', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
    }
  };

  const handleEndSession = async () => {
    try {
      if (onEndSession) {
        await onEndSession();
      }
      onClose();
    } catch (error) {
      console.error('Error ending session:', error);
      showToast('Error al finalizar sesión', 'error');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    if (!reservation?.EndTime) return null;
    
    const now = new Date();
    const endTime = new Date(reservation.EndTime);
    const diffMs = endTime - now;
    
    if (diffMs <= 0) return 'Sesión finalizada';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  if (!reservation) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouch} 
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.statusIndicator}>
                  <View style={styles.pulseIndicator} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Sesión Activa</Text>
                  <Text style={styles.headerSubtitle}>{getTimeRemaining()}</Text>
                </View>
              </View>
              
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchEnvironmentalData()}
                tintColor="#3B82F6"
              />
            }
          >
            {/* Reservation Info */}
            <View style={styles.reservationInfo}>
              <Text style={styles.reservationTitle}>{reservation.Reason}</Text>
              <Text style={styles.reservationDetails}>
                📍 {reservation.SpaceName || 'Espacio no especificado'}
              </Text>
              <Text style={styles.reservationDetails}>
                📅 {formatDate(reservation.StartTime)}
              </Text>
              <Text style={styles.reservationDetails}>
                🕐 {formatTime(reservation.StartTime)} - {formatTime(reservation.EndTime)}
              </Text>
            </View>

            {/* Environmental Data */}
            <View style={styles.environmentalSection}>
              <EnvironmentalWidget
                environmentalData={environmentalData}
                loading={loading}
                error={error}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => fetchEnvironmentalData()}
              disabled={loading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color="#3B82F6" 
                style={{ opacity: loading ? 0.5 : 1 }}
              />
              <Text style={[styles.refreshButtonText, { opacity: loading ? 0.5 : 1 }]}>
                Actualizar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.endSessionButton}
              onPress={handleEndSession}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.endSessionButtonText}>Finalizar Sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'relative',
    marginRight: 12,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  reservationInfo: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reservationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  reservationDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  environmentalSection: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 8,
  },
  refreshButtonText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  endSessionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  endSessionButtonText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ActiveReservationModal;
