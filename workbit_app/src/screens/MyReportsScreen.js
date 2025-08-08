import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const MyReportsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    load();
    return unsubscribe;
  }, [navigation]);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getMyReports();
      const data = resp?.data || [];
      setItems(data);
    } catch (e) {
      console.error('Load reports error', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      {item.attachments?.length > 0 && (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {item.attachments.slice(0, 3).map((a) => (
            <Image key={a.id} source={{ uri: a.file_url }} style={styles.thumb} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reportes</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#6b7280' }}>No tienes reportes</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  date: { fontSize: 12, color: '#6b7280' },
  desc: { color: '#374151', marginTop: 6 },
  thumb: { width: 64, height: 64, borderRadius: 8, marginRight: 8 }
});

export default MyReportsScreen;
