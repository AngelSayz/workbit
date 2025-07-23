/**
 * Style utilities to help with dynamic styling based on theme
 * This replaces the need for styled-components template literals
 */

/**
 * Creates dynamic padding styles based on theme spacing
 * @param {object} theme - Theme object
 * @param {string|number} vertical - Vertical padding (theme key or number)
 * @param {string|number} horizontal - Horizontal padding (theme key or number)
 * @returns {object} Style object
 */
export const createPadding = (theme, vertical, horizontal) => ({
  paddingVertical: theme.spacing[vertical] || vertical,
  paddingHorizontal: theme.spacing[horizontal] || horizontal,
});

/**
 * Creates dynamic margin styles based on theme spacing
 * @param {object} theme - Theme object
 * @param {object} margins - Margin configuration
 * @returns {object} Style object
 */
export const createMargins = (theme, margins = {}) => {
  const styles = {};
  
  if (margins.top !== undefined) {
    styles.marginTop = theme.spacing[margins.top] || margins.top;
  }
  if (margins.bottom !== undefined) {
    styles.marginBottom = theme.spacing[margins.bottom] || margins.bottom;
  }
  if (margins.left !== undefined) {
    styles.marginLeft = theme.spacing[margins.left] || margins.left;
  }
  if (margins.right !== undefined) {
    styles.marginRight = theme.spacing[margins.right] || margins.right;
  }
  if (margins.horizontal !== undefined) {
    styles.marginHorizontal = theme.spacing[margins.horizontal] || margins.horizontal;
  }
  if (margins.vertical !== undefined) {
    styles.marginVertical = theme.spacing[margins.vertical] || margins.vertical;
  }
  
  return styles;
};

/**
 * Creates border radius styles based on theme
 * @param {object} theme - Theme object
 * @param {string|number} radius - Border radius (theme key or number)
 * @returns {object} Style object
 */
export const createBorderRadius = (theme, radius) => ({
  borderRadius: radius === 'full' ? theme.borderRadius.full : (theme.borderRadius[radius] || radius),
});

/**
 * Creates shadow styles based on theme
 * @param {object} theme - Theme object
 * @param {string} size - Shadow size (small, medium, large)
 * @returns {object} Style object
 */
export const createShadow = (theme, size = 'medium') => theme.shadows[size] || {};

/**
 * Creates typography styles based on theme
 * @param {object} theme - Theme object
 * @param {string} size - Font size key
 * @param {string} weight - Font weight key
 * @param {string|object} color - Color key or custom color
 * @returns {object} Style object
 */
export const createTypography = (theme, size = 'md', weight = 'regular', color) => ({
  fontSize: theme.typography.sizes[size] || theme.typography.sizes.md,
  fontWeight: theme.typography.weights[weight] || theme.typography.weights.regular,
  fontFamily: theme.typography.families.default,
  lineHeight: (theme.typography.sizes[size] || theme.typography.sizes.md) * 1.4,
  color: color ? (theme.colors[color] || color) : theme.colors.text,
});

/**
 * Creates button variant styles
 * @param {object} theme - Theme object
 * @param {string} variant - Button variant
 * @param {string} color - Color key
 * @returns {object} Style object
 */
export const createButtonVariant = (theme, variant = 'filled', color = 'primary') => {
  const themeColor = theme.colors[color] || theme.colors.primary;
  
  switch (variant) {
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: themeColor,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    default:
      return {
        backgroundColor: themeColor,
        borderWidth: 0,
      };
  }
};

/**
 * Combines multiple style objects or arrays
 * @param {...(object|array)} styles - Style objects or arrays
 * @returns {array} Combined styles array
 */
export const combineStyles = (...styles) => {
  return styles.flat().filter(Boolean);
}; 