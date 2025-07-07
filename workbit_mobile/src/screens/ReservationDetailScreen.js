import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Text, Button, Icon } from '../components/atoms';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const DetailSection = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const DetailRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px 0;
`;

const StatusBadge = styled.View`
  background-color: ${({ theme, status }) => 
    status === 'active' ? theme.colors.success :
    status === 'upcoming' ? theme.colors.info :
    status === 'completed' ? theme.colors.textSecondary :
    theme.colors.error
  };
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
`;

const ActionButtonsContainer = styled.View`
  margin: ${({ theme }) => theme.spacing.lg}px;
`;

const ActionButton = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

/**
 * Reservation detail screen
 */
const ReservationDetailScreen = ({ route, navigation }) => {
  const { reservation } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);

  // Default reservation data if not provided
  const defaultReservation = {
    id: '1',
    spaceId: 'A-101',
    spaceName: 'Escritorio A-101',
    date: '2024-07-07',
    startTime: '09:00',
    endTime: '17:00',
    reason: 'Trabajo de desarrollo',
    status: 'upcoming',
    floor: '1er Piso',
    zone: 'Zona A',
    equipment: ['Monitor', 'Teclado', 'Mouse'],
  };

  const reservationData = reservation || defaultReservation;

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'En Curso';
      case 'upcoming': return 'Próxima';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const handleCancelReservation = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que quieres cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // API_CALL: cancelReservation(reservationData.id)
              console.log('Cancelling reservation:', reservationData.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling reservation:', error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExtendReservation = () => {
    // API_CALL: extendReservation(reservationData.id)
    console.log('Extending reservation:', reservationData.id);
  };

  const handleViewEnvironmentalData = () => {
    navigation.navigate('EnvironmentalMonitoring', { 
      spaceId: reservationData.spaceId 
    });
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DetailSection>
          <DetailRow>
            <Text size="lg" weight="semibold">
              {reservationData.spaceName}
            </Text>
            <StatusBadge status={reservationData.status}>
              <Text size="sm" color="textOnPrimary" weight="medium">
                {getStatusText(reservationData.status)}
              </Text>
            </StatusBadge>
          </DetailRow>
          
          <Text size="sm" color="textSecondary" marginTop="xs">
            ID: {reservationData.id}
          </Text>
        </DetailSection>

        <DetailSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Detalles de la Reserva
          </Text>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Fecha</Text>
            <Text size="md">{reservationData.date}</Text>
          </DetailRow>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Hora de Inicio</Text>
            <Text size="md">{reservationData.startTime}</Text>
          </DetailRow>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Hora de Fin</Text>
            <Text size="md">{reservationData.endTime}</Text>
          </DetailRow>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Motivo</Text>
            <Text size="md" style={{ flex: 1, textAlign: 'right' }}>
              {reservationData.reason}
            </Text>
          </DetailRow>
        </DetailSection>

        <DetailSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Información del Espacio
          </Text>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Ubicación</Text>
            <Text size="md">{reservationData.floor}, {reservationData.zone}</Text>
          </DetailRow>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Equipamiento</Text>
            <Text size="md">{reservationData.equipment?.join(', ')}</Text>
          </DetailRow>
        </DetailSection>

        <ActionButtonsContainer>
          <ActionButton>
            <Button
              onPress={handleViewEnvironmentalData}
              variant="outline"
              fullWidth
              icon="thermometer"
            >
              Ver Condiciones Ambientales
            </Button>
          </ActionButton>
          
          {reservationData.status === 'upcoming' && (
            <>
              <ActionButton>
                <Button
                  onPress={handleExtendReservation}
                  variant="secondary"
                  fullWidth
                  icon="clock"
                >
                  Extender Reserva
                </Button>
              </ActionButton>
              
              <ActionButton>
                <Button
                  onPress={handleCancelReservation}
                  variant="outline"
                  fullWidth
                  loading={isLoading}
                  icon="x"
                >
                  Cancelar Reserva
                </Button>
              </ActionButton>
            </>
          )}
        </ActionButtonsContainer>
      </ScrollView>
    </Container>
  );
};

export default ReservationDetailScreen; 