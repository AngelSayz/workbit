import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { Text } from '../components/atoms';
import { LoginModule } from '../components/organisms';
import { Toast } from '../components/molecules';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const Header = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
  margin-top: ${({ theme }) => theme.spacing.xl}px;
`;

const ToastContainer = styled.View`
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 1000;
`;

/**
 * Authentication screen with login/register functionality
 */
const AuthScreen = ({ navigation, route, onAuthentication }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  // Get initial mode from navigation params
  const initialMode = route?.params?.mode || 'login';

  const showToast = (message, type = 'info', description = '') => {
    setToast({ message, type, description });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      // API_CALL: loginUser(email, password)
      console.log('Login attempt:', { email, password });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      const userData = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email,
          name: 'Usuario Demo',
          role: 'user'
        }
      };

      await onAuthentication(userData);
      showToast('¡Bienvenido de vuelta!', 'success');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError('');

    try {
      // API_CALL: registerUser(userData)
      console.log('Register attempt:', userData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful registration
      const authData = {
        token: 'mock-jwt-token',
        user: {
          id: Date.now(),
          email: userData.email,
          name: userData.name,
          username: userData.username,
          role: 'user'
        }
      };

      await onAuthentication(authData);
      showToast('¡Cuenta creada exitosamente!', 'success', 'Bienvenido a WorkBit');
      
    } catch (error) {
      console.error('Register error:', error);
      setError('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    if (!email) {
      Alert.alert(
        'Email requerido',
        'Por favor ingresa tu email primero para recuperar tu contraseña.'
      );
      return;
    }

    try {
      // API_CALL: requestPasswordReset(email)
      console.log('Password reset request for:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Email enviado',
        `Se ha enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar el email de recuperación. Intenta nuevamente.'
      );
    }
  };

  return (
    <Container>
      {toast && (
        <ToastContainer>
          <Toast
            message={toast.message}
            description={toast.description}
            type={toast.type}
          />
        </ToastContainer>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Content
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header>
            <Text size="xxl" weight="bold" color="primary" marginBottom="sm">
              WorkBit
            </Text>
            <Text size="md" color="textSecondary" align="center">
              Espacios inteligentes para el trabajo moderno
            </Text>
          </Header>

          <LoginModule
            onLogin={handleLogin}
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
            loading={loading}
            error={error}
            initialMode={initialMode}
          />
        </Content>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AuthScreen; 