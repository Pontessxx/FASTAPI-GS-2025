// src/Screens/DamagesScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function DamagesScreen({ route, navigation }) {
  const { eventId, regionLabel } = route.params;
  const [damages, setDamages] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  const handleSubmit = async () => {
    if (!damages.trim()) {
      Alert.alert('Atenção', 'Descreva os prejuízos observados.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ damages }),
      });
      if (resp.status === 401) {
        signOut();
        return;
      }
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Erro ao atualizar evento');
      }
      Alert.alert('Sucesso', 'Prejuízos registrados');
      navigation.popToTop();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={styles.title}>Prejuízos Causados</Text>
      <Text style={styles.region}>{regionLabel}</Text>

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descreva os prejuízos observados..."
        multiline
        value={damages}
        onChangeText={setDamages}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Finalizar" onPress={handleSubmit} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  region: { fontSize: 16, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  error: { color: 'red', marginBottom: 8 },
});
