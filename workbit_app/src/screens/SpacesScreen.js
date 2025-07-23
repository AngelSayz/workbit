import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const SpacesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Espacios</Text>
        <Text style={styles.subtitle}>Layout visual de espacios</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.placeholderContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="construct-outline" size={64} color="#3b82f6" />
          </View>
          
          <Text style={styles.workingTitle}>En Desarrollo</Text>
          <Text style={styles.workingSubtitle}>
            Estamos trabajando en el layout visual de espacios con estado en tiempo real
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Vista en tiempo real</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Reserva instantánea</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Estado visual de cubículos</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  workingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  workingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    alignSelf: 'stretch',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});

export default SpacesScreen; 