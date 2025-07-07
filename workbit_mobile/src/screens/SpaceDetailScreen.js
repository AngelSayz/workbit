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
  background-color: ${({ theme, available }) => 
    available ? theme.colors.success : theme.colors.error
  };
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
`;

const FeaturesList = styled.View`
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

const FeatureItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const EnvironmentalCard = styled.View`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  margin: ${({ theme }) => theme.spacing.sm}px 0;
`;

const EnvironmentalRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ActionButtonsContainer = styled.View`
  margin: ${({ theme }) => theme.spacing.lg}px;
`;

const ActionButton = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

/**
 * Space detail screen
 */
const SpaceDetailScreen = ({ route, navigation }) => {
  const { space } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);

  // Default space data if not provided
  const defaultSpace = {
    id: 'A-101',
    name: 'Escritorio A-101',
    type: 'Escritorio Individual',
    floor: '1er Piso',
    zone: 'Zona A',
    capacity: 1,
    available: true,
    features: ['Monitor 24"', 'Teclado ergonómico', 'Mouse', 'Lámpara LED', 'Tomacorrientes'],
    environmental: {
      temperature: 22.5,
      humidity: 45,
      light: 350,
      noise: 38,
      airQuality: 'Buena'
    },
    equipment: ['Computadora', 'Monitor', 'Teclado', 'Mouse'],
    reservedUntil: null,
  };

  const spaceData = space || defaultSpace;

  const handleReserveSpace = () => {
    if (!spaceData.available) {
      Alert.alert('Espacio No Disponible', 'Este espacio ya está reservado.');
      return;
    }

    Alert.alert(
      'Reservar Espacio',
      `¿Quieres reservar ${spaceData.name} ahora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reservar', 
          onPress: async () => {
            setIsLoading(true);
            try {
              // API_CALL: createReservation(spaceData.id, reservationData)
              console.log('Reserving space:', spaceData.id);
              Alert.alert('¡Éxito!', 'Espacio reservado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error creating reservation:', error);
              Alert.alert('Error', 'No se pudo completar la reserva');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewEnvironmentalData = () => {
    navigation.navigate('EnvironmentalMonitoring', { 
      spaceId: spaceData.id 
    });
  };

  const getEnvironmentalStatus = (value, type) => {
    switch (type) {
      case 'temperature':
        return value >= 20 && value <= 25 ? 'Óptima' : 'Fuera de rango';
      case 'humidity':
        return value >= 40 && value <= 60 ? 'Óptima' : 'Fuera de rango';
      case 'light':
        return value >= 300 && value <= 500 ? 'Óptima' : 'Fuera de rango';
      case 'noise':
        return value <= 45 ? 'Bajo' : 'Alto';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DetailSection>
          <DetailRow>
            <Text size="lg" weight="semibold">
              {spaceData.name}
            </Text>
            <StatusBadge available={spaceData.available}>
              <Text size="sm" color="textOnPrimary" weight="medium">
                {spaceData.available ? 'Disponible' : 'Ocupado'}
              </Text>
            </StatusBadge>
          </DetailRow>
          
          <Text size="md" color="textSecondary" marginTop="xs">
            {spaceData.type}
          </Text>
        </DetailSection>

        <DetailSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Información General
          </Text>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Ubicación</Text>
            <Text size="md">{spaceData.floor}, {spaceData.zone}</Text>
          </DetailRow>
          
          <DetailRow>
            <Text size="md" color="textSecondary">Capacidad</Text>
            <Text size="md">{spaceData.capacity} persona{spaceData.capacity > 1 ? 's' : ''}</Text>
          </DetailRow>
          
          {spaceData.reservedUntil && (
            <DetailRow>
              <Text size="md" color="textSecondary">Disponible desde</Text>
              <Text size="md">{spaceData.reservedUntil}</Text>
            </DetailRow>
          )}
        </DetailSection>

        <DetailSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Características
          </Text>
          
          <FeaturesList>
            {spaceData.features?.map((feature, index) => (
              <FeatureItem key={index}>
                <Icon name="check" size={16} color="success" style={{ marginRight: 8 }} />
                <Text size="md">{feature}</Text>
              </FeatureItem>
            ))}
          </FeaturesList>
        </DetailSection>

        <DetailSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Condiciones Ambientales
          </Text>
          
          <EnvironmentalCard>
            <EnvironmentalRow>
              <Text size="md" color="textSecondary">Temperatura</Text>
              <Text size="md">{spaceData.environmental?.temperature}°C</Text>
            </EnvironmentalRow>
            <Text size="sm" color="textSecondary">
              {getEnvironmentalStatus(spaceData.environmental?.temperature, 'temperature')}
            </Text>
          </EnvironmentalCard>

          <EnvironmentalCard>
            <EnvironmentalRow>
              <Text size="md" color="textSecondary">Humedad</Text>
              <Text size="md">{spaceData.environmental?.humidity}%</Text>
            </EnvironmentalRow>
            <Text size="sm" color="textSecondary">
              {getEnvironmentalStatus(spaceData.environmental?.humidity, 'humidity')}
            </Text>
          </EnvironmentalCard>

          <EnvironmentalCard>
            <EnvironmentalRow>
              <Text size="md" color="textSecondary">Iluminación</Text>
              <Text size="md">{spaceData.environmental?.light} lux</Text>
            </EnvironmentalRow>
            <Text size="sm" color="textSecondary">
              {getEnvironmentalStatus(spaceData.environmental?.light, 'light')}
            </Text>
          </EnvironmentalCard>

          <EnvironmentalCard>
            <EnvironmentalRow>
              <Text size="md" color="textSecondary">Nivel de Ruido</Text>
              <Text size="md">{spaceData.environmental?.noise} dB</Text>
            </EnvironmentalRow>
            <Text size="sm" color="textSecondary">
              {getEnvironmentalStatus(spaceData.environmental?.noise, 'noise')}
            </Text>
          </EnvironmentalCard>
        </DetailSection>

        <ActionButtonsContainer>
          <ActionButton>
            <Button
              onPress={handleViewEnvironmentalData}
              variant="outline"
              fullWidth
              icon="activity"
            >
              Ver Historial Ambiental
            </Button>
          </ActionButton>
          
          <ActionButton>
            <Button
              onPress={handleReserveSpace}
              variant="primary"
              fullWidth
              disabled={!spaceData.available}
              loading={isLoading}
              icon="calendar"
            >
              {spaceData.available ? 'Reservar Espacio' : 'No Disponible'}
            </Button>
          </ActionButton>
        </ActionButtonsContainer>
      </ScrollView>
    </Container>
  );
};

export default SpaceDetailScreen; 