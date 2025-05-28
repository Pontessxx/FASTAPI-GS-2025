// src/Screens/PanoramaScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function PanoramaScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);
  const API = 'http://192.168.68.65:8000';

  const loadEvents = async () => {
    setError('');
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const resp = await fetch(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401) {
        signOut();
        return;
      }
      const data = await resp.json();
      setEvents(data);
    } catch (e) {
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.region}>Região ID: {item.region_id}</Text>
      <Text>Estimado: {item.estimated_duration}</Text>
      {item.actual_duration ? <Text>Real: {item.actual_duration}</Text> : null}
      {item.damages ? <Text>Prejuízos: {item.damages}</Text> : null}
      <Text style={styles.date}>
        Criado em: {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panorama Geral</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.content}>
          <Text style={styles.summary}>Total de eventos: {events.length}</Text>
          <FlatList
            data={events}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum evento registrado.</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  content: { flex: 1 },
  summary: { fontSize: 16, marginBottom: 8 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  region: { fontWeight: '600' },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});
