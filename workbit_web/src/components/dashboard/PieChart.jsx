import { useEffect, useRef } from 'react';

const PieChart = ({ 
  data = [], 
  size = 80, 
  strokeWidth = 8,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  showLabels = false,
  className = ""
}) => {
  const svgRef = useRef(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500">Sin datos</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const x1 = size/2 + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
    const y1 = size/2 + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
    const x2 = size/2 + radius * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
    const y2 = size/2 + radius * Math.sin((currentAngle + angle - 90) * Math.PI / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      "M", size/2, size/2,
      "L", x1, y1,
      "A", radius, radius, 0, largeArcFlag, 1, x2, y2,
      "Z"
    ].join(" ");
    
    currentAngle += angle;
    
    return {
      ...item,
      pathData,
      color: colors[index % colors.length],
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        
        {/* Segments */}
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.pathData}
            fill={segment.color}
            className="transition-all duration-300 hover:brightness-110"
          />
        ))}
        
        {/* Center circle */}
        <circle
          cx={size/2}
          cy={size/2}
          r={radius - strokeWidth/2}
          fill="white"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
      
      {/* Labels (if enabled) */}
      {showLabels && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: segment.color }}
                ></div>
                <span className="text-gray-600 text-xs">{segment.label}: {segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart;