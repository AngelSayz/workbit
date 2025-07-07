import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { Text } from '../../atoms';

const Container = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
  ${({ fullScreen, theme }) => fullScreen && `
    flex: 1;
    background-color: ${theme.colors.background};
  `}
`;

const MessageText = styled(Text)`
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

/**
 * LoadingSpinner molecule for consistent loading states
 * @param {string} message - Optional loading message
 * @param {string} size - Spinner size (small, large)
 * @param {string} color - Spinner color from theme
 * @param {boolean} fullScreen - Whether to take full screen
 * @param {object} style - Additional styles
 */
const LoadingSpinner = ({
  message,
  size = 'large',
  color = 'primary',
  fullScreen = false,
  style,
  ...props
}) => {
  const theme = useTheme();
  
  // Get actual color value from theme
  const spinnerColor = theme.colors[color] || color;

  return (
    <Container 
      fullScreen={fullScreen} 
      style={style}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Cargando'}
      {...props}
    >
      <ActivityIndicator 
        size={size} 
        color={spinnerColor} 
      />
      {message && (
        <MessageText
          size="md"
          color="textSecondary"
          align="center"
        >
          {message}
        </MessageText>
      )}
    </Container>
  );
};

export default LoadingSpinner; 