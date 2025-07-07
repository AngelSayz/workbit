import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styled from 'styled-components/native';
import { Text, Button, Icon } from '../components/atoms';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding-bottom: ${({ paddingBottom }) => paddingBottom}px;
`;

const Content = styled(ScrollView)`
  flex: 1;
`;

const ProfileHeader = styled.View`
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
  background-color: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const Avatar = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: ${({ theme }) => theme.colors.primary};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const Section = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const SectionHeader = styled.View`
  padding: ${({ theme }) => `${theme.spacing.md}px ${theme.spacing.lg}px`};
  background-color: ${({ theme }) => theme.colors.background};
`;

const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.divider};
`;

const MenuItemIcon = styled.View`
  width: 30px;
  margin-right: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
`;

const MenuItemContent = styled.View`
  flex: 1;
`;

const MenuItemChevron = styled.View`
  margin-left: ${({ theme }) => theme.spacing.sm}px;
`;

/**
 * Profile screen with iOS-style settings list
 */
const ProfileScreen = ({ navigation, onLogout }) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const menuItems = [
    {
      section: 'Configuración',
      items: [
        {
          icon: 'settings',
          title: 'Configuración General',
          subtitle: 'Tema, idioma, accesibilidad',
          onPress: () => navigation.navigate('Settings'),
        },
        {
          icon: 'bell',
          title: 'Notificaciones',
          subtitle: 'Alertas y preferencias',
          onPress: () => navigation.navigate('NotificationSettings'),
        },
      ],
    },
    {
      section: 'Cuenta',
      items: [
        {
          icon: 'user',
          title: 'Información Personal',
          subtitle: 'Editar perfil y datos',
          onPress: () => console.log('Edit profile'),
        },
        {
          icon: 'shield',
          title: 'Privacidad y Seguridad',
          subtitle: 'Contraseña, datos',
          onPress: () => console.log('Privacy settings'),
        },
      ],
    },
    {
      section: 'Soporte',
      items: [
        {
          icon: 'help-circle',
          title: 'Ayuda y Soporte',
          subtitle: 'FAQ, contacto',
          onPress: () => console.log('Help'),
        },
        {
          icon: 'info',
          title: 'Acerca de WorkBit',
          subtitle: 'Versión 2.0.0',
          onPress: () => console.log('About'),
        },
      ],
    },
  ];

  const renderMenuItem = (item, isLast = false) => (
    <MenuItem
      key={item.title}
      onPress={item.onPress}
      style={isLast ? { borderBottomWidth: 0 } : {}}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <MenuItemIcon>
        <Icon
          name={item.icon}
          size={20}
          color="textSecondary"
        />
      </MenuItemIcon>
      <MenuItemContent>
        <Text size="md" weight="medium" marginBottom="xs">
          {item.title}
        </Text>
        <Text size="sm" color="textSecondary">
          {item.subtitle}
        </Text>
      </MenuItemContent>
      <MenuItemChevron>
        <Icon
          name="chevron-right"
          size={16}
          color="textSecondary"
        />
      </MenuItemChevron>
    </MenuItem>
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container paddingBottom={Math.max(insets.bottom, 70)}>
      <Content showsVerticalScrollIndicator={false}>
        <ProfileHeader>
          <Avatar>
            <Text size="xl" weight="bold" color="textOnPrimary">
              {getInitials(user?.name)}
            </Text>
          </Avatar>
          <Text size="xl" weight="semibold" marginBottom="xs">
            {user?.name || 'Usuario'}
          </Text>
          <Text size="md" color="textSecondary" marginBottom="sm">
            {user?.email || 'email@ejemplo.com'}
          </Text>
          <Text size="sm" color="textSecondary">
            Miembro desde {new Date().getFullYear()}
          </Text>
        </ProfileHeader>

        {menuItems.map((section) => (
          <Section key={section.section}>
            <SectionHeader>
              <Text size="sm" weight="medium" color="textSecondary">
                {section.section}
              </Text>
            </SectionHeader>
            {section.items.map((item, index) =>
              renderMenuItem(item, index === section.items.length - 1)
            )}
          </Section>
        ))}

        <Section>
          <MenuItem
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <MenuItemIcon>
              <Icon
                name="log-out"
                size={20}
                color="error"
              />
            </MenuItemIcon>
            <MenuItemContent>
              <Text size="md" weight="medium" color="error">
                Cerrar Sesión
              </Text>
            </MenuItemContent>
          </MenuItem>
        </Section>
      </Content>
    </Container>
  );
};

export default ProfileScreen; 