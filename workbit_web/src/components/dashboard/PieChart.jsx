import { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ 
  data = [], 
  size = 200,
  colors = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#6B7280'],
  className = ""
}) => {
  const chartRef = useRef(null);
  
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

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map((item, index) => colors[index % colors.length]),
        borderWidth: 0,
        cutout: '70%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Doughnut
        ref={chartRef}
        data={chartData}
        options={options}
      />
      {/* Total en el centro */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
};

export default PieChart;