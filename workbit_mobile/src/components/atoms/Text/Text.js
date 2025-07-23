import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '../../../constants/theme';

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
  const { currentTheme } = useTheme();

  const getTextStyles = () => {
    const styles = [baseStyles.text];

    // Basic typography
    styles.push({
      color: color 
        ? (currentTheme.colors[color] || color) 
        : currentTheme.colors.text,
      fontSize: currentTheme.typography.sizes[size] || currentTheme.typography.sizes.md,
      fontWeight: currentTheme.typography.weights[weight] || currentTheme.typography.weights.regular,
      fontFamily: currentTheme.typography.families.default,
      lineHeight: (currentTheme.typography.sizes[size] || currentTheme.typography.sizes.md) * 1.4,
      textAlign: align,
    });

    // Margins
    const marginStyles = {};
    if (marginBottom) {
      marginStyles.marginBottom = currentTheme.spacing[marginBottom] || marginBottom;
    }
    if (marginTop) {
      marginStyles.marginTop = currentTheme.spacing[marginTop] || marginTop;
    }
    if (marginHorizontal) {
      marginStyles.marginHorizontal = currentTheme.spacing[marginHorizontal] || marginHorizontal;
    }
    if (marginVertical) {
      marginStyles.marginVertical = currentTheme.spacing[marginVertical] || marginVertical;
    }
    
    if (Object.keys(marginStyles).length > 0) {
      styles.push(marginStyles);
    }

    return styles;
  };

  return (
    <RNText
      style={[getTextStyles(), style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      allowFontScaling={true} // Respect user's font scaling preferences
      maxFontSizeMultiplier={1.5} // Prevent text from becoming too large
      {...props}
    >
      {children}
    </RNText>
  );
};

const baseStyles = StyleSheet.create({
  text: {
    // Base text styles that don't depend on theme
  },
});

export default Text; 