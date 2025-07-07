import React from 'react';
import { useTheme } from 'styled-components/native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Icon sets mapping
const ICON_SETS = {
  feather: FeatherIcon,
  material: MaterialIcon,
  materialCommunity: MaterialCommunityIcon,
};

/**
 * Icon component with theme integration and accessibility
 * @param {string} name - Icon name from the selected icon set
 * @param {string} set - Icon set to use (feather, material, materialCommunity)
 * @param {string|number} size - Icon size (theme size key or number)
 * @param {string} color - Icon color from theme or custom color
 * @param {object} style - Additional custom styles
 * @param {string} accessibilityLabel - Accessibility label for screen readers
 * @param {boolean} accessibilityHidden - Hide from screen readers
 */
const Icon = ({
  name,
  set = 'feather',
  size = 'md',
  color,
  style,
  accessibilityLabel,
  accessibilityHidden = false,
  ...props
}) => {
  const theme = useTheme();
  
  const IconComponent = ICON_SETS[set] || FeatherIcon;
  
  // Get size from theme or use direct value
  const iconSize = typeof size === 'string' && theme.typography.sizes[size] 
    ? theme.typography.sizes[size] 
    : size;
  
  // Get color from theme or use direct value
  const iconColor = color && theme.colors[color] 
    ? theme.colors[color] 
    : color || theme.colors.text;

  return (
    <IconComponent
      name={name}
      size={iconSize}
      color={iconColor}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityHidden}
      importantForAccessibility={accessibilityHidden ? 'no-hide-descendants' : 'auto'}
      {...props}
    />
  );
};

export default Icon; 