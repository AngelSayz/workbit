import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { ReservationsList } from '../components/organisms';
import { Toast } from '../components/molecules';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding-bottom: ${({ paddingBottom }) => paddingBottom}px;
`;

const ToastContainer = styled.View`
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  z-index: 1000;
`;

/**
 * Reservations screen displaying user's reservations
 */
const ReservationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadReservations(true);
  }, []);

  const showToast = (message, type = 'info', description = '') => {
    setToast({ message, type, description });
    setTimeout(() => setToast(null), 4000);
  };

  const loadReservations = async (resetData = false) => {
    try {
      if (resetData) {
        setLoading(true);
        setPage(1);
      }

      // API_CALL: fetchUserReservations(page)
      console.log('Loading reservations...');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock reservations data
      const mockReservations = [
        {
          id: 1,
          reason: 'Reunión de seguimiento proyecto Alpha',
          spaceName: 'Sala de Reuniones A',
          spaceLocation: 'Piso 1, Ala Norte',
          startTime: '2025-06-19T09:00:00Z',
          endTime: '2025-06-19T10:30:00Z',
          status: 'confirmed',
          spaceId: 1,
        },
        {
          id: 2,
          reason: 'Trabajo individual concentrado',
          spaceName: 'Cubículo Individual 1',
          spaceLocation: 'Piso 2, Zona Oeste',
          startTime: '2025-06-19T14:00:00Z',
          endTime: '2025-06-19T18:00:00Z',
          status: 'confirmed',
          spaceId: 3,
        },
        {
          id: 3,
          reason: 'Presentación trimestral',
          spaceName: 'Sala de Conferencias',
          spaceLocation: 'Piso 3, Centro',
          startTime: '2025-06-20T10:00:00Z',
          endTime: '2025-06-20T12:00:00Z',
          status: 'pending',
          spaceId: 6,
        },
        {
          id: 4,
          reason: 'Sesión de brainstorming',
          spaceName: 'Espacio Colaborativo',
          spaceLocation: 'Piso 1, Centro',
          startTime: '2025-06-18T14:00:00Z',
          endTime: '2025-06-18T16:00:00Z',
          status: 'confirmed',
          spaceId: 7,
        },
        {
          id: 5,
          reason: 'Capacitación equipo',
          spaceName: 'Sala de Reuniones B',
          spaceLocation: 'Piso 1, Ala Sur',
          startTime: '2025-06-17T09:00:00Z',
          endTime: '2025-06-17T12:00:00Z',
          status: 'cancelled',
          spaceId: 2,
        },
      ];

      if (resetData) {
        setReservations(mockReservations);
      } else {
        setReservations(prev => [...prev, ...mockReservations]);
      }

      setHasMoreData(false); // No more data for demo
      
    } catch (error) {
      console.error('Error loading reservations:', error);
      showToast('Error al cargar reservas', 'error', 'Revisa tu conexión e intenta nuevamente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReservations(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMoreData) {
      setPage(prev => prev + 1);
      loadReservations(false);
    }
  }, [loading, hasMoreData]);

  const handleReservationPress = (reservation) => {
    navigation.navigate('ReservationDetail', { reservation });
  };

  return (
    <Container paddingBottom={Math.max(insets.bottom, 70)}>
      {toast && (
        <ToastContainer>
          <Toast
            message={toast.message}
            description={toast.description}
            type={toast.type}
          />
        </ToastContainer>
      )}
      
      <ReservationsList
        reservations={reservations}
        loading={loading}
        refreshing={refreshing}
        hasMoreData={hasMoreData}
        onReservationPress={handleReservationPress}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        emptyMessage="No tienes reservas aún"
      />
    </Container>
  );
};

export default ReservationsScreen; 