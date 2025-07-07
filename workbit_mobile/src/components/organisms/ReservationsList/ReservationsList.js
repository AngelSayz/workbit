import React, { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { Text, Button } from '../../atoms';
import { ReservationCard, LoadingSpinner } from '../../molecules';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  padding: ${({ theme }) => theme.spacing.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
`;

const FilterContainer = styled.View`
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

const FilterButton = styled(Button)`
  flex: 1;
  margin-horizontal: ${({ theme }) => theme.spacing.xs}px;
`;

const ListContainer = styled.View`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
`;

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'completed', label: 'Completadas' },
];

/**
 * ReservationsList organism for displaying and managing reservations
 * @param {array} reservations - Array of reservation objects
 * @param {function} onReservationPress - Handler for reservation card press
 * @param {boolean} loading - Whether list is loading
 * @param {boolean} refreshing - Whether list is refreshing
 * @param {function} onRefresh - Refresh handler
 * @param {function} onLoadMore - Load more handler (pagination)
 * @param {boolean} hasMoreData - Whether there's more data to load
 * @param {string} emptyMessage - Custom empty state message
 * @param {object} style - Additional styles
 */
const ReservationsList = ({
  reservations = [],
  onReservationPress,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  hasMoreData = false,
  emptyMessage = 'No tienes reservas aún',
  style,
  ...props
}) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filterReservations = (reservations, filter) => {
    const now = new Date();
    
    switch (filter) {
      case 'active':
        return reservations.filter(reservation => {
          const endTime = new Date(reservation.endTime);
          return endTime > now && reservation.status === 'confirmed';
        });
      case 'completed':
        return reservations.filter(reservation => {
          const endTime = new Date(reservation.endTime);
          return endTime <= now || reservation.status === 'cancelled';
        });
      default:
        return reservations;
    }
  };

  const filteredReservations = filterReservations(reservations, activeFilter);

  const renderReservationCard = ({ item }) => (
    <ReservationCard
      reservation={item}
      onPress={() => onReservationPress?.(item)}
    />
  );

  const renderListFooter = () => {
    if (hasMoreData && !loading) {
      return (
        <Button
          variant="outline"
          onPress={onLoadMore}
          style={{ marginVertical: 16 }}
        >
          Cargar más
        </Button>
      );
    }
    if (loading && filteredReservations.length > 0) {
      return <LoadingSpinner message="Cargando más reservas..." />;
    }
    return null;
  };

  const renderEmpty = () => (
    <EmptyContainer>
      <Text size="lg" weight="medium" align="center" marginBottom="md">
        {emptyMessage}
      </Text>
      <Text size="md" color="textSecondary" align="center">
        {activeFilter === 'all' 
          ? 'Explora el mapa y reserva tu primer espacio'
          : `No hay reservas ${FILTER_OPTIONS.find(f => f.key === activeFilter)?.label.toLowerCase()}`
        }
      </Text>
    </EmptyContainer>
  );

  if (loading && filteredReservations.length === 0) {
    return (
      <Container style={style}>
        <LoadingSpinner fullScreen message="Cargando reservas..." />
      </Container>
    );
  }

  return (
    <Container style={style} {...props}>
      <Header>
        <Text size="xl" weight="bold">
          Mis Reservas
        </Text>
        <FilterContainer>
          {FILTER_OPTIONS.map((filter) => (
            <FilterButton
              key={filter.key}
              variant={activeFilter === filter.key ? 'filled' : 'outline'}
              size="sm"
              onPress={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </FilterButton>
          ))}
        </FilterContainer>
      </Header>

      <ListContainer>
        <FlatList
          data={filteredReservations}
          renderItem={renderReservationCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1976D2']} // Android
                tintColor="#1976D2" // iOS
              />
            ) : undefined
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderListFooter}
          onEndReached={hasMoreData ? onLoadMore : undefined}
          onEndReachedThreshold={0.1}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
        />
      </ListContainer>
    </Container>
  );
};

export default ReservationsList; 