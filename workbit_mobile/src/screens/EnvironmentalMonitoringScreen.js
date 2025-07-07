import React, { useState, useEffect } from 'react';
import { ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import styled from 'styled-components/native';
import { Text, Icon } from '../components/atoms';
import { LoadingSpinner } from '../components/molecules';

const { width } = Dimensions.get('window');

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
`;

const Header = styled.View`
  padding: ${({ theme }) => theme.spacing.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const GaugeContainer = styled.View`
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
  background-color: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  margin-horizontal: ${({ theme }) => theme.spacing.lg}px;
`;

const GaugeCircle = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  border-width: 20px;
  border-color: ${({ theme, value, maxValue }) => {
    const percentage = (value / maxValue) * 100;
    if (percentage < 60) return theme.colors.success;
    if (percentage < 80) return theme.colors.warning;
    return theme.colors.error;
  }};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const MetricCard = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg}px;
  margin-horizontal: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  flex-direction: row;
  align-items: center;
`;

const MetricCardTouchable = styled(TouchableOpacity)`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg}px;
  margin-horizontal: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  flex-direction: row;
  align-items: center;
`;

const MetricIcon = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ theme, color }) => theme.colors[color] || theme.colors.primary};
  justify-content: center;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing.md}px;
`;

const MetricContent = styled.View`
  flex: 1;
`;

const MetricValue = styled.View`
  align-items: flex-end;
`;

const ChartContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const ThresholdIndicator = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm}px;
`;

const ThresholdItem = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ThresholdColor = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${({ color }) => color};
  margin-right: ${({ theme }) => theme.spacing.xs}px;
`;

/**
 * Environmental Monitoring screen with gauge and charts
 */
const EnvironmentalMonitoringScreen = ({ route }) => {
  const { reservation } = route.params || {};
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('co2');

  useEffect(() => {
    loadEnvironmentalData();
    // Set up real-time updates
    const interval = setInterval(loadEnvironmentalData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEnvironmentalData = async () => {
    try {
      // API_CALL: fetchEnvironmentalData(reservation.spaceId)
      console.log('Loading environmental data...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock environmental data
      const mockData = {
        current: {
          co2: 650,
          temperature: 23.5,
          humidity: 45,
          noise: 42,
          light: 350,
        },
        thresholds: {
          co2: { safe: 600, warning: 800, danger: 1000 },
          temperature: { safe: [20, 26], warning: [18, 28], danger: [15, 30] },
          humidity: { safe: [40, 60], warning: [30, 70], danger: [20, 80] },
          noise: { safe: 50, warning: 60, danger: 70 },
          light: { safe: [300, 500], warning: [200, 600], danger: [100, 700] },
        },
        history: {
          co2: [620, 635, 650, 642, 655, 650, 648],
          temperature: [23.2, 23.4, 23.5, 23.3, 23.6, 23.5, 23.4],
          humidity: [44, 45, 45, 46, 45, 45, 44],
          noise: [40, 42, 41, 43, 42, 42, 41],
          light: [340, 350, 355, 345, 350, 350, 348],
        },
        timestamps: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'],
      };
      
      setEnvironmentalData(mockData);
    } catch (error) {
      console.error('Error loading environmental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricStatus = (value, thresholds, metricType) => {
    if (metricType === 'temperature' || metricType === 'humidity' || metricType === 'light') {
      const [safeMin, safeMax] = thresholds.safe;
      const [warningMin, warningMax] = thresholds.warning;
      
      if (value >= safeMin && value <= safeMax) return 'safe';
      if (value >= warningMin && value <= warningMax) return 'warning';
      return 'danger';
    } else {
      if (value <= thresholds.safe) return 'safe';
      if (value <= thresholds.warning) return 'warning';
      return 'danger';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'danger': return '#D32F2F';
      default: return '#BDBDBD';
    }
  };

  const metrics = [
    { key: 'co2', name: 'CO₂', unit: 'ppm', icon: 'wind', color: 'info' },
    { key: 'temperature', name: 'Temperatura', unit: '°C', icon: 'thermometer', color: 'primary' },
    { key: 'humidity', name: 'Humedad', unit: '%', icon: 'droplet', color: 'success' },
    { key: 'noise', name: 'Ruido', unit: 'dB', icon: 'volume-2', color: 'warning' },
    { key: 'light', name: 'Iluminación', unit: 'lux', icon: 'sun', color: 'warning' },
  ];

  if (loading) {
    return (
      <Container>
        <LoadingSpinner fullScreen message="Cargando datos ambientales..." />
      </Container>
    );
  }

  const currentMetric = metrics.find(m => m.key === selectedMetric);
  const currentValue = environmentalData?.current[selectedMetric];
  const thresholds = environmentalData?.thresholds[selectedMetric];
  const status = getMetricStatus(currentValue, thresholds, selectedMetric);

  const chartData = {
    labels: environmentalData?.timestamps || [],
    datasets: [
      {
        data: environmentalData?.history[selectedMetric] || [],
        color: (opacity = 1) => getStatusColor(status),
        strokeWidth: 3,
      },
    ],
  };

  return (
    <Container>
      <Content showsVerticalScrollIndicator={false}>
        <Header>
          <Text size="lg" weight="semibold" marginBottom="sm">
            {reservation?.spaceName || 'Monitoreo Ambiental'}
          </Text>
          <Text size="sm" color="textSecondary">
            Datos en tiempo real • Actualizado hace 1 min
          </Text>
        </Header>

        <GaugeContainer>
          <GaugeCircle
            value={currentValue}
            maxValue={selectedMetric === 'co2' ? 1000 : selectedMetric === 'temperature' ? 35 : 100}
          >
            <Text size="xxxl" weight="bold" color={status === 'safe' ? 'success' : status === 'warning' ? 'warning' : 'error'}>
              {currentValue}
            </Text>
            <Text size="md" color="textSecondary">
              {currentMetric?.unit}
            </Text>
          </GaugeCircle>
          
          <Text size="lg" weight="semibold" marginBottom="sm">
            {currentMetric?.name}
          </Text>
          
          <ThresholdIndicator>
            <ThresholdItem>
              <ThresholdColor color="#4CAF50" />
              <Text size="xs" color="textSecondary">Seguro</Text>
            </ThresholdItem>
            <ThresholdItem>
              <ThresholdColor color="#FF9800" />
              <Text size="xs" color="textSecondary">Advertencia</Text>
            </ThresholdItem>
            <ThresholdItem>
              <ThresholdColor color="#D32F2F" />
              <Text size="xs" color="textSecondary">Peligro</Text>
            </ThresholdItem>
          </ThresholdIndicator>
        </GaugeContainer>

        {metrics.map((metric) => {
          const value = environmentalData?.current[metric.key];
          const metricStatus = getMetricStatus(value, environmentalData?.thresholds[metric.key], metric.key);
          
          return (
            <MetricCardTouchable
              key={metric.key}
              onPress={() => setSelectedMetric(metric.key)}
              style={{
                borderWidth: selectedMetric === metric.key ? 2 : 0,
                borderColor: selectedMetric === metric.key ? '#1976D2' : 'transparent',
              }}
            >
              <MetricIcon color={metric.color}>
                <Icon
                  name={metric.icon}
                  size={20}
                  color="textOnPrimary"
                />
              </MetricIcon>
              <MetricContent>
                <Text size="md" weight="medium" marginBottom="xs">
                  {metric.name}
                </Text>
                <Text size="sm" color="textSecondary">
                  Estado: {metricStatus === 'safe' ? 'Normal' : metricStatus === 'warning' ? 'Advertencia' : 'Crítico'}
                </Text>
              </MetricContent>
              <MetricValue>
                <Text size="lg" weight="bold" color={getStatusColor(metricStatus).replace('#', '')}>
                  {value}
                </Text>
                <Text size="sm" color="textSecondary">
                  {metric.unit}
                </Text>
              </MetricValue>
            </MetricCardTouchable>
          );
        })}

        <ChartContainer>
          <Text size="lg" weight="semibold" marginBottom="md">
            Historial - {currentMetric?.name}
          </Text>
          
          <LineChart
            data={chartData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => getStatusColor(status),
              labelColor: (opacity = 1) => '#757575',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: getStatusColor(status),
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          <Text size="sm" color="textSecondary" align="center">
            Últimas 7 mediciones
          </Text>
        </ChartContainer>
      </Content>
    </Container>
  );
};

export default EnvironmentalMonitoringScreen; 