import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import styled from 'styled-components/native';
import { Text, Icon } from '../../atoms';
import { LoadingSpinner } from '../../molecules';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MapContainer = styled.View`
  flex: 1;
  position: relative;
`;

// Horizontal legend at top
const HorizontalLegend = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: 12px 16px;
  margin: 16px;
  border-radius: 12px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.small.shadowColor};
    shadow-offset: ${theme.shadows.small.shadowOffset.width}px ${theme.shadows.small.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.small.shadowOpacity};
    shadow-radius: ${theme.shadows.small.shadowRadius}px;
    elevation: ${theme.shadows.small.elevation};
  `}
`;

const LegendRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const LegendItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 4px;
`;

const LegendDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: 6px;
  background-color: ${({ color }) => color};
  border-width: 1px;
  border-color: ${({ borderColor }) => borderColor};
`;

const CinemaContainer = styled.View`
  padding: 20px;
  align-items: center;
`;

// Grid system - like cinema rows
const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const RowLabel = styled.View`
  width: 30px;
  height: 30px;
  background-color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: 15px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const RowLabelText = styled(Text)`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const SeatsContainer = styled.View`
  flex-direction: row;
  gap: 6px;
`;

// Individual seat/space
const Seat = styled.TouchableOpacity.attrs(({ disabled }) => ({
  activeOpacity: disabled ? 1 : 0.7,
  delayPressIn: 0,
  delayPressOut: 0,
}))`
  width: 42px;
  height: 42px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: ${({ theme, status, isSelected }) => {
    if (isSelected) return theme.colors.primary;
    switch (status) {
      case 'available': return '#059669';
      case 'occupied': return '#DC2626';
      case 'reserved': return '#D97706';
      case 'maintenance': return '#6B7280';
      default: return '#D1D5DB';
    }
  }};
  background-color: ${({ theme, status, isSelected }) => {
    if (isSelected) return theme.colors.primary;
    switch (status) {
      case 'available': return '#10B981';
      case 'occupied': return '#EF4444';
      case 'reserved': return '#F59E0B';
      case 'maintenance': return '#9CA3AF';
      default: return '#F9FAFB';
    }
  }};
  ${({ isSelected, theme }) => isSelected && `
    shadow-color: ${theme.colors.primary};
    shadow-offset: 0px 2px;
    shadow-opacity: 0.3;
    shadow-radius: 4px;
    elevation: 4;
  `}
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
`;

const SeatNumber = styled(Text)`
  font-size: 10px;
  font-weight: bold;
  color: ${({ theme, status, isSelected }) => {
    if (isSelected) return 'white';
    switch (status) {
      case 'available': return 'white';
      case 'occupied': return 'white';
      case 'reserved': return 'white';
      case 'maintenance': return 'white';
      default: return theme.colors.textSecondary;
    }
  }};
`;

// Aisles - pasillos
const VerticalAisle = styled.View`
  width: 20px;
  height: 42px;
`;

const HorizontalAisle = styled.View`
  height: 20px;
  width: 100%;
  margin: 12px 0;
`;

// Info panel
const InfoPanel = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: 0 16px 16px 16px;
  padding: 12px 16px;
  border-radius: 12px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.small.shadowColor};
    shadow-offset: ${theme.shadows.small.shadowOffset.width}px ${theme.shadows.small.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.small.shadowOpacity};
    shadow-radius: ${theme.shadows.small.shadowRadius}px;
    elevation: ${theme.shadows.small.elevation};
  `}
`;

const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 4px;
`;

// Cinema-style layout configuration
const CINEMA_LAYOUT = {
  rows: [
    // Front section - Individual workstations
    {
      id: 'A',
      label: 'A',
      seats: [1, 2, null, 4, 5, 6, null, 8, 9, 10], // null = aisle
      type: 'individual'
    },
    {
      id: 'B', 
      label: 'B',
      seats: [1, 2, null, 4, 5, 6, null, 8, 9, 10],
      type: 'individual'
    },
    // Aisle
    { id: 'aisle1', type: 'horizontal-aisle' },
    // Middle section - Collaborative spaces
    {
      id: 'C',
      label: 'C', 
      seats: [1, 2, 3, null, 5, 6, 7, null, 9, 10],
      type: 'collaborative'
    },
    {
      id: 'D',
      label: 'D',
      seats: [1, 2, 3, null, 5, 6, 7, null, 9, 10], 
      type: 'collaborative'
    }
  ]
};

/**
 * Cinema-style SpaceMap with perfect grid layout
 */
const SpaceMap = ({
  spaces = [],
  onSpacePress,
  loading = false,
  selectedSpaceId,
  style,
  ...props
}) => {
  // Create seat mapping from spaces data
  const createSeatMap = () => {
    const seatMap = {};
    
    // Default status for demo
    const defaultSpaces = [
      // Row A
      { id: 'A1', name: 'A1', status: 'available', type: 'individual', capacity: 1 },
      { id: 'A2', name: 'A2', status: 'occupied', type: 'individual', capacity: 1 },
      { id: 'A4', name: 'A4', status: 'available', type: 'individual', capacity: 1 },
      { id: 'A5', name: 'A5', status: 'reserved', type: 'individual', capacity: 1 },
      { id: 'A6', name: 'A6', status: 'available', type: 'individual', capacity: 1 },
      { id: 'A8', name: 'A8', status: 'available', type: 'individual', capacity: 1 },
      { id: 'A9', name: 'A9', status: 'maintenance', type: 'individual', capacity: 1 },
      { id: 'A10', name: 'A10', status: 'available', type: 'individual', capacity: 1 },
      
      // Row B  
      { id: 'B1', name: 'B1', status: 'available', type: 'individual', capacity: 1 },
      { id: 'B2', name: 'B2', status: 'available', type: 'individual', capacity: 1 },
      { id: 'B4', name: 'B4', status: 'occupied', type: 'individual', capacity: 1 },
      { id: 'B5', name: 'B5', status: 'available', type: 'individual', capacity: 1 },
      { id: 'B6', name: 'B6', status: 'available', type: 'individual', capacity: 1 },
      { id: 'B8', name: 'B8', status: 'reserved', type: 'individual', capacity: 1 },
      { id: 'B9', name: 'B9', status: 'available', type: 'individual', capacity: 1 },
      { id: 'B10', name: 'B10', status: 'available', type: 'individual', capacity: 1 },
      
      // Row C - Collaborative
      { id: 'C1', name: 'C1', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'C2', name: 'C2', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'C3', name: 'C3', status: 'occupied', type: 'collaborative', capacity: 2 },
      { id: 'C5', name: 'C5', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'C6', name: 'C6', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'C7', name: 'C7', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'C9', name: 'C9', status: 'reserved', type: 'collaborative', capacity: 2 },
      { id: 'C10', name: 'C10', status: 'available', type: 'collaborative', capacity: 2 },
      
      // Row D
      { id: 'D1', name: 'D1', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D2', name: 'D2', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D3', name: 'D3', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D5', name: 'D5', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D6', name: 'D6', status: 'occupied', type: 'collaborative', capacity: 2 },
      { id: 'D7', name: 'D7', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D9', name: 'D9', status: 'available', type: 'collaborative', capacity: 2 },
      { id: 'D10', name: 'D10', status: 'available', type: 'collaborative', capacity: 2 },
    ];

    // Use provided spaces or default
    const allSpaces = spaces.length > 0 ? spaces : defaultSpaces;
    
    allSpaces.forEach(space => {
      seatMap[space.id] = space;
    });
    
    return seatMap;
  };

  const seatMap = createSeatMap();

  const renderSeat = (rowId, seatNumber, seatType, index) => {
    let uniqueKey = `${rowId}-${index}`; // Always unique key
    let seatId = `${rowId}${seatNumber}`;
    
    const space = seatMap[seatId];
    if (!space) {
      return (
        <Seat key={uniqueKey} disabled>
          <SeatNumber>{seatNumber}</SeatNumber>
        </Seat>
      );
    }

    const isSelected = selectedSpaceId === space.id;
    const isInteractable = space.status === 'available';

    const handlePress = () => {
      if (isInteractable && onSpacePress) {
        onSpacePress(space);
      }
    };

    return (
      <Seat
        key={uniqueKey}
        status={space.status}
        disabled={!isInteractable}
        onPress={handlePress}
        isSelected={isSelected}
        accessibilityRole="button"
        accessibilityLabel={`${space.name}, ${space.status}, capacidad ${space.capacity}`}
        accessibilityHint={isInteractable ? 'Toca para reservar' : 'No disponible'}
      >
        <SeatNumber status={space.status} isSelected={isSelected}>
          {seatNumber}
        </SeatNumber>
      </Seat>
    );
  };

  const renderRow = (row) => {
    if (row.type === 'horizontal-aisle') {
      return <HorizontalAisle key={row.id} />;
    }

    return (
      <Row key={row.id}>
        <RowLabel>
          <RowLabelText>{row.label}</RowLabelText>
        </RowLabel>
        
        <SeatsContainer>
          {row.seats.map((seatNumber, index) => {
            if (seatNumber === null) {
              return <VerticalAisle key={`aisle-${row.id}-${index}`} />;
            }
            
            return renderSeat(row.label, seatNumber, row.type, index);
          })}
        </SeatsContainer>
      </Row>
    );
  };

  const getStatusCounts = () => {
    const allSpaces = Object.values(seatMap);
    return {
      available: allSpaces.filter(s => s.status === 'available').length,
      occupied: allSpaces.filter(s => s.status === 'occupied').length,
      reserved: allSpaces.filter(s => s.status === 'reserved').length,
      maintenance: allSpaces.filter(s => s.status === 'maintenance').length,
    };
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando espacios..." />;
  }

  const statusCounts = getStatusCounts();

  return (
    <Container style={style} {...props}>
      <MapContainer>
        {/* Horizontal Legend */}
        <HorizontalLegend>
          <LegendRow>
            <LegendItem>
              <LegendDot color="#10B981" borderColor="#059669" />
              <Text size="xs">Disponible ({statusCounts.available})</Text>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#EF4444" borderColor="#DC2626" />
              <Text size="xs">Ocupado ({statusCounts.occupied})</Text>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#F59E0B" borderColor="#D97706" />
              <Text size="xs">Reservado ({statusCounts.reserved})</Text>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#9CA3AF" borderColor="#6B7280" />
              <Text size="xs">Mantenimiento ({statusCounts.maintenance})</Text>
            </LegendItem>
          </LegendRow>
        </HorizontalLegend>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 20 }}
          >
            <CinemaContainer>
              {CINEMA_LAYOUT.rows.map(renderRow)}
            </CinemaContainer>
          </ScrollView>
        </ScrollView>

        {/* Info Panel */}
        <InfoPanel>
          <InfoRow>
            <Text size="sm" color="textSecondary">Total espacios:</Text>
            <Text size="sm" weight="bold">{Object.keys(seatMap).length}</Text>
          </InfoRow>
          <InfoRow style={{ marginBottom: 0 }}>
            <Text size="sm" color="textSecondary">Disponibles ahora:</Text>
            <Text size="sm" weight="bold" color="success">{statusCounts.available}</Text>
          </InfoRow>
        </InfoPanel>
      </MapContainer>
    </Container>
  );
};

export default SpaceMap; 