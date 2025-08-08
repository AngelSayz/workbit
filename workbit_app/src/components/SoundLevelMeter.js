import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking, Platform, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';

// Utility to map metering (dBFS approximate) to 0..1 progress
function normalizeDb(metering) {
  // metering expected around -160 (silence) to 0 (max). Clamp and normalize.
  const min = -60; // show anything louder than -60 dBFS
  const max = 0;
  const clamped = Math.max(min, Math.min(max, metering ?? min));
  return (clamped - min) / (max - min);
}

const SoundLevelMeter = ({ updateInterval = 400, active = true }) => {
  const recorder = useAudioRecorder({
    ...RecordingPresets.LOW_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, updateInterval);
  const [granted, setGranted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const barAnim = useRef(new Animated.Value(0)).current;

  const getPermFns = () => ({
    getAsync: Audio.getPermissionsAsync || Audio.getRecordingPermissionsAsync || Audio.getMicrophonePermissionsAsync,
    requestAsync: Audio.requestPermissionsAsync || Audio.requestRecordingPermissionsAsync || Audio.requestMicrophonePermissionsAsync,
  });

  const ensureMicPermission = async () => {
    try {
      // 1) En Android, intentar primero con PermissionsAndroid (mejor soporte en Expo Go)
      if (Platform.OS === 'android') {
        const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (already) {
          setGranted(true);
          setBlocked(false);
          return true;
        }
        setRequesting(true);
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        setRequesting(false);
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          setGranted(true);
          setBlocked(false);
          return true;
        }
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          setGranted(false);
          setBlocked(true);
          return false;
        }
        // Si fue denegado, continuar a APIs de expo-audio por si exponen otro estado
      }

      // 2) APIs de expo-audio (iOS y fallback)
      const { getAsync, requestAsync } = getPermFns();
      if (!getAsync || !requestAsync) {
        // Fallback: si no hay APIs de permiso disponibles, asumir concedido en entornos dev
        setGranted(true);
        setBlocked(false);
        return true;
      }

      const current = await getAsync();
      if (current?.granted) {
        setGranted(true);
        setBlocked(false);
        return true;
      }
      if (current && current.canAskAgain === false) {
        setGranted(false);
        setBlocked(true);
        return false;
      }

      setRequesting(true);
      const asked = await requestAsync();
      setRequesting(false);
      if (asked?.granted) {
        setGranted(true);
        setBlocked(false);
        return true;
      }
      if (asked && asked.canAskAgain === false) {
        setBlocked(true);
      }
      setGranted(false);
      return false;
    } catch {
      setGranted(false);
      return false;
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  useEffect(() => {
    let stopped = false;
    if (!active) return;
    (async () => {
      const ok = await ensureMicPermission();
      if (!ok || stopped) return;
      try {
        await Audio.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync({ isMeteringEnabled: true });
        recorder.record();
      } catch {}
    })();
    return () => {
      stopped = true;
      try { recorder.stop(); } catch {}
    };
  }, [active]);

  useEffect(() => {
    if (!granted) return;
    const level = normalizeDb(recorderState?.metering ?? -60);
    Animated.timing(barAnim, {
      toValue: level,
      duration: updateInterval,
      useNativeDriver: false,
    }).start();
  }, [recorderState?.metering, granted]);

  const widthPercent = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '100%'],
  });

  const color = barAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['#10B981', '#10B981', '#F59E0B', '#EF4444'],
  });

  const label = (() => {
    const lvl = normalizeDb(recorderState?.metering ?? -60);
    if (lvl < 0.33) return 'Ambiente silencioso';
    if (lvl < 0.66) return 'Conversación normal';
    return 'Ruido elevado';
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mic-outline" size={18} color="#374151" />
        <Text style={styles.title}>Nivel de ruido</Text>
      </View>
      {granted ? (
        <View>
          <View style={styles.barBg}>
            <Animated.View style={[styles.barFill, { width: widthPercent, backgroundColor: color }]} />
          </View>
          <Text style={styles.caption}>{label}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.caption}>
            {blocked
              ? 'El permiso de micrófono está bloqueado. Abre los ajustes para habilitarlo.'
              : requesting
                ? 'Solicitando permiso de micrófono...'
                : 'Otorga permiso de micrófono para medir ruido'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {!blocked && (
              <TouchableOpacity style={styles.ctaBtn} onPress={ensureMicPermission}>
                <Text style={styles.ctaText}>Conceder permiso</Text>
              </TouchableOpacity>
            )}
            {blocked && (
              <TouchableOpacity style={styles.ctaBtn} onPress={openSettings}>
                <Text style={styles.ctaText}>Abrir ajustes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  ctaBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#3B82F6', borderRadius: 6 },
  ctaText: { color: 'white', fontWeight: '600', fontSize: 12 },
});

export default SoundLevelMeter;
