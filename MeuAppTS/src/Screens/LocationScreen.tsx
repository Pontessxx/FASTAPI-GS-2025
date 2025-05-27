// src/Screens/LocationScreen.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function LocationScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  // Carrega as regiões do backend sempre que a tela ganha foco
  const loadRegions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401) return signOut();
      const data: { region: string }[] = await resp.json();
      setRegionsList(data.map(r => r.region));
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRegions);
    return unsubscribe;
  }, [navigation]);

  const handleAdd = async () => {
    setError('');
    let finalRegion = input.trim();

    // Verifica CEP no formato xxxxxxxx ou xxxxx-xxx
    const cepOnly = finalRegion.replace('-', '');
    if (/^\d{8}$/.test(cepOnly)) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepOnly}/json/`);
        const dados = await resp.json();
        if (dados.erro) throw new Error('CEP não encontrado');
        finalRegion = `${dados.bairro}, ${dados.localidade} - ${dados.uf}`;
      } catch (e: any) {
        setError(e.message);
        return;
      }
    }

    if (!finalRegion) {
      setError('Informe um bairro, cidade ou CEP válido.');
      return;
    }

    // Salva no backend
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ region: finalRegion }),
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
      <FlatList
        data={regionsList}
        keyExtractor={(item, idx) => item + idx}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma região ainda.</Text>}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
