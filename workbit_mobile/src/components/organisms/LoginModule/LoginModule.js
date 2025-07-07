import React, { useState, useRef } from 'react';
import { Animated, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Text, Button } from '../../atoms';
import { FormField } from '../../molecules';

const { width: screenWidth } = Dimensions.get('window');
const maxWidth = Math.min(screenWidth - 32, 400); // 16px padding on each side, max 400px

const Container = styled.View`
  width: 100%;
  max-width: ${maxWidth}px;
  align-self: center;
  overflow: hidden;
`;

const SlideContainer = styled(Animated.View)`
  flex-direction: row;
  width: ${maxWidth * 2}px;
`;

const FormCard = styled.View`
  width: ${maxWidth}px;
  justify-content: flex-start;
`;

const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.xl}px;
  padding: ${({ theme }) => theme.spacing.xl}px;
  min-height: 520px;
  max-height: 650px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.large.shadowColor};
    shadow-offset: ${theme.shadows.large.shadowOffset.width}px ${theme.shadows.large.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.large.shadowOpacity};
    shadow-radius: ${theme.shadows.large.shadowRadius}px;
    elevation: ${theme.shadows.large.elevation};
  `}
`;

const ScrollableCard = styled(ScrollView)`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.xl}px;
  max-height: 650px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.large.shadowColor};
    shadow-offset: ${theme.shadows.large.shadowOffset.width}px ${theme.shadows.large.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.large.shadowOpacity};
    shadow-radius: ${theme.shadows.large.shadowRadius}px;
    elevation: ${theme.shadows.large.elevation};
  `}
`;

const ScrollableCardContent = styled.View`
  padding: ${({ theme }) => theme.spacing.xl}px;
  min-height: 520px;
`;

const Header = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const FormContainer = styled.View`
  flex: 1;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const ToggleContainer = styled.View`
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  padding-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const ToggleText = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ForgotPasswordContainer = styled.View`
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

/**
 * LoginModule organism with smooth slide animation between login and register
 * @param {function} onLogin - Login handler (email, password) => Promise
 * @param {function} onRegister - Register handler (userData) => Promise
 * @param {function} onForgotPassword - Forgot password handler
 * @param {boolean} loading - Whether form is in loading state
 * @param {string} error - Error message to display
 * @param {string} initialMode - 'login' or 'register'
 */
const LoginModule = ({
  onLogin,
  onRegister,
  onForgotPassword,
  loading = false,
  error,
  initialMode = 'login',
  ...props
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    // Register fields
    name: '',
    lastname: '',
    username: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation value for horizontal slide
  const slideAnimation = useRef(new Animated.Value(initialMode === 'register' ? 1 : 0)).current;

  const slideToMode = (toRegister) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setFormErrors({});
    
    // Clear form data when switching
    setFormData({
      email: '',
      password: '',
      name: '',
      lastname: '',
      username: '',
      confirmPassword: '',
    });

    const toValue = toRegister ? 1 : 0;
    
    Animated.timing(slideAnimation, {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setIsRegisterMode(toRegister);
      setIsAnimating(false);
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Common validations
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Register-specific validations
    if (isRegisterMode) {
      if (!formData.name) {
        errors.name = 'El nombre es requerido';
      }
      if (!formData.lastname) {
        errors.lastname = 'El apellido es requerido';
      }
      if (!formData.username) {
        errors.username = 'El nombre de usuario es requerido';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || loading || isAnimating) return;

    try {
      if (isRegisterMode) {
        await onRegister?.({
          name: formData.name,
          lastname: formData.lastname,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      } else {
        await onLogin?.(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleForgotPassword = () => {
    if (isAnimating) return;
    onForgotPassword?.(formData.email);
  };

  const handleToggleMode = (toRegister) => {
    if (isAnimating) return;
    slideToMode(toRegister);
  };

  // Calculate slide position
  const slideStyle = {
    transform: [
      {
        translateX: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -maxWidth],
        }),
      },
    ],
  };

  return (
    <Container {...props}>
      <SlideContainer style={slideStyle}>
        {/* Login Form */}
        <FormCard>
          <Card>
            <Header>
              <Text size="xxl" weight="bold" align="center" marginBottom="sm">
                Bienvenido
              </Text>
              <Text size="md" color="textSecondary" align="center">
                Inicia sesión para acceder a WorkBit
              </Text>
            </Header>

            <FormContainer>
              <FormField
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.email}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Contraseña"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.password}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isAnimating && !loading}
              />

              <ForgotPasswordContainer>
                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  disabled={isAnimating || loading}
                >
                  <Text size="sm" color="primary" weight="medium">
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </ForgotPasswordContainer>
            </FormContainer>

            {error && (
              <Text size="sm" color="error" align="center" marginBottom="md">
                {error}
              </Text>
            )}

            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || isAnimating}
              fullWidth
              style={{ marginTop: 8 }}
            >
              Iniciar Sesión
            </Button>

            <ToggleContainer>
              <ToggleText>
                <Text size="sm" color="textSecondary">
                  ¿No tienes cuenta? 
                </Text>
                <TouchableOpacity 
                  onPress={() => handleToggleMode(true)} 
                  disabled={isAnimating || loading}
                >
                  <Text size="sm" color="primary" weight="medium">
                    {' '}Regístrate
                  </Text>
                </TouchableOpacity>
              </ToggleText>
            </ToggleContainer>
          </Card>
        </FormCard>

        {/* Register Form */}
        <FormCard>
          <ScrollableCard
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <ScrollableCardContent>
              <Header>
                <Text size="xxl" weight="bold" align="center" marginBottom="sm">
                  Crear Cuenta
                </Text>
                <Text size="md" color="textSecondary" align="center">
                  Únete a WorkBit y reserva tu espacio ideal
                </Text>
              </Header>

              <FormContainer>
              <FormField
                label="Nombre"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Tu nombre"
                autoCapitalize="words"
                error={formErrors.name}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Apellido"
                value={formData.lastname}
                onChangeText={(value) => updateField('lastname', value)}
                placeholder="Tu apellido"
                autoCapitalize="words"
                error={formErrors.lastname}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Nombre de usuario"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                placeholder="usuario123"
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.username}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.email}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Contraseña"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.password}
                returnKeyType="next"
                editable={!isAnimating && !loading}
              />

              <FormField
                label="Confirmar contraseña"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={formErrors.confirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isAnimating && !loading}
              />
              </FormContainer>

              {error && (
                <Text size="sm" color="error" align="center" marginBottom="md">
                  {error}
                </Text>
              )}

              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || isAnimating}
                fullWidth
                style={{ marginTop: 8 }}
              >
                Crear Cuenta
              </Button>

              <ToggleContainer>
                <ToggleText>
                  <Text size="sm" color="textSecondary">
                    ¿Ya tienes cuenta? 
                  </Text>
                  <TouchableOpacity 
                    onPress={() => handleToggleMode(false)} 
                    disabled={isAnimating || loading}
                  >
                    <Text size="sm" color="primary" weight="medium">
                      {' '}Inicia sesión
                    </Text>
                  </TouchableOpacity>
                </ToggleText>
              </ToggleContainer>
            </ScrollableCardContent>
          </ScrollableCard>
        </FormCard>
      </SlideContainer>
    </Container>
  );
};

export default LoginModule; 