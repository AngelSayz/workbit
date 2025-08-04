import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Plus,
  Save,
  X
} from 'lucide-react';
import { spacesAPI } from '../api/apiService';
import { useAuth } from '../hooks/useAuth';

const CubiclesLayout = ({ onSpaceClick }) => {
  const [spaces, setSpaces] = useState([]);
  const [gridSettings, setGridSettings] = useState({ rows: 5, cols: 8 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpaceData, setNewSpaceData] = useState({
    name: '',
    capacity: 2,
    status: 'available',
    position_x: 0,
    position_y: 0
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  


  useEffect(() => {
    fetchSpacesData();
  }, []);

  const fetchSpacesData = async () => {
    try {
      setLoading(true);
      const response = await spacesAPI.getGridSpaces();
      if (response.success) {
        setSpaces(response.data.spaces || []);
        setGridSettings(response.data.grid || { rows: 5, cols: 8 });
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError('Error al cargar los espacios');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'occupied':
        return '#ef4444';
      case 'reserved':
        return '#f59e0b';
      case 'maintenance':
        return '#6366f1';
      case 'unavailable':
        return '#6b7280';
      default:
        return '#e5e7eb';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'occupied':
        return <Users className="w-4 h-4" />;
      case 'reserved':
        return <Clock className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'unavailable':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

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

  const handleSpaceClick = (space) => {
    if (onSpaceClick) {
      onSpaceClick(space);
    } else {
      setSelectedSpace(space);
    }
  };

  const closeModal = () => {
    setSelectedSpace(null);
  };



  const handleCreateSpace = async () => {
    try {
      const response = await spacesAPI.createSpace(newSpaceData);
      if (response.success) {
        // Recargar los datos
        await fetchSpacesData();
        setIsAddingSpace(false);
        setNewSpaceData({
          name: '',
          capacity: 2,
          status: 'available',
          position_x: 0,
          position_y: 0
        });
      }
    } catch (err) {
      console.error('Error creating space:', err);
      alert('Error al crear el espacio');
    }
  };

  const cancelAddSpace = () => {
    setIsAddingSpace(false);
    setNewSpaceData({
      name: '',
      capacity: 2,
      status: 'available',
      position_x: 0,
      position_y: 0
    });
  };

  const handleAddSpaceClick = async (x, y) => {
    // Verificar si necesitamos expandir el grid
    const needsExpansion = x >= gridSettings.cols || y >= gridSettings.rows;
    
    if (needsExpansion) {
      // Calcular nuevas dimensiones
      const newRows = Math.max(gridSettings.rows, y + 1);
      const newCols = Math.max(gridSettings.cols, x + 1);
      
      try {
        // Expandir el grid automáticamente
        const response = await spacesAPI.updateGridSettings({
          rows: newRows,
          cols: newCols
        });
        
        if (response.success) {
          // Recargar los datos para obtener el grid actualizado
          await fetchSpacesData();
        }
      } catch (err) {
        console.error('Error expanding grid:', err);
        alert('Error al expandir el grid automáticamente');
        return;
      }
    }
    
    // Continuar con la creación del espacio
    setNewSpaceData({
      name: '',
      capacity: 2,
      status: 'available',
      position_x: x,
      position_y: y
    });
    setIsAddingSpace(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchSpacesData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Calcular dimensiones dinámicas basadas en las posiciones de cubículos y espacios vacíos
  const calculateDynamicDimensions = () => {
    let maxX = 0;
    let maxY = 0;
    
    // Verificar posiciones de cubículos existentes
    spaces.forEach(space => {
      maxX = Math.max(maxX, space.position_x);
      maxY = Math.max(maxY, space.position_y);
    });
    
    // Verificar posiciones adyacentes (espacios vacíos)
    const adjacentPositions = new Set();
    spaces.forEach(space => {
      const { position_x, position_y } = space;
      const adjacent = [
        [position_x - 1, position_y],
        [position_x + 1, position_y],
        [position_x, position_y - 1],
        [position_x, position_y + 1],
        [position_x - 1, position_y - 1],
        [position_x + 1, position_y - 1],
        [position_x - 1, position_y + 1],
        [position_x + 1, position_y + 1]
      ];
      adjacent.forEach(([x, y]) => {
        if (x >= 0 && y >= 0) {
          adjacentPositions.add(`${x},${y}`);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      });
    });
    
    // Agregar también las posiciones dentro del grid actual
    for (let row = 0; row < gridSettings.rows; row++) {
      for (let col = 0; col < gridSettings.cols; col++) {
        maxX = Math.max(maxX, col);
        maxY = Math.max(maxY, row);
      }
    }
    
    return { maxX, maxY };
  };
  
  const { maxX, maxY } = calculateDynamicDimensions();
  const svgWidth = Math.max(1400, (maxX + 1) * 280);
  const svgHeight = Math.max(1000, (maxY + 1) * 320);
  const cellWidth = 200;
  const cellHeight = 200;
  const margin = 40;

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-gray-600">({spaces.length} cubículos)</p>
      </div>

      <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Leyenda de Estados</h3>
        <div className="flex flex-wrap gap-4">
          {['available', 'occupied', 'reserved', 'maintenance', 'unavailable'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor(status) }}></div>
              <span className="text-sm text-gray-600">{getStatusText(status)}</span>
            </div>
          ))}
        </div>
      </div>

             <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-auto" style={{ minHeight: '600px' }}>
         <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={svgWidth} height={svgHeight} className="mx-auto block">
          <defs>
            <pattern id="grid" width={cellWidth + margin} height={cellHeight + margin} patternUnits="userSpaceOnUse">
              <rect width={cellWidth + margin} height={cellHeight + margin} fill="none" stroke="#e5e7eb" strokeWidth="1" />
            </pattern>
          </defs>

                     <rect width="100%" height="100%" fill="url(#grid)" />

           {/* Renderizar espacios existentes */}
           {spaces.map((space) => {
            const x = space.position_x * (cellWidth + margin) + margin / 2;
                         const y = space.position_y * (cellHeight + margin) + margin / 2 + 80;

            return (
              <g key={space.id} transform={`translate(${x}, ${y})`}>
                                 <motion.rect
                   width={cellWidth}
                   height={cellHeight}
                   fill="#f8fafc"
                   stroke={getStatusColor(space.status)}
                   strokeWidth="4"
                   rx="12"
                   whileHover={{ scale: 1.05 }}
                   onClick={() => handleSpaceClick(space)}
                   className="cursor-pointer"
                   style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                 />

                <ellipse
                  cx={cellWidth / 2}
                  cy={cellHeight / 2}
                  rx="35"
                  ry="20"
                  fill="#cbd5e1"
                  stroke="#64748b"
                  strokeWidth="2"
                />

                                 {Array.from({ length: Math.min(space.capacity, 8) }, (_, i) => {
                   const angle = (2 * Math.PI / Math.min(space.capacity, 8)) * i;
                   const radius = 60;
                   const chairX = cellWidth / 2 + radius * Math.cos(angle);
                   const chairY = cellHeight / 2 + radius * Math.sin(angle);
                   // Calcular el ángulo en grados y agregar 90 para orientar hacia el centro
                   const angleDeg = angle * (180 / Math.PI);
                   const rotate = angleDeg + 90;

                   return (
                     <g key={i} transform={`translate(${chairX - 10}, ${chairY - 10}) rotate(${rotate}, 10, 10)`}>
                       <svg width="20" height="20" viewBox="0 0 32 32" fill="#607d8b">
                         <path d="M26 11V5H6v6H2v14h4v2h2v-2h16v2h2v-2h4V11H26zM6 23H4V13h2V23zM24 23H8v-4h16V23zM24 17H8V7h16V17zM28 23h-2V13h2V23z"></path>
                       </svg>
                     </g>
                   );
                 })}

                <text x={cellWidth / 2} y="-25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1f2937">
                  {space.name}
                </text>

                <g transform={`translate(${cellWidth - 35}, 20)`}>
                  <g transform="translate(-8, -8)" fill={getStatusColor(space.status)}>
                    {getStatusIcon(space.status)}
                  </g>
                </g>

                
              </g>
                         );
           })}

                      {/* Renderizar espacios vacíos clickeables dinámicamente (solo para administradores) */}
           {isAdmin && (() => {
             // Calcular todas las posiciones adyacentes a cubículos existentes
             const adjacentPositions = new Set();
             
             spaces.forEach(space => {
               const { position_x, position_y } = space;
               
               // Agregar posiciones adyacentes (arriba, abajo, izquierda, derecha, diagonales)
               const adjacent = [
                 [position_x - 1, position_y],     // Izquierda
                 [position_x + 1, position_y],     // Derecha
                 [position_x, position_y - 1],     // Arriba
                 [position_x, position_y + 1],     // Abajo
                 [position_x - 1, position_y - 1], // Diagonal superior izquierda
                 [position_x + 1, position_y - 1], // Diagonal superior derecha
                 [position_x - 1, position_y + 1], // Diagonal inferior izquierda
                 [position_x + 1, position_y + 1]  // Diagonal inferior derecha
               ];
               
               adjacent.forEach(([x, y]) => {
                 if (x >= 0 && y >= 0) { // Solo posiciones válidas
                   adjacentPositions.add(`${x},${y}`);
                 }
               });
             });
             
             // Agregar también las posiciones dentro del grid actual que estén vacías
             for (let row = 0; row < gridSettings.rows; row++) {
               for (let col = 0; col < gridSettings.cols; col++) {
                 const existingSpace = spaces.find(space => 
                   space.position_x === col && space.position_y === row
                 );
                 if (!existingSpace) {
                   adjacentPositions.add(`${col},${row}`);
                 }
               }
             }
             
             // Renderizar espacios vacíos en todas las posiciones adyacentes
             return Array.from(adjacentPositions).map(posKey => {
               const [col, row] = posKey.split(',').map(Number);
               const x = col * (cellWidth + margin) + margin / 2;
               const y = row * (cellHeight + margin) + margin / 2 + 80;
               
               // Verificar que no haya un espacio existente en esta posición
               const existingSpace = spaces.find(space => 
                 space.position_x === col && space.position_y === row
               );
               
               if (!existingSpace) {
                 return (
                   <g key={`empty-${row}-${col}`} transform={`translate(${x}, ${y})`}>
                     <motion.rect
                       width={cellWidth}
                       height={cellHeight}
                       fill="#f8fafc"
                       stroke="#d1d5db"
                       strokeWidth="2"
                       strokeDasharray="5,5"
                       rx="12"
                       whileHover={{ scale: 1.05 }}
                       onClick={() => handleAddSpaceClick(col, row)}
                       className="cursor-pointer"
                       style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                     />
                     <text x={cellWidth / 2} y={cellHeight / 2} textAnchor="middle" fontSize="14" fill="#9ca3af">
                       <tspan x={cellWidth / 2} dy="-10">+ Agregar</tspan>
                       <tspan x={cellWidth / 2} dy="20">Espacio</tspan>
                     </text>
                   </g>
                 );
               }
               return null;
             });
           })()}
                  </svg>
       </div>

       {/* Space Details Modal */}
       {selectedSpace && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
           >
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-gray-900">
                 {selectedSpace.name}
               </h3>
               <button
                 onClick={closeModal}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XCircle className="w-6 h-6" />
               </button>
             </div>

             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div 
                   className="w-4 h-4 rounded"
                   style={{ backgroundColor: getStatusColor(selectedSpace.status) }}
                 ></div>
                 <span className="font-medium">{getStatusText(selectedSpace.status)}</span>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm text-gray-600">Capacidad</label>
                   <p className="font-medium">{selectedSpace.capacity} personas</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-600">Posición</label>
                   <p className="font-medium">({selectedSpace.position_x}, {selectedSpace.position_y})</p>
                 </div>
               </div>

               <div className="pt-4 border-t">
                 <button
                   onClick={closeModal}
                   className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Cerrar
                 </button>
               </div>
             </div>
           </motion.div>
         </div>
               )}

        {/* Add Space Modal */}
        {isAddingSpace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Agregar Nuevo Espacio
                </h3>
                <button
                  onClick={cancelAddSpace}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Espacio
                  </label>
                  <input
                    type="text"
                    value={newSpaceData.name}
                    onChange={(e) => setNewSpaceData({...newSpaceData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Cubículo D"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad
                  </label>
                  <select
                    value={newSpaceData.capacity}
                    onChange={(e) => setNewSpaceData({...newSpaceData, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} persona{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={newSpaceData.status}
                    onChange={(e) => setNewSpaceData({...newSpaceData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Disponible</option>
                    <option value="unavailable">No disponible</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Posición seleccionada:</strong> ({newSpaceData.position_x}, {newSpaceData.position_y})
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={cancelAddSpace}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSpace}
                    disabled={!newSpaceData.name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Crear Espacio
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
                 )}
       </div>
     );
   };

export default CubiclesLayout;