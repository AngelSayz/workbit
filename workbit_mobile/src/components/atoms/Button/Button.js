import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import styled from 'styled-components/native';
import Text from '../Text/Text';

const StyledButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${({ theme, size }) => {
    switch (size) {
      case 'sm': return `${theme.spacing.sm}px ${theme.spacing.md}px`;
      case 'lg': return `${theme.spacing.lg}px ${theme.spacing.xl}px`;
      default: return `${theme.spacing.md}px ${theme.spacing.lg}px`;
    }
  }};
  border-radius: ${({ theme, rounded }) => {
    if (rounded === 'full') return theme.borderRadius.full;
    return theme.borderRadius[rounded || 'md'];
  }}px;
  background-color: ${({ theme, variant, color }) => {
    if (variant === 'outline' || variant === 'ghost') return 'transparent';
    return theme.colors[color] || theme.colors.primary;
  }};
  border-width: ${({ variant }) => variant === 'outline' ? 1 : 0}px;
  border-color: ${({ theme, color, variant }) => 
    variant === 'outline' ? (theme.colors[color] || theme.colors.primary) : 'transparent'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  ${({ theme, fullWidth }) => fullWidth && 'width: 100%;'}
  ${({ theme, variant }) => variant === 'ghost' && 'background-color: transparent;'}
`;

const ButtonText = styled(Text)`
  color: ${({ theme, variant, color }) => {
    if (variant === 'outline' || variant === 'ghost') {
      return theme.colors[color] || theme.colors.primary;
    }
    return theme.colors.textOnPrimary;
  }};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

/**
 * Button component with haptic feedback and accessibility features
 * @param {string} children - Button text content
 * @param {function} onPress - Press handler
 * @param {string} variant - Button style variant (filled, outline, ghost)
 * @param {string} color - Button color from theme
 * @param {string} size - Button size (sm, md, lg)
 * @param {string} rounded - Border radius (xs, sm, md, lg, xl, full)
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} loading - Whether button is in loading state
 * @param {boolean} fullWidth - Whether button takes full width
 * @param {string} accessibilityLabel - Accessibility label
 * @param {string} accessibilityHint - Accessibility hint
 * @param {string} accessibilityRole - Accessibility role
 * @param {boolean} enableHaptics - Whether to enable haptic feedback
 * @param {object} style - Additional custom styles
 */
const Button = ({
  children,
  onPress,
  variant = 'filled',
  color = 'primary',
  size = 'md',
  rounded = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  enableHaptics = true,
  style,
  ...props
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Haptic feedback
    if (enableHaptics) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Graceful fallback if haptics not available
        console.log('Haptics not available:', error);
      }
    }
    
    onPress?.();
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'md';
    }
  };

  return (
    <StyledButton
      onPress={handlePress}
      variant={variant}
      color={color}
      size={size}
      rounded={rounded}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      style={style}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'filled' ? 'white' : color} 
        />
      ) : (
        <ButtonText
          variant={variant}
          color={color}
          size={getTextSize()}
        >
          {children}
        </ButtonText>
      )}
    </StyledButton>
  );
};

export default Button; 