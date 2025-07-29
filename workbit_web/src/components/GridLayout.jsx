import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  User, 
  Calendar, 
  Wrench, 
  XCircle,
  Plus,
  Settings,
  Trash2
} from 'lucide-react';

const GridLayout = ({ 
  spaces = [], 
  gridConfig = { rows: 5, cols: 8 }, 
  onSpaceClick,
  onAddSpace,
  onEditSpace,
  onDeleteSpace,
  isAdmin = false,
  isAddingMode = false
}) => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState(null);

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CAF50'; // Verde
      case 'occupied':
        return '#F44336'; // Rojo
      case 'reserved':
        return '#FFC107'; // Amarillo
      case 'maintenance':
        return '#9E9E9E'; // Gris
      case 'unavailable':
        return '#212121'; // Negro
      default:
        return '#E0E0E0'; // Gris claro
    }
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return CheckCircle;
      case 'occupied':
        return User;
      case 'reserved':
        return Calendar;
      case 'maintenance':
        return Wrench;
      case 'unavailable':
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupado';
      case 'reserved':
        return 'Reservado';
      case 'maintenance':
        return 'Mantenimiento';
      case 'unavailable':
        return 'No disponible';
      default:
        return 'Desconocido';
    }
  };

  // Crear matriz de espacios
  const createGridMatrix = () => {
    const matrix = [];
    for (let row = 0; row < gridConfig.rows; row++) {
      const rowArray = [];
      for (let col = 0; col < gridConfig.cols; col++) {
        const space = spaces.find(s => s.position_x === col && s.position_y === row);
        rowArray.push(space || null);
      }
      matrix.push(rowArray);
    }
    return matrix;
  };

  const gridMatrix = createGridMatrix();

  const handleCellClick = (space, row, col) => {
    if (isAddingMode && !space) {
      // Modo agregar: crear nuevo espacio en posición vacía
      onAddSpace && onAddSpace({ position_x: col, position_y: row });
    } else if (space) {
      // Espacio existente: mostrar detalles o editar
      setSelectedSpace(space);
      onSpaceClick && onSpaceClick(space);
    }
  };

  const handleCellHover = (row, col) => {
    if (isAddingMode) {
      setHoveredPosition({ row, col });
    }
  };

  const handleCellLeave = () => {
    setHoveredPosition(null);
  };

  const getCellStyle = (space, row, col) => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      minHeight: '80px',
    };

    if (space) {
      return {
        ...baseStyle,
        backgroundColor: getStatusColor(space.status),
        color: 'white',
      };
    } else if (isAddingMode && hoveredPosition?.row === row && hoveredPosition?.col === col) {
      return {
        ...baseStyle,
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        borderWidth: '2px',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#f9fafb',
        color: '#6b7280',
      };
    }
  };

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div 
        className="grid gap-1 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        style={{
          gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
          gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
          minHeight: `${gridConfig.rows * 100}px`,
        }}
      >
        {gridMatrix.map((row, rowIndex) => (
          row.map((space, colIndex) => {
            const StatusIcon = space ? getStatusIcon(space.status) : Plus;
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className="relative group"
                style={getCellStyle(space, rowIndex, colIndex)}
                onClick={() => handleCellClick(space, rowIndex, colIndex)}
                onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                onMouseLeave={handleCellLeave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {space ? (
                  <>
                    <StatusIcon className="w-6 h-6 mb-1" />
                    <div className="text-center">
                      <div className="text-sm font-semibold truncate max-w-full">
                        {space.name}
                      </div>
                      <div className="text-xs opacity-90">
                        {getStatusText(space.status)}
                      </div>
                      {space.capacity > 1 && (
                        <div className="text-xs opacity-75">
                          {space.capacity} pers.
                        </div>
                      )}
                    </div>
                    
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSpace && onEditSpace(space);
                            }}
                            className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                            title="Editar espacio"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSpace && onDeleteSpace(space);
                            }}
                            className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                            title="Eliminar espacio"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {isAddingMode ? (
                      <>
                        <Plus className="w-6 h-6 mb-1" />
                        <div className="text-xs text-center">
                          Agregar espacio
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-gray-400">-</div>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            );
          })
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Leyenda de Estados</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { status: 'available', text: 'Disponible', color: '#4CAF50' },
            { status: 'occupied', text: 'Ocupado', color: '#F44336' },
            { status: 'reserved', text: 'Reservado', color: '#FFC107' },
            { status: 'maintenance', text: 'Mantenimiento', color: '#9E9E9E' },
            { status: 'unavailable', text: 'No disponible', color: '#212121' },
          ].map((item) => {
            const Icon = getStatusIcon(item.status);
            return (
              <div key={item.status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span className="text-xs text-gray-600">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GridLayout;