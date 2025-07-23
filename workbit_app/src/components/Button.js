import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  ...props
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Graceful fallback if haptics not available
    }
    
    onPress?.();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Size styles
    if (size === 'sm') {
      baseStyle.push(styles.buttonSm);
    } else if (size === 'lg') {
      baseStyle.push(styles.buttonLg);
    } else {
      baseStyle.push(styles.buttonMd);
    }
    
    // Variant styles
    if (variant === 'secondary') {
      baseStyle.push(styles.buttonSecondary);
    } else if (variant === 'outline') {
      baseStyle.push(styles.buttonOutline);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.buttonGhost);
    } else {
      baseStyle.push(styles.buttonPrimary);
    }
    
    // Disabled state
    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    // Size styles
    if (size === 'sm') {
      baseStyle.push(styles.textSm);
    } else if (size === 'lg') {
      baseStyle.push(styles.textLg);
    } else {
      baseStyle.push(styles.textMd);
    }
    
    // Variant styles
    if (variant === 'secondary') {
      baseStyle.push(styles.textSecondary);
    } else if (variant === 'outline' || variant === 'ghost') {
      baseStyle.push(styles.textPrimary);
    } else {
      baseStyle.push(styles.textWhite);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : '#3b82f6'} 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMd: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '500',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  textWhite: {
    color: 'white',
  },
  textPrimary: {
    color: '#3b82f6',
  },
  textSecondary: {
    color: '#475569',
  },
});

export default Button; 