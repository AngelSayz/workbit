import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PieChart = ({ 
  data = [], 
  size = 200,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
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

  const chartOptions = {
    chart: {
      type: 'pie',
      height: size,
      width: size,
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, sans-serif'
      }
    },
    title: {
      text: null
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        cursor: 'default',
        dataLabels: {
          enabled: false
        },
        showInLegend: false,
        size: '85%',
        center: ['50%', '50%']
      }
    },
    series: [{
      name: 'Cubículos',
      colorByPoint: true,
      data: data.map((item, index) => ({
        name: item.label,
        y: item.value,
        color: colors[index % colors.length]
      }))
    }],
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    }
  };

  return (
    <div className={`relative ${className}`}>
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
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