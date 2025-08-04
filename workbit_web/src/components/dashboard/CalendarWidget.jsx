import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarWidget = ({ 
  calendarData = [], 
  onDateClick = () => {},
  currentMonth = new Date().getMonth(),
  currentYear = new Date().getFullYear() 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(currentMonth);
  const [displayYear, setDisplayYear] = useState(currentYear);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate month
  const navigateMonth = (direction) => {
    let newMonth = displayMonth + direction;
    let newYear = displayYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
  };

  // Get calendar data for specific day
  const getDayData = (day) => {
    return calendarData.find(data => data.date === day) || { reservations: 0, spaces_used: 0 };
  };

  // Get intensity color based on activity - más diferenciación
  const getIntensityColor = (reservations) => {
    if (reservations === 0) return 'bg-gray-50';
    if (reservations === 1) return 'bg-green-100';
    if (reservations <= 3) return 'bg-blue-200';
    if (reservations <= 6) return 'bg-orange-300';
    if (reservations <= 10) return 'bg-red-400';
    return 'bg-purple-500';
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayMonth, displayYear);
    const firstDay = getFirstDayOfMonth(displayMonth, displayYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 md:h-12"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = getDayData(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === displayMonth && 
                     new Date().getFullYear() === displayYear;
      const isSelected = selectedDate.getDate() === day &&
                        selectedDate.getMonth() === displayMonth &&
                        selectedDate.getFullYear() === displayYear;

      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const clickedDate = new Date(displayYear, displayMonth, day);
            setSelectedDate(clickedDate);
            onDateClick(clickedDate, dayData);
          }}
          className={`
            h-10 md:h-12 rounded-lg cursor-pointer transition-all duration-200 relative
            ${getIntensityColor(dayData.reservations)}
            ${isToday ? 'ring-2 ring-blue-500' : ''}
            ${isSelected ? 'ring-2 ring-blue-400' : ''}
            hover:shadow-md flex items-center justify-center
          `}
        >
          <span className={`text-sm font-medium ${
            dayData.reservations > 0 ? 'text-blue-900' : 'text-gray-700'
          }`}>
            {day}
          </span>
          
          {/* Activity indicator */}
          {dayData.reservations > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{dayData.reservations}</span>
            </div>
          )}
        </motion.div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Calendario de Reservas</h2>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-medium text-gray-900">
          {monthNames[displayMonth]} {displayYear}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-xs font-medium text-gray-500 py-2">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>1</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>2-3</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-300 rounded"></div>
              <span>4-6</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span>7-10</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>11+</span>
            </div>
          </div>
          <div className="text-gray-500">
            {calendarData.reduce((sum, day) => sum + day.reservations, 0)} reservas este mes
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;