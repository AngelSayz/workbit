import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const EnvironmentalWidget = ({ environmentalData, loading, error }) => {
  const [chartData, setChartData] = useState({
    temperature: [],
    humidity: [],
    co2: [],
    timestamps: []
  });

  useEffect(() => {
    if (environmentalData?.sensors) {
      // Simular datos históricos para las gráficas
      generateChartData(environmentalData.sensors);
    }
  }, [environmentalData]);

  const generateChartData = (sensors) => {
    // Generar 12 puntos de datos (últimas 2 horas, cada 10 minutos)
    const points = 12;
    const now = new Date();
    const timestamps = [];
    const tempData = [];
    const humidityData = [];
    const co2Data = [];

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 10 * 60 * 1000);
      timestamps.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      // Simular variaciones basadas en los valores actuales
      const tempBase = sensors.temperature?.value || 22;
      const humidityBase = sensors.humidity?.value || 50;
      const co2Base = sensors.co2?.value || 500;
      
      tempData.push(tempBase + (Math.random() - 0.5) * 4);
      humidityData.push(Math.max(0, Math.min(100, humidityBase + (Math.random() - 0.5) * 20)));
      co2Data.push(Math.max(300, co2Base + (Math.random() - 0.5) * 200));
    }

    setChartData({
      temperature: tempData,
      humidity: humidityData,
      co2: co2Data,
      timestamps
    });
  };

  const getSensorStatus = (sensorType, value) => {
    if (!value) return { status: 'unknown', color: '#9CA3AF' };

    switch (sensorType) {
      case 'temperature':
        if (value < 18) return { status: 'cold', color: '#3B82F6' };
        if (value > 26) return { status: 'hot', color: '#EF4444' };
        return { status: 'good', color: '#10B981' };
      
      case 'humidity':
        if (value < 30) return { status: 'low', color: '#F59E0B' };
        if (value > 70) return { status: 'high', color: '#EF4444' };
        return { status: 'good', color: '#10B981' };
      
      case 'co2':
        if (value > 1000) return { status: 'high', color: '#EF4444' };
        if (value > 800) return { status: 'warning', color: '#F59E0B' };
        return { status: 'good', color: '#10B981' };
      
      default:
        return { status: 'unknown', color: '#9CA3AF' };
    }
  };

  const getSensorIcon = (sensorType) => {
    switch (sensorType) {
      case 'temperature': return 'thermometer-outline';
      case 'humidity': return 'water-outline';
      case 'co2': return 'leaf-outline';
      default: return 'analytics-outline';
    }
  };

  const getSensorName = (sensorType) => {
    switch (sensorType) {
      case 'temperature': return 'Temperatura';
      case 'humidity': return 'Humedad';
      case 'co2': return 'CO₂';
      default: return sensorType;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'good': return 'Óptimo';
      case 'warning': return 'Alerta';
      case 'high': return 'Alto';
      case 'low': return 'Bajo';
      case 'hot': return 'Caliente';
      case 'cold': return 'Frío';
      default: return 'Sin datos';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Obteniendo datos ambientales...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error al cargar datos ambientales</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  if (!environmentalData?.sensors) {
    return (
      <View style={styles.noDataContainer}>
        <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
        <Text style={styles.noDataText}>Sin datos de sensores</Text>
        <Text style={styles.noDataSubtext}>Los sensores no están enviando datos</Text>
      </View>
    );
  }

  const sensors = environmentalData.sensors;
  const sensorTypes = ['temperature', 'humidity', 'co2'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Condiciones Ambientales</Text>
      </View>
      
      <Text style={styles.subtitle}>
        {environmentalData.space_name} • Actualizado hace {getTimeAgo(environmentalData.last_updated)}
      </Text>

      {/* Sensor Cards */}
      <View style={styles.sensorsGrid}>
        {sensorTypes.map(sensorType => {
          const sensor = sensors[sensorType];
          const status = getSensorStatus(sensorType, sensor?.value);
          
          return (
            <View key={sensorType} style={[styles.sensorCard, { borderLeftColor: status.color }]}>
              <View style={styles.sensorHeader}>
                <View style={[styles.sensorIcon, { backgroundColor: status.color + '20' }]}>
                  <Ionicons name={getSensorIcon(sensorType)} size={20} color={status.color} />
                </View>
                <View style={styles.sensorInfo}>
                  <Text style={styles.sensorName}>{getSensorName(sensorType)}</Text>
                  <Text style={[styles.sensorStatus, { color: status.color }]}>
                    {getStatusText(status.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sensorValue}>
                <Text style={styles.valueText}>
                  {sensor?.value ? sensor.value.toFixed(1) : '--'}
                </Text>
                <Text style={styles.unitText}>{sensor?.unit || ''}</Text>
              </View>
              
              {sensor?.timestamp && (
                <Text style={styles.timestampText}>
                  {new Date(sensor.timestamp).toLocaleTimeString()}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <Text style={styles.chartsTitle}>Tendencias (Últimas 2 horas)</Text>
        
        {sensorTypes.map(sensorType => {
          const sensor = sensors[sensorType];
          if (!sensor?.value || chartData[sensorType].length === 0) return null;
          
          const status = getSensorStatus(sensorType, sensor.value);
          
          return (
            <View key={`chart-${sensorType}`} style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{getSensorName(sensorType)}</Text>
                <Text style={styles.chartCurrentValue}>
                  {sensor.value.toFixed(1)} {sensor.unit}
                </Text>
              </View>
              
              <LineChart
                data={{
                  labels: chartData.timestamps.filter((_, i) => i % 3 === 0), // Mostrar cada 3er timestamp
                  datasets: [{
                    data: chartData[sensorType],
                    color: (opacity = 1) => status.color + Math.round(opacity * 255).toString(16),
                    strokeWidth: 2
                  }]
                }}
                width={screenWidth - 40}
                height={180}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => status.color + Math.round(opacity * 255).toString(16),
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "3",
                    strokeWidth: "1",
                    stroke: status.color
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          );
        })}
      </View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.footerText}>
          Los datos se actualizan automáticamente cada 30 segundos
        </Text>
      </View>
    </ScrollView>
  );
};

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
  },
  noDataSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sensorsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sensorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sensorStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  sensorValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  unitText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  chartsSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  chartsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartCurrentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chart: {
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default EnvironmentalWidget;
