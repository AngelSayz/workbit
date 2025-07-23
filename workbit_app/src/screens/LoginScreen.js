import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'El usuario es obligatorio';
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    const result = await login(username.trim(), password);
    
    if (!result.success) {
      Alert.alert(
        'Error de Autenticación',
        result.error || 'Credenciales inválidas. Verifica tu usuario y contraseña.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>W</Text>
            </View>
            <Text style={styles.title}>
              Bienvenido a WorkBit
            </Text>
            <Text style={styles.subtitle}>
              Inicia sesión para acceder a tu cuenta
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              placeholder="Ingresa tu usuario"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              error={errors.password}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.passwordInput}
            />
            
            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Problemas para acceder? Contacta al administrador
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 16,
  },
  form: {
    gap: 24,
  },
  passwordInput: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 32,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen; 