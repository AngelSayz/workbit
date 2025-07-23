import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const baseInputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
  
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';
  const iconPaddingLeft = icon && iconPosition === 'left' ? 'pl-10' : '';
  const iconPaddingRight = icon && iconPosition === 'right' || type === 'password' ? 'pr-10' : '';
  
  const inputClasses = `
    ${baseInputClasses}
    ${errorClasses}
    ${iconPaddingLeft}
    ${iconPaddingRight}
    ${className}
  `.trim();
  
  const IconComponent = ({ position }) => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <div className={`absolute top-1/2 transform -translate-y-1/2 ${position === 'left' ? 'left-3' : 'right-3'} text-gray-400`}>
        {icon}
      </div>
    );
  };
  
  const PasswordToggle = () => {
    if (type !== 'password') return null;
    
    return (
      <button
        type="button"
        className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    );
  };
  
  return (
    <motion.div 
      className={`space-y-1 ${containerClassName}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        <IconComponent position="left" />
        <IconComponent position="right" />
        <PasswordToggle />
        
        {isFocused && (
          <motion.div
            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </motion.div>
  );
});

Input.displayName = 'Input';

export default Input; 