import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { Pedometer } from 'expo-sensors';

const ActivityMeter = ({ interval = 500, active = true }) => {
  const [accMagnitude, setAccMagnitude] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [steps, setSteps] = useState(0);
  const barAnim = useRef(new Animated.Value(0)).current;
  const accSubRef = useRef(null);
  const pedSubRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    (async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        setIsAvailable(!!available);
        if (available) {
          Accelerometer.setUpdateInterval(interval);
          accSubRef.current = Accelerometer.addListener(({ x, y, z }) => {
            const mag = Math.sqrt(x * x + y * y + z * z) - 1; // remove gravity approx
            const clamped = Math.max(0, Math.min(2, Math.abs(mag)));
            setAccMagnitude(clamped);
          });
        }
      } catch (e) {
        setIsAvailable(false);
      }

      try {
        await Pedometer.requestPermissionsAsync();
        const available = await Pedometer.isAvailableAsync();
        if (available) {
          pedSubRef.current = Pedometer.watchStepCount((result) => {
            setSteps(result.steps); // steps since subscription started
          });
        }
      } catch {}
    })();

    return () => {
      accSubRef.current && accSubRef.current.remove();
      pedSubRef.current && pedSubRef.current.remove && pedSubRef.current.remove();
      accSubRef.current = null;
      pedSubRef.current = null;
    };
  }, [interval, active]);

  useEffect(() => {
    const level = Math.max(0, Math.min(1, accMagnitude / 1.2));
    Animated.timing(barAnim, { toValue: level, duration: interval, useNativeDriver: false }).start();
  }, [accMagnitude]);

  const widthPercent = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['5%', '100%'] });
  const color = barAnim.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: ['#10B981', '#10B981', '#F59E0B', '#EF4444'] });

  const label = (() => {
    const level = Math.max(0, Math.min(1, accMagnitude / 1.2));
    if (level < 0.33) return 'Baja actividad';
    if (level < 0.66) return 'Actividad moderada';
    return 'Alta actividad';
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="walk-outline" size={18} color="#374151" />
        <Text style={styles.title}>Nivel de actividad</Text>
      </View>
      {isAvailable ? (
        <View>
          <View style={styles.barBg}>
            <Animated.View style={[styles.barFill, { width: widthPercent, backgroundColor: color }]} />
          </View>
          <Text style={styles.caption}>{label} • Pasos: {steps}</Text>
        </View>
      ) : (
        <Text style={styles.caption}>Sensores de movimiento no disponibles</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 20, marginTop: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  barBg: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  caption: { marginTop: 8, fontSize: 12, color: '#6B7280' },
});

export default ActivityMeter;
