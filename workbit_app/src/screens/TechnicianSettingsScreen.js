import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const TechnicianSettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Preferencias del técnico</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximamente</Text>
          <Text style={styles.cardText}>Ajustes de notificaciones, disponibilidad y más.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { color: '#6B7280', marginTop: 4 },
  content: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  cardText: { color: '#6B7280' },
});

export default TechnicianSettingsScreen;
