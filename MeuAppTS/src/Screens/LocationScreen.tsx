// src/Screens/LocationScreen.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

interface RegionItem {
  id: number;
  raw: string;
  label: string;
}

export default function LocationScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [regionsList, setRegionsList] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  const loadRegions = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401) return signOut();
      const data: { id: number; region: string }[] = await resp.json();
      const enriched = await Promise.all(
        data.map(async r => {
          const cepOnly = r.region.replace(/[^0-9]/g, '');
          if (/^\d{8}$/.test(cepOnly)) {
            try {
              const respCep = await fetch(`https://viacep.com.br/ws/${cepOnly}/json/`);
              const json = await respCep.json();
              if (!json.erro) {
                return { id: r.id, raw: r.region, label: `${json.logradouro}, ${json.bairro} - ${json.uf}` };
              }
            } catch {
              // fallback
            }
          }
          return { id: r.id, raw: r.region, label: r.region };
        })
      );
      setRegionsList(enriched);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRegions);
    return unsubscribe;
  }, [navigation]);

  const handleAdd = async () => {
    setError('');
    const cepOnly = input.trim().replace('-', '');
    if (!input.trim()) {
      setError('Informe um bairro, cidade ou CEP.');
      return;
    }
    const payload = /^\d{8}$/.test(cepOnly) ? cepOnly : input.trim();
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ region: payload }),
      });
      if (resp.status === 401) return signOut();
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Erro ao cadastrar região');
      }
      setInput('');
      await loadRegions();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={styles.label}>Região (bairro, cidade ou CEP):</Text>
      <TextInput
        placeholder="Ex: Centro, São Paulo ou 01001-000"
        value={input}
        onChangeText={setInput}
        style={styles.input}
        autoCapitalize="none"
      />
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Button title="Cadastrar Região" onPress={handleAdd} />

      <Text style={styles.listTitle}>Regiões cadastradas:</Text>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={regionsList}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('TimeInterruption', {
                regionId: item.id,
                regionLabel: item.label
              })}
            >
              <Text>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma região ainda.</Text>}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 50 },
  label: { marginBottom: 4, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  error: { color: 'red', marginBottom: 8 },
  listTitle: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  empty: { marginTop: 12, fontStyle: 'italic', color: '#666' },
});
