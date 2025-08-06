import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GridLayout = ({ spaces = [], gridConfig = { rows: 5, cols: 8 }, onSpacePress, onEmptySpacePress }) => {
  // Calcular dimensiones de la grilla
  const gridWidth = screenWidth - 40; // 20px padding on each side
  const gridHeight = Math.min(gridWidth * (gridConfig.rows / gridConfig.cols), screenHeight * 0.6);
  const cellWidth = gridWidth / gridConfig.cols;
  const cellHeight = gridHeight / gridConfig.rows;

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
        return 'checkmark-circle';
      case 'occupied':
        return 'person';
      case 'reserved':
        return 'calendar';
      case 'maintenance':
        return 'construct';
      case 'unavailable':
        return 'close-circle';
      default:
        return 'help-circle';
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

  const handleSpacePress = (space) => {
    if (space && onSpacePress) {
      onSpacePress(space);
    } else if (!space && onEmptySpacePress) {
      onEmptySpacePress();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}>
        {gridMatrix.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((space, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    width: cellWidth,
                    height: cellHeight,
                    backgroundColor: space ? getStatusColor(space.status) : '#F5F5F5',
                  },
                ]}
                onPress={() => handleSpacePress(space)}
                activeOpacity={0.7}
              >
                {space ? (
                  <View style={styles.spaceContent}>
                    <Ionicons
                      name={getStatusIcon(space.status)}
                      size={Math.min(cellWidth, cellHeight) * 0.3}
                      color="white"
                    />
                    <Text style={styles.spaceName} numberOfLines={1}>
                      {space.name}
                    </Text>
                    <Text style={styles.spaceStatus}>
                      {getStatusText(space.status)}
                    </Text>
                    {space.capacity > 1 && (
                      <Text style={styles.spaceCapacity}>
                        {space.capacity} pers.
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyCell}>
                    <Text style={styles.emptyText}>-</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gridContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  spaceContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  spaceName: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  spaceStatus: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
  },
  spaceCapacity: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
    fontStyle: 'italic',
  },
  emptyCell: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: '#BDBDBD',
    fontSize: 12,
  },
});

export default GridLayout;