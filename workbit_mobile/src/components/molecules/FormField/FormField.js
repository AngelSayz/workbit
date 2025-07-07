import React from 'react';
import styled from 'styled-components/native';
import { Text, TextInput } from '../../atoms';

const Container = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const Label = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const ErrorText = styled(Text)`
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

/**
 * FormField molecule combining label, input and error message
 * @param {string} label - Field label
 * @param {string} value - Input value
 * @param {function} onChangeText - Text change handler
 * @param {string} placeholder - Input placeholder
 * @param {string} error - Error message to display
 * @param {boolean} required - Whether field is required (adds asterisk)
 * @param {string} keyboardType - Keyboard type for input
 * @param {boolean} secureTextEntry - Whether to hide input text
 * @param {string} autoCapitalize - Auto capitalization setting
 * @param {boolean} autoCorrect - Auto-correct setting
 * @param {string} returnKeyType - Return key type
 * @param {function} onSubmitEditing - Submit handler
 * @param {object} inputProps - Additional props for TextInput
 * @param {object} style - Additional container styles
 */
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType = 'done',
  onSubmitEditing,
  inputProps = {},
  style,
  ...props
}) => {
  const labelText = required ? `${label} *` : label;

  return (
    <Container style={style}>
      {label && (
        <Label
          size="sm"
          weight="medium"
          color="textSecondary"
          accessibilityLabel={labelText}
        >
          {labelText}
        </Label>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={!!error}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        {...inputProps}
        {...props}
      />
      {error && (
        <ErrorText
          size="sm"
          color="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </ErrorText>
      )}
    </Container>
  );
};

export default FormField; 