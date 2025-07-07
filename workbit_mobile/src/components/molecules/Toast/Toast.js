import React from 'react';
import styled from 'styled-components/native';
import { Text, Icon } from '../../atoms';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, type }) => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.surface;
    }
  }};
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  margin: ${({ theme }) => theme.spacing.md}px;
  ${({ theme }) => `
    shadow-color: ${theme.shadows.medium.shadowColor};
    shadow-offset: ${theme.shadows.medium.shadowOffset.width}px ${theme.shadows.medium.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.medium.shadowOpacity};
    shadow-radius: ${theme.shadows.medium.shadowRadius}px;
    elevation: ${theme.shadows.medium.elevation};
  `}
`;

const IconContainer = styled.View`
  margin-right: ${({ theme }) => theme.spacing.md}px;
`;

const Content = styled.View`
  flex: 1;
`;

/**
 * Toast molecule for showing feedback messages
 * @param {string} message - Main message text
 * @param {string} description - Optional description text
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {string} icon - Custom icon name (auto-selected based on type if not provided)
 * @param {object} style - Additional styles
 */
const Toast = ({
  message,
  description,
  type = 'info',
  icon,
  style,
  ...props
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getTextColor = () => {
    // All toast types use white text for better contrast
    return 'textOnPrimary';
  };

  return (
    <Container 
      type={type} 
      style={style}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...props}
    >
      <IconContainer>
        <Icon
          name={getIcon()}
          size={20}
          color={getTextColor()}
          accessibilityHidden={true}
        />
      </IconContainer>
      <Content>
        <Text
          size="md"
          weight="medium"
          color={getTextColor()}
          numberOfLines={2}
        >
          {message}
        </Text>
        {description && (
          <Text
            size="sm"
            color={getTextColor()}
            numberOfLines={3}
            marginTop="xs"
          >
            {description}
          </Text>
        )}
      </Content>
    </Container>
  );
};

export default Toast; 