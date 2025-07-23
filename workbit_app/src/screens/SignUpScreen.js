import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuth();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es obligatorio';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    const { confirmPassword, ...userData } = formData;
    
    const result = await register({
      ...userData,
      email: userData.email.toLowerCase().trim(),
      username: userData.username.toLowerCase().trim(),
      name: userData.name.trim(),
      lastname: userData.lastname.trim(),
    });
    
    if (result.success) {
      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      Alert.alert(
        'Error de Registro',
        result.error || 'No se pudo crear la cuenta. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
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
              Crear Cuenta
            </Text>
            <Text style={styles.subtitle}>
              Únete a WorkBit para gestionar espacios de trabajo
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameInputContainer}>
                <Input
                  label="Nombre"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Tu nombre"
                  error={errors.name}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.nameInputContainer}>
                <Input
                  label="Apellido"
                  value={formData.lastname}
                  onChangeText={(value) => updateField('lastname', value)}
                  placeholder="Tu apellido"
                  error={errors.lastname}
                  autoCapitalize="words"
                />
              </View>
            </View>
            
            <Input
              label="Nombre de Usuario"
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Elige un nombre de usuario"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="tu@email.com"
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            
            <Input
              label="Contraseña"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              error={errors.password}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Input
              label="Confirmar Contraseña"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              placeholder="Repite tu contraseña"
              secureTextEntry
              error={errors.confirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>
              ¿Ya tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.loginLink}>
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al registrarte, aceptas nuestros términos de servicio
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
    marginBottom: 32,
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
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInputContainer: {
    flex: 1,
  },
  registerButton: {
    marginTop: 24,
  },
  loginSection: {
    marginTop: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 16,
  },
  loginLink: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SignUpScreen; 