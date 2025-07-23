import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
          }
        }
      ]
    );
  };

  const ProfileItem = ({ icon, title, value, onPress }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.profileIcon}>{icon}</Text>
      <View style={styles.profileContent}>
        <Text style={styles.profileLabel}>{title}</Text>
        <Text style={styles.profileValue}>{value}</Text>
      </View>
      {onPress && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  const MenuSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const getRoleText = (role) => {
    switch (role) {
      case 'user': return 'Usuario';
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
      default: return 'Usuario';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullname?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullname || 'Usuario'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleText(user?.role)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <MenuSection title="Información Personal">
          <ProfileItem icon="👤" title="Nombre Completo" value={user?.fullname || 'No disponible'} />
          <ProfileItem icon="🏷️" title="Usuario" value={user?.username || 'No disponible'} />
          <ProfileItem icon="🎭" title="Rol" value={getRoleText(user?.role)} />
        </MenuSection>

        <MenuSection title="Información de la App">
          <ProfileItem icon="📱" title="Versión de la App" value="2.0.0" />
          <ProfileItem icon="🌐" title="Servidor" value="Render Cloud" />
          <ProfileItem 
            icon="📊" 
            title="Estado del Servidor" 
            value="Conectado" 
            onPress={() => Alert.alert('Estado del Servidor', 'Conexión estable con el servidor de WorkBit en Render')} 
          />
        </MenuSection>

        <MenuSection title="Soporte">
          <ProfileItem 
            icon="❓" 
            title="Centro de Ayuda" 
            value="Obtener asistencia" 
            onPress={() => Alert.alert('Centro de Ayuda', 'Para obtener ayuda, contacta al administrador del sistema o revisa la documentación de WorkBit.')} 
          />
          <ProfileItem 
            icon="🐛" 
            title="Reportar Problema" 
            value="Enviar feedback" 
            onPress={() => Alert.alert('Reportar Problema', 'Para reportar un problema, contacta al administrador del sistema con una descripción detallada del issue.')} 
          />
        </MenuSection>

        <View style={styles.logoutSection}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            loading={isLoggingOut}
            disabled={isLoggingOut}
            variant="secondary"
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>WorkBit Mobile v2.0.0</Text>
          <Text style={styles.footerSubtitle}>Desarrollado para gestión de espacios de trabajo</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 80, height: 80, backgroundColor: '#3b82f6', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  username: { color: '#6B7280', fontSize: 16 },
  roleBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#DBEAFE', borderRadius: 12 },
  roleText: { color: '#1E40AF', fontSize: 14, fontWeight: '500' },
  content: { paddingHorizontal: 24, paddingVertical: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12, paddingHorizontal: 8 },
  profileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  profileIcon: { fontSize: 24, marginRight: 16 },
  profileContent: { flex: 1 },
  profileLabel: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  profileValue: { fontSize: 16, fontWeight: '500', color: '#111827' },
  arrow: { color: '#D1D5DB', fontSize: 18 },
  logoutSection: { marginTop: 32 },
  logoutButton: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  footer: { marginTop: 32, alignItems: 'center', paddingBottom: 32 },
  footerTitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  footerSubtitle: { color: '#D1D5DB', fontSize: 12, textAlign: 'center', marginTop: 4 },
});

export default ProfileScreen; 