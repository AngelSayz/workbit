import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Text, Icon } from '../../atoms';

const Card = styled(TouchableOpacity)`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.small.shadowColor};
    shadow-offset: ${theme.shadows.small.shadowOffset.width}px ${theme.shadows.small.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.small.shadowOpacity};
    shadow-radius: ${theme.shadows.small.shadowRadius}px;
    elevation: ${theme.shadows.small.elevation};
  `}
  border-left-width: 4px;
  border-left-color: ${({ theme, status }) => {
    switch (status) {
      case 'confirmed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.inactive;
    }
  }};
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const StatusBadge = styled.View`
  background-color: ${({ theme, status }) => {
    switch (status) {
      case 'confirmed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.inactive;
    }
  }};
  padding: ${({ theme }) => `${theme.spacing.xs}px ${theme.spacing.sm}px`};
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const IconContainer = styled.View`
  margin-right: ${({ theme }) => theme.spacing.sm}px;
  width: 20px;
  align-items: center;
`;

/**
 * ReservationCard molecule for displaying reservation information
 * @param {object} reservation - Reservation data object
 * @param {function} onPress - Press handler for card
 * @param {object} style - Additional styles
 */
const ReservationCard = ({
  reservation,
  onPress,
  style,
  ...props
}) => {
  const {
    id,
    reason,
    spaceName,
    spaceLocation,
    startTime,
    endTime,
    status = 'pending',
  } = reservation;

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <Card
      status={status}
      onPress={onPress}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={`Reserva ${getStatusText()}: ${reason} en ${spaceName}`}
      accessibilityHint="Toca para ver más detalles"
      {...props}
    >
      <Header>
        <Text size="lg" weight="semibold" numberOfLines={2} style={{ flex: 1, marginRight: 8 }}>
          {reason}
        </Text>
        <StatusBadge status={status}>
          <Text size="xs" weight="medium" color="textOnPrimary">
            {getStatusText()}
          </Text>
        </StatusBadge>
      </Header>

      <InfoRow>
        <IconContainer>
          <Icon name="map-pin" size={16} color="textSecondary" />
        </IconContainer>
        <Text size="sm" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
          {spaceName}
        </Text>
      </InfoRow>

      <InfoRow>
        <IconContainer>
          <Icon name="clock" size={16} color="textSecondary" />
        </IconContainer>
        <Text size="sm" color="textSecondary">
          {formatDate(startTime)} • {formatTime(startTime)} - {formatTime(endTime)}
        </Text>
      </InfoRow>

      {spaceLocation && (
        <InfoRow>
          <IconContainer>
            <Icon name="navigation" size={16} color="textSecondary" />
          </IconContainer>
          <Text size="sm" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
            {spaceLocation}
          </Text>
        </InfoRow>
      )}
    </Card>
  );
};

export default ReservationCard; 