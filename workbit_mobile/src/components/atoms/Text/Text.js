import React from 'react';
import styled from 'styled-components/native';
import { Text as RNText } from 'react-native';

const StyledText = styled(RNText)`
  color: ${({ theme, color }) => 
    color ? theme.colors[color] || color : theme.colors.text};
  font-size: ${({ theme, size = 'md' }) => theme.typography.sizes[size]}px;
  font-weight: ${({ theme, weight = 'regular' }) => theme.typography.weights[weight]};
  font-family: ${({ theme }) => theme.typography.families.default};
  line-height: ${({ theme, size = 'md' }) => theme.typography.sizes[size] * 1.4}px;
  text-align: ${({ align = 'left' }) => align};
  ${({ marginBottom, theme }) => marginBottom && `margin-bottom: ${theme.spacing[marginBottom] || marginBottom}px;`}
  ${({ marginTop, theme }) => marginTop && `margin-top: ${theme.spacing[marginTop] || marginTop}px;`}
  ${({ marginHorizontal, theme }) => marginHorizontal && `margin-horizontal: ${theme.spacing[marginHorizontal] || marginHorizontal}px;`}
  ${({ marginVertical, theme }) => marginVertical && `margin-vertical: ${theme.spacing[marginVertical] || marginVertical}px;`}
`;

/**
 * Text component that follows design system and accessibility guidelines
 * @param {string} children - Text content
 * @param {string} size - Typography size from theme (xs, sm, md, lg, xl, xxl, xxxl)
 * @param {string} weight - Font weight from theme (light, regular, medium, semibold, bold)
 * @param {string} color - Text color from theme or custom color
 * @param {string} align - Text alignment (left, center, right, justify)
 * @param {string|number} marginBottom - Bottom margin using theme spacing or custom value
 * @param {string|number} marginTop - Top margin using theme spacing or custom value
 * @param {string|number} marginHorizontal - Horizontal margin using theme spacing or custom value
 * @param {string|number} marginVertical - Vertical margin using theme spacing or custom value
 * @param {boolean} numberOfLines - Limit number of lines
 * @param {string} ellipsizeMode - How to ellipsize text (head, middle, tail, clip)
 * @param {object} style - Additional custom styles
 * @param {function} onPress - Press handler for touchable text
 * @param {string} accessibilityLabel - Accessibility label for screen readers
 * @param {string} accessibilityHint - Accessibility hint for screen readers
 * @param {string} accessibilityRole - Accessibility role (text, button, link, etc.)
 */
const Text = ({
  children,
  size = 'md',
  weight = 'regular',
  color,
  align = 'left',
  marginBottom,
  marginTop,
  marginHorizontal,
  marginVertical,
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
  ...props
}) => {
  return (
    <StyledText
      size={size}
      weight={weight}
      color={color}
      align={align}
      marginBottom={marginBottom}
      marginTop={marginTop}
      marginHorizontal={marginHorizontal}
      marginVertical={marginVertical}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={style}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      allowFontScaling={true} // Respect user's font scaling preferences
      maxFontSizeMultiplier={1.5} // Prevent text from becoming too large
      {...props}
    >
      {children}
    </StyledText>
  );
};

export default Text; 