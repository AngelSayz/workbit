import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ReportModal = ({ visible, onClose, onSubmit, reservation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (source) => {
    const permissionResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permisos requeridos para continuar');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0]]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Completa título y descripción');
      return;
    }
    setUploading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), images });
      setTitle('');
      setDescription('');
      setImages([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Generar Reporte</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Asunto del reporte"
            style={styles.input}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el problema o comentario"
            style={[styles.input, { height: 100 }]} multiline
          />

          <View style={styles.imagesHeader}>
            <Text style={styles.label}>Imágenes (opcional)</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage('camera')}>
                <Ionicons name="camera" size={18} color="#2563eb" />
                <Text style={styles.attachText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage('library')}>
                <Ionicons name="image" size={18} color="#2563eb" />
                <Text style={styles.attachText}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.thumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.remove} onPress={() => removeImage(idx)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={[styles.submitBtn, uploading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enviar Reporte</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  container: { width: '92%', backgroundColor: 'white', borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb' },
  imagesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#eff6ff', borderRadius: 8 },
  attachText: { color: '#2563eb', fontWeight: '600' },
  thumbWrap: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', marginRight: 10, position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default ReportModal;
