import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  text = null 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
    white: 'border-white'
  };

  if (text) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center space-y-3 ${className}`}
      >
        <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]}`} />
        <p className="text-sm text-gray-600">{text}</p>
      </motion.div>
    );
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]} ${className}`} />
  );
};

export default LoadingSpinner; 