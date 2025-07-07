import React, { useState, forwardRef } from 'react';
import { TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';

const StyledTextInput = styled(RNTextInput)`
  padding: ${({ theme }) => `${theme.spacing.md}px ${theme.spacing.lg}px`};
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  border-width: 1px;
  border-color: ${({ theme, error, focused }) => {
    if (error) return theme.colors.error;
    if (focused) return theme.colors.primary;
    return theme.colors.border;
  }};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-family: ${({ theme }) => theme.typography.families.default};
  min-height: 48px; /* Accessibility: minimum touch target size */
  ${({ multiline, theme }) => multiline && `
    min-height: ${theme.spacing.xxxl * 3}px;
    text-align-vertical: top;
  `}
`;

/**
 * TextInput component with validation and accessibility features
 * @param {string} value - Input value
 * @param {function} onChangeText - Text change handler
 * @param {string} placeholder - Placeholder text
 * @param {boolean} error - Whether input has validation error
 * @param {boolean} disabled - Whether input is disabled
 * @param {boolean} multiline - Whether input allows multiple lines
 * @param {number} numberOfLines - Number of lines for multiline input
 * @param {string} keyboardType - Keyboard type (default, email-address, numeric, etc.)
 * @param {string} autoCapitalize - Auto capitalization (none, sentences, words, characters)
 * @param {boolean} autoCorrect - Whether to enable auto-correct
 * @param {boolean} secureTextEntry - Whether to hide text (for passwords)
 * @param {string} returnKeyType - Return key type (done, next, search, etc.)
 * @param {function} onSubmitEditing - Submit handler
 * @param {function} onFocus - Focus handler
 * @param {function} onBlur - Blur handler
 * @param {string} accessibilityLabel - Accessibility label
 * @param {string} accessibilityHint - Accessibility hint
 * @param {object} style - Additional custom styles
 */
const TextInput = forwardRef(({
  value,
  onChangeText,
  placeholder,
  error = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const handleFocus = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <StyledTextInput
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      error={error}
      focused={focused}
      editable={!disabled}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : 1}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      secureTextEntry={secureTextEntry}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="text"
      allowFontScaling={true}
      maxFontSizeMultiplier={1.5}
      {...props}
    />
  );
});

TextInput.displayName = 'TextInput';

export default TextInput; 