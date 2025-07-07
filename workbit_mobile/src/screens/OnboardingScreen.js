import React, { useState, useRef } from 'react';
import { Dimensions, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { Text, Button, Icon } from '../components/atoms';

const { width, height } = Dimensions.get('window');

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const SlideContainer = styled.View`
  width: ${width}px;
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
`;

const IconContainer = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${({ theme, bgColor }) => theme.colors[bgColor] || theme.colors.primary};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const ContentContainer = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const IndicatorContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const Indicator = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin: 0 4px;
  background-color: ${({ theme, active }) => 
    active ? theme.colors.primary : theme.colors.inactive};
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const SkipButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.md}px;
`;

const slides = [
  {
    id: 1,
    icon: 'map',
    iconColor: 'primary',
    bgColor: 'primary',
    title: 'Encuentra tu espacio ideal',
    description: 'Explora el mapa interactivo y descubre todos los espacios disponibles en tiempo real.',
  },
  {
    id: 2,
    icon: 'calendar',
    iconColor: 'textOnPrimary',
    bgColor: 'success',
    title: 'Reserva en segundos',
    description: 'Selecciona tu espacio favorito y haz tu reserva de forma rápida y sencilla.',
  },
  {
    id: 3,
    icon: 'activity',
    iconColor: 'textOnPrimary',
    bgColor: 'warning',
    title: 'Monitorea el ambiente',
    description: 'Mantente informado sobre las condiciones ambientales de tu espacio reservado.',
  },
  {
    id: 4,
    icon: 'smartphone',
    iconColor: 'textOnPrimary',
    bgColor: 'info',
    title: '¡Listo para empezar!',
    description: 'Ahora tienes todo lo necesario para optimizar tu experiencia de trabajo.',
  },
];

/**
 * Onboarding screen with tutorial slides
 */
const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    navigation.replace('Welcome');
  };

  const renderSlide = ({ item }) => (
    <SlideContainer>
      <IconContainer bgColor={item.bgColor}>
        <Icon
          name={item.icon}
          size={60}
          color={item.iconColor}
          accessibilityHidden={true}
        />
      </IconContainer>
      
      <ContentContainer>
        <Text
          size="xxl"
          weight="bold"
          align="center"
          marginBottom="lg"
        >
          {item.title}
        </Text>
        
        <Text
          size="lg"
          color="textSecondary"
          align="center"
          style={{ lineHeight: 28 }}
        >
          {item.description}
        </Text>
      </ContentContainer>
    </SlideContainer>
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
      }
    }
  );

  return (
    <Container>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <IndicatorContainer>
        {slides.map((_, index) => (
          <Indicator key={index} active={index === currentIndex} />
        ))}
      </IndicatorContainer>

      <ButtonContainer>
        <SkipButton
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Omitir tutorial"
        >
          <Text size="md" color="textSecondary">
            Omitir
          </Text>
        </SkipButton>

        <Button
          onPress={handleNext}
          accessibilityLabel={
            currentIndex === slides.length - 1 ? 'Comenzar a usar WorkBit' : 'Siguiente slide'
          }
        >
          {currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default OnboardingScreen; 