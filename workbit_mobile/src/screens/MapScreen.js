import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { SpaceMap, ReservationBottomSheet } from '../components/organisms';
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
 * Map screen for space selection and reservation
 */
const MapScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);


  useEffect(() => {
    loadSpaces();
  }, []);



  const showToast = (message, type = 'info', description = '') => {
    setToast({ message, type, description });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSpaces = async () => {
    try {
      setLoading(true);
      
      // API_CALL: fetchSpaces()
      console.log('Loading spaces...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock spaces data that matches cinema layout IDs
      const mockSpaces = [
        // Row A - Individual workstations
        { id: 'A1', name: 'A1', status: 'available', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A2', name: 'A2', status: 'occupied', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A4', name: 'A4', status: 'available', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A5', name: 'A5', status: 'reserved', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A6', name: 'A6', status: 'available', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A8', name: 'A8', status: 'available', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A9', name: 'A9', status: 'maintenance', capacity: 1, type: 'individual', location: 'Fila A' },
        { id: 'A10', name: 'A10', status: 'available', capacity: 1, type: 'individual', location: 'Fila A' },
        
        // Row B - Individual workstations  
        { id: 'B1', name: 'B1', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B2', name: 'B2', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B4', name: 'B4', status: 'occupied', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B5', name: 'B5', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B6', name: 'B6', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B8', name: 'B8', status: 'reserved', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B9', name: 'B9', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        { id: 'B10', name: 'B10', status: 'available', capacity: 1, type: 'individual', location: 'Fila B' },
        
        // Row C - Collaborative spaces
        { id: 'C1', name: 'C1', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C2', name: 'C2', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C3', name: 'C3', status: 'occupied', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C5', name: 'C5', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C6', name: 'C6', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C7', name: 'C7', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C9', name: 'C9', status: 'reserved', capacity: 2, type: 'collaborative', location: 'Fila C' },
        { id: 'C10', name: 'C10', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila C' },
        
        // Row D - Collaborative spaces
        { id: 'D1', name: 'D1', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D2', name: 'D2', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D3', name: 'D3', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D5', name: 'D5', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D6', name: 'D6', status: 'occupied', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D7', name: 'D7', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D9', name: 'D9', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
        { id: 'D10', name: 'D10', status: 'available', capacity: 2, type: 'collaborative', location: 'Fila D' },
      ];
      
      setSpaces(mockSpaces);
      
    } catch (error) {
      console.error('Error loading spaces:', error);
      showToast('Error al cargar espacios', 'error', 'Revisa tu conexión e intenta nuevamente');
    } finally {
      setLoading(false);
    }
  };

  const handleSpacePress = (space) => {
    console.log('Space pressed:', space.id); // Debug log
    setSelectedSpace(space);
    setIsBottomSheetOpen(true);
  };

  const handleConfirmReservation = async (reservationData) => {
    setReservationLoading(true);
    
    try {
      // API_CALL: createReservation(reservationData)
      console.log('Creating reservation:', reservationData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast(
        '¡Reserva confirmada!', 
        'success', 
        `${selectedSpace.name} reservado exitosamente`
      );
      
      // Close modal
      handleCloseBottomSheet();
      
      // Refresh spaces to update status
      await loadSpaces();
      
      // Navigate to reservations tab to show the new reservation
      navigation.navigate('Reservations');
      
    } catch (error) {
      console.error('Reservation error:', error);
      showToast('Error al crear reserva', 'error', 'Intenta nuevamente');
    } finally {
      setReservationLoading(false);
    }
  };

  const handleCloseBottomSheet = () => {
    setSelectedSpace(null);
    setIsBottomSheetOpen(false);
  };

  const handleBottomSheetChange = (isOpen) => {
    setIsBottomSheetOpen(isOpen);
    if (!isOpen) {
      setSelectedSpace(null);
    }
  };

  return (
    <Container paddingBottom={isBottomSheetOpen ? 0 : Math.max(insets.bottom, 70)}>
      {toast && (
        <ToastContainer>
          <Toast
            message={toast.message}
            description={toast.description}
            type={toast.type}
          />
        </ToastContainer>
      )}
      
      <SpaceMap
        spaces={spaces}
        loading={loading}
        selectedSpaceId={selectedSpace?.id}
        onSpacePress={handleSpacePress}
      />

      <ReservationBottomSheet
        visible={isBottomSheetOpen && selectedSpace !== null}
        space={selectedSpace}
        onConfirm={handleConfirmReservation}
        onClose={handleCloseBottomSheet}
        onChange={handleBottomSheetChange}
        loading={reservationLoading}
      />
    </Container>
  );
};

export default MapScreen; 