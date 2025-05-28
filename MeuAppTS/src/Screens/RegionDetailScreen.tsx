// src/Screens/RegionDetailScreen.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function RegionDetailScreen({ route, navigation }) {
  const { region } = route.params; // CEP ou texto
  const [cepData, setCepData] = useState<any>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [errorCep, setErrorCep] = useState('');

  // Form state for event
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [damages, setDamages] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState('');

  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  useEffect(() => {
    const fetchCep = async () => {
      const cepOnly = region.replace(/[^0-9]/g, '');
      if (/^\d{8}$/.test(cepOnly)) {
        setLoadingCep(true);
        try {
          const resp = await fetch(`https://viacep.com.br/ws/${cepOnly}/json/`);
          const data = await resp.json();
          if (data.erro) throw new Error('CEP não encontrado');
          setCepData(data);
        } catch (e: any) {
          setErrorCep(e.message);
        } finally {
          setLoadingCep(false);
        }
      }
    };
    fetchCep();
  }, [region]);

  const handleSubmit = async () => {
    setErrorSubmit('');
    if (!estimatedDuration) {
      setErrorSubmit('Informe o tempo estimado de interrupção.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const region_id = /^\d{8}$/.test(region.replace(/[^0-9]/g, ''))
        ? Number(region.replace(/[^0-9]/g, ''))
        : region; // caso envie texto, backend aceita string
      const payload = {
        region_id,
        estimated_duration: estimatedDuration,
        actual_duration: actualDuration || undefined,
        damages: damages || undefined,
      };
      const resp = await fetch(`${API}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (resp.status === 401) {
        return signOut();
      }
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Erro ao salvar evento');
      }
      Alert.alert('Sucesso', 'Evento registrado');
      navigation.navigate('Panorama');
    } catch (e: any) {
      setErrorSubmit(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView>
        <Text style={styles.title}>Detalhes da Região</Text>
        {loadingCep && <ActivityIndicator size="large" />}
        {errorCep.length > 0 && <Text style={styles.error}>{errorCep}</Text>}
        {cepData ? (
          <View style={styles.details}>
            <Text>Logradouro: {cepData.logradouro}</Text>
            <Text>Bairro: {cepData.bairro}</Text>
            <Text>Localidade: {cepData.localidade}</Text>
            <Text>UF: {cepData.uf}</Text>
          </View>
        ) : (
          !loadingCep && <Text style={styles.regionText}>{region}</Text>
        )}

        <Text style={styles.formLabel}>Tempo Estimado de Interrupção:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2h30"
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
        />

        <Text style={styles.formLabel}>Tempo Real (opcional):</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2h45"
          value={actualDuration}
          onChangeText={setActualDuration}
        />

        <Text style={styles.formLabel}>Prejuízos Observados:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Descreva os prejuízos"
          value={damages}
          multiline
          onChangeText={setDamages}
        />

        {errorSubmit.length > 0 && (
          <Text style={styles.error}>{errorSubmit}</Text>
        )}

        <Button
          title={submitting ? 'Salvando...' : 'Registrar Evento'}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  details: { marginBottom: 16 },
  regionText: { marginBottom: 16, fontSize: 16 },
  formLabel: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  error: { color: 'red', marginVertical: 8 },
});
