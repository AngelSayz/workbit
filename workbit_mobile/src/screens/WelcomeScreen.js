import React from 'react';
import { Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';
import { Text, Button } from '../components/atoms';

const { width, height } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const DiagonalSection = styled(LinearGradient)`
  flex: 0.6;
  justify-content: center;
  align-items: center;
  transform: skewY(-6deg);
  margin-top: -50px;
  padding-top: 50px;
`;

const ContentSection = styled.View`
  flex: 0.4;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const LogoText = styled(Text)`
  transform: skewY(6deg);
`;

const WelcomeText = styled(Text)`
  transform: skewY(6deg);
  text-align: center;
`;

const ButtonContainer = styled.View`
  width: 100%;
  max-width: 300px;
`;

const ButtonWrapper = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

/**
 * Welcome screen with diagonal design and branding
 */
const WelcomeScreen = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Auth', { mode: 'login' });
  };

  const handleRegister = () => {
    navigation.navigate('Auth', { mode: 'register' });
  };

  return (
    <Container>
      <DiagonalSection
        colors={['#1976D2', '#42A5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <LogoContainer>
          <LogoText
            size="xxxl"
            weight="bold"
            color="textOnPrimary"
            marginBottom="sm"
          >
            WorkBit
          </LogoText>
          <WelcomeText
            size="lg"
            color="textOnPrimary"
            weight="light"
          >
            Tu espacio de trabajo ideal
          </WelcomeText>
        </LogoContainer>
      </DiagonalSection>

      <ContentSection>
        <Text
          size="xl"
          weight="semibold"
          align="center"
          marginBottom="md"
        >
          Bienvenido a WorkBit
        </Text>
        
        <Text
          size="md"
          color="textSecondary"
          align="center"
          marginBottom="xl"
        >
          Reserva espacios, monitorea condiciones ambientales y optimiza tu productividad en tiempo real.
        </Text>

        <ButtonContainer>
          <ButtonWrapper>
            <Button
              onPress={handleLogin}
              fullWidth
              size="lg"
              accessibilityLabel="Iniciar sesión en WorkBit"
              accessibilityHint="Ir a la pantalla de inicio de sesión"
            >
              Iniciar Sesión
            </Button>
          </ButtonWrapper>
          
          <ButtonWrapper>
            <Button
              variant="outline"
              onPress={handleRegister}
              fullWidth
              size="lg"
              accessibilityLabel="Crear cuenta nueva en WorkBit"
              accessibilityHint="Ir a la pantalla de registro"
            >
              Crear Cuenta
            </Button>
          </ButtonWrapper>
          
          <ButtonWrapper>
            <Button
              variant="ghost"
              onPress={() => {
                // API_CALL: Learn more or demo functionality
                console.log('Learn more pressed');
              }}
              fullWidth
              accessibilityLabel="Más información sobre WorkBit"
            >
              Saber más
            </Button>
          </ButtonWrapper>
        </ButtonContainer>
      </ContentSection>
    </Container>
  );
};

export default WelcomeScreen; 