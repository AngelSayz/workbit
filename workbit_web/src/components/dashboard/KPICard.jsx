import { motion } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subItems = null,
  dropdown = null,
  trend = null,
  chart = null,
  onClick = null
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(dropdown?.options?.[0]?.value || '24h');

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      accent: 'bg-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600', 
      border: 'border-green-200',
      accent: 'bg-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200', 
      accent: 'bg-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      accent: 'bg-orange-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      accent: 'bg-red-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const handleDropdownChange = (newValue) => {
    setSelectedPeriod(newValue);
    setShowDropdown(false);
    if (dropdown?.onChange) {
      dropdown.onChange(newValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl shadow-sm border ${colors.border} p-6 relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } transition-all duration-200`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {trend && (
              <div className="flex items-center mt-1">
                {trend.direction === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.value}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Dropdown */}
        {dropdown && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>{dropdown.options.find(opt => opt.value === selectedPeriod)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {dropdown.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownChange(option.value);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedPeriod === option.value ? 'bg-gray-50 text-blue-600' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Value */}
      {value && (
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
        </div>
      )}

      {/* Sub Items / Chart */}
      {subItems && (
        <div className="space-y-2">
          {subItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-2 h-2 rounded-full`}
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Chart */}
      {chart && (
        <div className="mt-4 flex flex-col items-center">
          {chart}
        </div>
      )}

      {/* Decorative accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${colors.accent} opacity-5 rounded-full -translate-y-10 translate-x-10`}></div>
    </motion.div>
  );
};

export default KPICard;