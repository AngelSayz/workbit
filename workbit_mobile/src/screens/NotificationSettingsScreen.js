import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import styled from 'styled-components/native';
import { Text } from '../components/atoms';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const NotificationSection = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const NotificationItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
`;

const LastNotificationItem = styled(NotificationItem)`
  border-bottom-width: 0;
`;

const NotificationDescription = styled(Text)`
  margin-top: ${({ theme }) => theme.spacing.xs}px;
  max-width: 70%;
`;

/**
 * Notification settings screen
 */
const NotificationSettingsScreen = () => {
  const [reservationReminders, setReservationReminders] = useState(true);
  const [environmentalAlerts, setEnvironmentalAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <NotificationSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Tipos de Notificaciones
          </Text>
          
          <NotificationItem>
            <View style={{ flex: 1 }}>
              <Text size="md">Recordatorios de Reserva</Text>
              <NotificationDescription size="sm" color="textSecondary">
                Te notificaremos 15 minutos antes de tu reserva
              </NotificationDescription>
            </View>
            <Switch
              value={reservationReminders}
              onValueChange={setReservationReminders}
            />
          </NotificationItem>
          
          <NotificationItem>
            <View style={{ flex: 1 }}>
              <Text size="md">Alertas Ambientales</Text>
              <NotificationDescription size="sm" color="textSecondary">
                Condiciones ambientales fuera del rango normal
              </NotificationDescription>
            </View>
            <Switch
              value={environmentalAlerts}
              onValueChange={setEnvironmentalAlerts}
            />
          </NotificationItem>
          
          <NotificationItem>
            <View style={{ flex: 1 }}>
              <Text size="md">Actualizaciones del Sistema</Text>
              <NotificationDescription size="sm" color="textSecondary">
                Nuevas funciones y mantenimientos
              </NotificationDescription>
            </View>
            <Switch
              value={systemUpdates}
              onValueChange={setSystemUpdates}
            />
          </NotificationItem>
          
          <LastNotificationItem>
            <View style={{ flex: 1 }}>
              <Text size="md">Reportes Semanales</Text>
              <NotificationDescription size="sm" color="textSecondary">
                Resumen de tu actividad semanal
              </NotificationDescription>
            </View>
            <Switch
              value={weeklyReports}
              onValueChange={setWeeklyReports}
            />
          </LastNotificationItem>
        </NotificationSection>

        <NotificationSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Métodos de Entrega
          </Text>
          
          <NotificationItem>
            <Text size="md">Notificaciones Push</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </NotificationItem>
          
          <LastNotificationItem>
            <Text size="md">Notificaciones por Email</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </LastNotificationItem>
        </NotificationSection>
      </ScrollView>
    </Container>
  );
};

export default NotificationSettingsScreen; 