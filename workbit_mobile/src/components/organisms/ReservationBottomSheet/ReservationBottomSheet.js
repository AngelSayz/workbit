import React, { useState, useCallback, useMemo } from 'react';
import { useColorScheme, View, Modal, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { Text, Button, Icon } from '../../atoms';
import { FormField } from '../../molecules';

const { height: screenHeight } = Dimensions.get('window');

const ModalBackdrop = styled.View`
  flex: 1;
  background-color: ${({ isExpanded }) => isExpanded ? 'transparent' : 'rgba(0, 0, 0, 0.5)'};
  justify-content: ${({ isExpanded }) => isExpanded ? 'flex-start' : 'flex-end'};
`;

const Container = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-top-left-radius: ${({ isExpanded }) => isExpanded ? '0px' : '20px'};
  border-top-right-radius: ${({ isExpanded }) => isExpanded ? '0px' : '20px'};
  max-height: ${({ isExpanded, topInset }) => isExpanded ? `${screenHeight - topInset}px` : '85%'};
  min-height: ${({ isExpanded, topInset }) => isExpanded ? `${screenHeight - topInset}px` : '60%'};
  margin-top: ${({ isExpanded, topInset }) => isExpanded ? `${topInset}px` : 'auto'};
`;

// Custom handle with visual indicator
const HandleContainer = styled.View`
  width: 100%;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
  flex-direction: row;
  justify-content: center;
`;

const HandleBar = styled.View`
  width: 32px;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: 2px;
  margin-bottom: 8px;
`;

const ExpandButton = styled(TouchableOpacity)`
  position: absolute;
  left: 16px;
  top: 12px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.background};
  justify-content: center;
  align-items: center;
`;

const CloseButton = styled(TouchableOpacity)`
  position: absolute;
  right: 16px;
  top: 12px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.background};
  justify-content: center;
  align-items: center;
`;

const Header = styled.View`
  align-items: center;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
`;

const ScrollContent = styled(ScrollView)`
  flex: 1;
`;

const ContentPadding = styled.View`
  padding: 20px;
`;

const SpaceInfo = styled.View`
  background-color: ${({ theme }) => theme.colors.background};
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  border-left-width: 4px;
  border-left-color: ${({ theme }) => theme.colors.primary};
`;

const SpaceRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

// Date & Time Selection
const DateTimeSection = styled.View`
  margin-bottom: 24px;
`;

const DateTimeRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
`;

const DateTimeCard = styled(TouchableOpacity)`
  flex: 1;
  background-color: ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary + '15' : theme.colors.background};
  border: 2px solid ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary : theme.colors.divider};
  border-radius: 12px;
  padding: 16px;
  align-items: center;
`;

const QuickDateButton = styled(TouchableOpacity)`
  background-color: ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary : theme.colors.background};
  border: 1px solid ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary : theme.colors.divider};
  border-radius: 20px;
  padding: 8px 16px;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const QuickDatesContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const TimeSlotContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const TimeSlot = styled(TouchableOpacity)`
  background-color: ${({ theme, isSelected, isAvailable }) => {
    if (!isAvailable) return theme.colors.divider;
    if (isSelected) return theme.colors.primary;
    return theme.colors.background;
  }};
  border: 1px solid ${({ theme, isSelected, isAvailable }) => {
    if (!isAvailable) return theme.colors.divider;
    if (isSelected) return theme.colors.primary;
    return theme.colors.divider;
  }};
  border-radius: 8px;
  padding: 12px 16px;
  opacity: ${({ isAvailable }) => isAvailable ? 1 : 0.5};
`;

// Participants Section
const ParticipantsSection = styled.View`
  margin-bottom: 24px;
`;

const ParticipantItem = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
`;

const RemoveParticipantButton = styled(TouchableOpacity)`
  background-color: ${({ theme }) => theme.colors.error};
  width: 24px;
  height: 24px;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  margin-left: auto;
`;

const AddParticipantButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary + '15'};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
`;

// Footer with safe area
const Footer = styled.View`
  padding: 20px;
  padding-bottom: ${({ bottomInset }) => Math.max(bottomInset, 20)}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.divider};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

// Quick date options
const getQuickDates = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  return [
    { label: 'Hoy', date: today, id: 'today' },
    { label: 'Mañana', date: tomorrow, id: 'tomorrow' },
    { label: 'Pasado mañana', date: dayAfter, id: 'dayafter' },
  ];
};

// Available time slots
const TIME_SLOTS = [
  { time: '08:00', available: true },
  { time: '09:00', available: true },
  { time: '10:00', available: false },
  { time: '11:00', available: true },
  { time: '12:00', available: false },
  { time: '13:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: false },
  { time: '17:00', available: true },
];

/**
 * Simple Modal-based ReservationBottomSheet with native scroll
 */
const ReservationBottomSheet = React.forwardRef(({
  space,
  onConfirm,
  onClose,
  onChange,
  loading = false,
  visible = false,
  ...props
}, ref) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState('60');
  const [participants, setParticipants] = useState([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClose = () => {
    // Reset form when closed
    setSelectedDate(null);
    setSelectedTime(null);
    setDuration('60');
    setParticipants([]);
    setNewParticipantEmail('');
    setPurpose('');
    setIsExpanded(false);
    onClose?.();
  };

  // Handle swipe down gesture when expanded
  const onHandleGestureEvent = (event) => {
    if (isExpanded && event.nativeEvent.translationY > 100) {
      setIsExpanded(false);
    }
  };

  const onHandleStateChange = (event) => {
    if (event.nativeEvent.state === State.END && isExpanded) {
      if (event.nativeEvent.translationY > 100) {
        setIsExpanded(false);
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona fecha y hora');
      return;
    }

    const reservationData = {
      spaceId: space?.id,
      date: selectedDate,
      time: selectedTime,
      duration: parseInt(duration),
      participants: participants,
      purpose: purpose,
    };

    onConfirm?.(reservationData);
  };

  const addParticipant = () => {
    if (!newParticipantEmail.trim()) return;
    
    if (participants.length >= (space?.capacity - 1 || 7)) {
      alert(`Máximo ${space?.capacity || 8} participantes incluyéndote`);
      return;
    }

    if (participants.includes(newParticipantEmail.trim())) {
      alert('Este participante ya fue agregado');
      return;
    }

    setParticipants([...participants, newParticipantEmail.trim()]);
    setNewParticipantEmail('');
  };

  const removeParticipant = (email) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const selectQuickDate = (dateOption) => {
    setSelectedDate(dateOption.date);
  };

  const isFormValid = () => {
    return selectedDate && selectedTime && purpose.trim();
  };

    return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={!isExpanded}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ModalBackdrop isExpanded={isExpanded}>
            <Container isExpanded={isExpanded} topInset={insets.top}>
              {/* Custom Handle with swipe gesture */}
              <PanGestureHandler
                onGestureEvent={onHandleGestureEvent}
                onHandlerStateChange={onHandleStateChange}
                enabled={isExpanded}
              >
                <HandleContainer>
                  <HandleBar />
                  <ExpandButton onPress={() => setIsExpanded(!isExpanded)}>
                    <Icon name={isExpanded ? "minimize-2" : "maximize-2"} size={18} color="textSecondary" />
                  </ExpandButton>
                  <CloseButton onPress={handleClose}>
                    <Icon name="x" size={18} color="textSecondary" />
                  </CloseButton>
                </HandleContainer>
              </PanGestureHandler>

            <Header>
              <Text size="xl" weight="bold" align="center">
                Reservar Espacio
              </Text>
              {space && (
                <Text size="md" color="textSecondary" align="center" marginTop="xs">
                  {space.name} • Capacidad: {space.capacity} personas
                </Text>
              )}
            </Header>

            <ScrollContent 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <ContentPadding>
                {space && (
                  <SpaceInfo>
                    <SpaceRow>
                      <Text size="sm" color="textSecondary">Ubicación:</Text>
                      <Text size="sm" weight="medium">{space.location || 'Piso 1, Zona A'}</Text>
                    </SpaceRow>
                    <SpaceRow>
                      <Text size="sm" color="textSecondary">Equipamiento:</Text>
                      <Text size="sm">{space.equipment || 'Proyector, Pizarra'}</Text>
                    </SpaceRow>
                    <SpaceRow style={{ marginBottom: 0 }}>
                      <Text size="sm" color="textSecondary">Tipo:</Text>
                      <Text size="sm" weight="medium">{space.type || 'Sala de reuniones'}</Text>
                    </SpaceRow>
                  </SpaceInfo>
                )}

                {/* Date Selection */}
                <DateTimeSection>
                  <Text size="lg" weight="semibold" marginBottom="md">
                    Fecha
                  </Text>
                  
                  <QuickDatesContainer>
                    {getQuickDates().map((option) => (
                      <QuickDateButton
                        key={option.id}
                        isSelected={selectedDate?.toDateString() === option.date.toDateString()}
                        onPress={() => selectQuickDate(option)}
                      >
                        <Text 
                          size="sm" 
                          weight="medium"
                          color={selectedDate?.toDateString() === option.date.toDateString() ? 'white' : 'text'}
                        >
                          {option.label}
                        </Text>
                      </QuickDateButton>
                    ))}
                  </QuickDatesContainer>

                  {selectedDate && (
                    <Text size="sm" color="primary" weight="medium">
                      Seleccionado: {selectedDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  )}
                </DateTimeSection>

                {/* Time Selection */}
                <DateTimeSection>
                  <Text size="lg" weight="semibold" marginBottom="md">
                    Hora de inicio
                  </Text>
                  
                  <TimeSlotContainer>
                    {TIME_SLOTS.map((slot) => (
                      <TimeSlot
                        key={slot.time}
                        isSelected={selectedTime === slot.time}
                        isAvailable={slot.available}
                        onPress={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                      >
                        <Text 
                          size="sm" 
                          weight="medium"
                          color={
                            !slot.available ? 'textSecondary' :
                            selectedTime === slot.time ? 'white' : 'text'
                          }
                        >
                          {slot.time}
                        </Text>
                      </TimeSlot>
                    ))}
                  </TimeSlotContainer>
                </DateTimeSection>

                {/* Duration */}
                <DateTimeSection>
                  <Text size="lg" weight="semibold" marginBottom="md">
                    Duración (minutos)
                  </Text>
                  <DateTimeRow>
                    {['30', '60', '90', '120'].map((time) => (
                      <DateTimeCard
                        key={time}
                        isSelected={duration === time}
                        onPress={() => setDuration(time)}
                      >
                        <Text 
                          size="md" 
                          weight="bold"
                          color={duration === time ? 'primary' : 'text'}
                        >
                          {time}min
                        </Text>
                      </DateTimeCard>
                    ))}
                  </DateTimeRow>
                </DateTimeSection>

                {/* Participants */}
                <ParticipantsSection>
                  <Text size="lg" weight="semibold" marginBottom="md">
                    Participantes ({participants.length}/{(space?.capacity || 8) - 1})
                  </Text>
                  
                  {participants.map((email, index) => (
                    <ParticipantItem key={index}>
                      <Icon name="user" size={16} color="textSecondary" />
                      <Text size="sm" style={{ marginLeft: 8, flex: 1 }}>
                        {email}
                      </Text>
                      <RemoveParticipantButton onPress={() => removeParticipant(email)}>
                        <Icon name="x" size={14} color="white" />
                      </RemoveParticipantButton>
                    </ParticipantItem>
                  ))}

                  {participants.length < (space?.capacity - 1 || 7) && (
                    <>
                      <FormField
                        label="Email del participante"
                        value={newParticipantEmail}
                        onChangeText={setNewParticipantEmail}
                        placeholder="ejemplo@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={addParticipant}
                      />
                      
                      <AddParticipantButton onPress={addParticipant}>
                        <Icon name="plus" size={20} color="primary" />
                        <Text size="sm" color="primary" weight="medium" style={{ marginLeft: 8 }}>
                          Agregar participante
                        </Text>
                      </AddParticipantButton>
                    </>
                  )}
                </ParticipantsSection>

                {/* Purpose */}
                <FormField
                  label="Propósito de la reunión"
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="Reunión de equipo, presentación cliente..."
                  multiline
                  numberOfLines={3}
                  style={{ marginBottom: 0 }}
                />
              </ContentPadding>
            </ScrollContent>

            <Footer bottomInset={insets.bottom}>
              <ButtonRow>
                <Button
                  variant="outline"
                  onPress={handleClose}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                
                <Button
                  onPress={handleConfirm}
                  loading={loading}
                  disabled={loading || !isFormValid()}
                  style={{ flex: 2 }}
                >
                  Confirmar Reserva
                </Button>
              </ButtonRow>
            </Footer>
          </Container>
        </ModalBackdrop>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
});

ReservationBottomSheet.displayName = 'ReservationBottomSheet';

export default ReservationBottomSheet; 