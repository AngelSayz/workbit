import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [profileImage, setProfileImage] = useState(null);

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

  const handleImagePicker = async () => {
    Alert.alert(
      'Cambiar Foto de Perfil',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => pickImage('camera') },
        { text: 'Galería', onPress: () => pickImage('library') }
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      const permissionResult = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tus fotos');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Cambiar Idioma',
      'Selecciona tu idioma preferido',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Español', 
          onPress: () => setSelectedLanguage('es'),
          style: selectedLanguage === 'es' ? 'default' : 'default'
        },
        { 
          text: 'English', 
          onPress: () => setSelectedLanguage('en'),
          style: selectedLanguage === 'en' ? 'default' : 'default'
        }
      ]
    );
  };

  const getLanguageText = (lang) => {
    switch (lang) {
      case 'es': return 'Español';
      case 'en': return 'English';
      default: return 'Español';
    }
  };

  const ProfileItem = ({ icon, title, value, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#3b82f6" />
        </View>
        <View style={styles.profileContent}>
          <Text style={styles.profileLabel}>{title}</Text>
          {value && <Text style={styles.profileValue}>{value}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
  );

  const MenuSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="white" />
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.fullname || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@ejemplo.com'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#3b82f6" />
            <Text style={styles.roleText}>{getRoleText(user?.role)}</Text>
          </View>
        </View>

        {/* Profile Information */}
        <MenuSection title="Información Personal">
          <ProfileItem 
            icon="person-outline" 
            title="Nombre Completo" 
            value={user?.fullname || 'No disponible'} 
          />
          <ProfileItem 
            icon="at-outline" 
            title="Usuario" 
            value={user?.username || 'No disponible'} 
          />
          <ProfileItem 
            icon="mail-outline" 
            title="Email" 
            value={user?.email || 'No disponible'} 
          />
          <ProfileItem 
            icon="card-outline" 
            title="Código de Tarjeta" 
            value={user?.cardCode || 'No asignado'} 
          />
        </MenuSection>

        {/* Preferences */}
        <MenuSection title="Preferencias">
          <ProfileItem 
            icon="moon-outline" 
            title="Modo Oscuro" 
            onPress={() => setIsDarkMode(!isDarkMode)}
            rightComponent={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={isDarkMode ? '#ffffff' : '#ffffff'}
              />
            }
            showArrow={false}
          />
          <ProfileItem 
            icon="language-outline" 
            title="Idioma" 
            value={getLanguageText(selectedLanguage)}
            onPress={handleLanguageChange}
          />
        </MenuSection>

        {/* App Information */}
        <MenuSection title="Información de la App">
          <ProfileItem 
            icon="phone-portrait-outline" 
            title="Versión de la App" 
            value="2.0.0" 
            showArrow={false}
          />
          <ProfileItem 
            icon="cloud-outline" 
            title="Servidor" 
            value="Render Cloud" 
            showArrow={false}
          />
          <ProfileItem 
            icon="pulse-outline" 
            title="Estado del Servidor" 
            value="Conectado" 
            onPress={() => Alert.alert('Estado del Servidor', 'Conexión estable con el servidor de WorkBit en Render')} 
          />
        </MenuSection>

        {/* Support */}
        <MenuSection title="Soporte">
          <ProfileItem 
            icon="help-circle-outline" 
            title="Centro de Ayuda" 
            onPress={() => Alert.alert('Centro de Ayuda', 'Para obtener ayuda, contacta al administrador del sistema o revisa la documentación de WorkBit.')} 
          />
          <ProfileItem 
            icon="bug-outline" 
            title="Reportar Problema" 
            onPress={() => Alert.alert('Reportar Problema', 'Para reportar un problema, contacta al administrador del sistema con una descripción detallada del issue.')} 
          />
          <ProfileItem 
            icon="information-circle-outline" 
            title="Acerca de WorkBit" 
            onPress={() => Alert.alert('WorkBit v2.0.0', 'Sistema de gestión de espacios de trabajo desarrollado para optimizar la reserva y uso de cubículos en tiempo real.')} 
          />
        </MenuSection>

        {/* Logout Section */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>WorkBit Mobile v2.0.0</Text>
          <Text style={styles.footerSubtitle}>
            Desarrollado para gestión de espacios de trabajo
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  profileCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', position: 'relative', marginBottom: 16 },
  avatar: { width: '100%', height: '100%', backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', borderRadius: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  userEmail: { color: '#6B7280', fontSize: 16, marginBottom: 4 },
  username: { color: '#6B7280', fontSize: 16 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 12 },
  roleText: { color: '#1E40AF', fontSize: 14, fontWeight: '500' },
  profileItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  profileItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  profileContent: { flex: 1 },
  profileLabel: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  profileValue: { fontSize: 16, fontWeight: '500', color: '#111827' },
  profileItemRight: { flexDirection: 'row', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12, paddingHorizontal: 8 },
  sectionContent: { paddingHorizontal: 8 },
  logoutSection: { marginTop: 32 },
  logoutButton: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  footer: { marginTop: 32, alignItems: 'center', paddingBottom: 32 },
  footerTitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  footerSubtitle: { color: '#D1D5DB', fontSize: 12, textAlign: 'center', marginTop: 4 },
});

export default ProfileScreen; 