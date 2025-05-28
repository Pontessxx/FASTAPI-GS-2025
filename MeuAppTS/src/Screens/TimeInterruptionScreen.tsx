// src/Screens/TimeInterruptionScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function TimeInterruptionScreen({ route, navigation }) {
  const { regionId, regionLabel } = route.params;  // Passed from LocationScreen
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  const handleSubmit = async () => {
    setError('');
    if (!estimatedDuration.trim()) {
      Alert.alert('Atenção', 'Informe o tempo estimado de interrupção.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          region_id: regionId,
          estimated_duration: estimatedDuration,
          actual_duration: actualDuration || undefined,
        }),
      });
      if (resp.status === 401) {
        signOut();
        return;
      }
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Erro ao registrar o tempo');
      }
      const data = await resp.json();
      // Navigate to Prejuízos screen, passing the eventId
      navigation.navigate('Damages', {
        eventId: data.id,
        regionLabel,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Tempo de Interrupção</Text>
      <Text style={styles.region}>{regionLabel}</Text>

      <Text style={styles.label}>Estimado:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 2h30"
        value={estimatedDuration}
        onChangeText={setEstimatedDuration}
      />

      <Text style={styles.label}>Real (opcional):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 2h45"
        value={actualDuration}
        onChangeText={setActualDuration}
      />

      {error.length > 0 && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Próximo: Prejuízos" onPress={handleSubmit} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  region: { fontSize: 16, marginBottom: 20 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  error: { color: 'red', marginVertical: 8 },
});
