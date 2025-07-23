import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../constants/theme';
import Text from '../Text/Text';

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
  const { currentTheme } = useTheme();

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

  const getButtonStyles = () => {
    const styles = [baseStyles.button];
    
    // Size styles
    switch (size) {
      case 'sm':
        styles.push({
          paddingVertical: currentTheme.spacing.sm,
          paddingHorizontal: currentTheme.spacing.md,
        });
        break;
      case 'lg':
        styles.push({
          paddingVertical: currentTheme.spacing.lg,
          paddingHorizontal: currentTheme.spacing.xl,
        });
        break;
      default:
        styles.push({
          paddingVertical: currentTheme.spacing.md,
          paddingHorizontal: currentTheme.spacing.lg,
        });
    }

    // Border radius
    if (rounded === 'full') {
      styles.push({ borderRadius: currentTheme.borderRadius.full });
    } else {
      styles.push({ borderRadius: currentTheme.borderRadius[rounded] || currentTheme.borderRadius.md });
    }

    // Variant styles
    const themeColor = currentTheme.colors[color] || currentTheme.colors.primary;
    
    switch (variant) {
      case 'outline':
        styles.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: themeColor,
        });
        break;
      case 'ghost':
        styles.push({
          backgroundColor: 'transparent',
          borderWidth: 0,
        });
        break;
      default:
        styles.push({
          backgroundColor: themeColor,
          borderWidth: 0,
        });
    }

    // Full width
    if (fullWidth) {
      styles.push({ width: '100%' });
    }

    // Disabled state
    if (disabled || loading) {
      styles.push({ opacity: 0.6 });
    }

    return styles;
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return currentTheme.colors[color] || currentTheme.colors.primary;
    }
    return currentTheme.colors.textOnPrimary;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getButtonStyles(), style]}
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
        <Text
          color={getTextColor()}
          weight="medium"
          size={getTextSize()}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button; 