import React, { useState } from 'react';
import { ScrollView, Switch } from 'react-native';
import styled from 'styled-components/native';
import { Text, Button } from '../components/atoms';
import { useTheme } from '../constants/theme';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const SettingsSection = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const SettingItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
`;

const LastSettingItem = styled(SettingItem)`
  border-bottom-width: 0;
`;

const ThemeOptionContainer = styled.View`
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;

/**
 * Settings screen for app configuration
 */
const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme, isFollowingSystem, resetToSystemTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleLogout = () => {
    // API_CALL: logout()
    console.log('Logout pressed');
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Preferencias
          </Text>
          
          <SettingItem>
            <Text size="md">Notificaciones</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
            />
          </SettingItem>
          
          <SettingItem>
            <Text size="md">Modo Oscuro</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
            />
          </SettingItem>
          
          {!isFollowingSystem && (
            <ThemeOptionContainer>
              <Text 
                size="sm" 
                color="primary" 
                onPress={resetToSystemTheme}
                style={{ textAlign: 'right' }}
              >
                Seguir configuración del sistema
              </Text>
            </ThemeOptionContainer>
          )}
          
          <LastSettingItem>
            <Text size="md">Sincronización Automática</Text>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
            />
          </LastSettingItem>
        </SettingsSection>

        <SettingsSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Configuración Avanzada
          </Text>
          
          <SettingItem>
            <Text size="md" onPress={handleNotificationSettings}>
              Configurar Notificaciones
            </Text>
          </SettingItem>
          
          <LastSettingItem>
            <Text size="md">Gestión de Datos</Text>
          </LastSettingItem>
        </SettingsSection>

        <SettingsSection>
          <Text size="lg" weight="semibold" marginBottom="md">
            Información
          </Text>
          
          <SettingItem>
            <Text size="md">Versión de la App</Text>
            <Text size="md" color="textSecondary">2.0.0</Text>
          </SettingItem>
          
          <SettingItem>
            <Text size="md">Términos y Condiciones</Text>
          </SettingItem>
          
          <LastSettingItem>
            <Text size="md">Política de Privacidad</Text>
          </LastSettingItem>
        </SettingsSection>

        <SettingsSection>
          <Button
            variant="outline"
            onPress={handleLogout}
            fullWidth
            accessibilityLabel="Cerrar sesión"
          >
            Cerrar Sesión
          </Button>
        </SettingsSection>
      </ScrollView>
    </Container>
  );
};

export default SettingsScreen; 