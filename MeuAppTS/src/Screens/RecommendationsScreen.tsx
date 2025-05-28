// src/Screens/RecommendationsScreen.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

const OWM_API_KEY = 'a0dcd14f7f427f1ae1bd5ff8f888231e'; 
const API = 'http://192.168.68.65:8000';

interface RawEvent {
  id: number;
  region_id: number;
  created_at: string;
}
interface Region {
  id: number;
  region: string; // texto: CEP ou "Bairro, Cidade - UF"
}
interface EventWithWeather {
  id: number;
  regionLabel: string;  // texto da região
  created_at: string;
  hadRain: boolean;
}

export default function RecommendationsScreen() {
  const [tips] = useState([
    'Mantenha lanternas e pilhas à mão.',
    'Estoque água potável.',
    'Desligue equipamentos sensíveis antes do restabelecimento.',
    'Siga instruções das autoridades locais.',
  ]);
  const [events, setEvents] = useState<EventWithWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { signOut } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return signOut();

        // 1) Busca todas as regiões do usuário
        const regionsResp = await fetch(`${API}/regions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (regionsResp.status === 401) return signOut();
        const regions: Region[] = await regionsResp.json();
        const regionMap: Record<number,string> = {};
        regions.forEach(r => regionMap[r.id] = r.region);

        // 2) Busca todos os eventos
        const eventsResp = await fetch(`${API}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eventsResp.status === 401) return signOut();
        const rawEvents: RawEvent[] = await eventsResp.json();

        // 3) Para cada evento, usa o texto da região para geocoding + histórico
        const enriched: EventWithWeather[] = [];
        for (let ev of rawEvents) {
          const regionLabel = regionMap[ev.region_id] || 'Desconhecido';
          const latlon = await fetchLatLon(regionLabel);
          const hadRain = latlon
            ? await fetchHistoricalRain(latlon, ev.created_at)
            : false;
          enriched.push({ 
            id: ev.id,
            regionLabel,
            created_at: ev.created_at,
            hadRain
          });
        }
        setEvents(enriched);
      } catch (e:any) {
        setError('Erro ao carregar eventos e clima');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // retorna "lat,lon" ou null
  async function fetchLatLon(region: string): Promise<string|null> {
    try {
      const url = 
        `http://api.openweathermap.org/geo/1.0/direct?` +
        `q=${encodeURIComponent(region)}&limit=1&appid=${OWM_API_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data.length > 0) {
        return `${data[0].lat},${data[0].lon}`;
      }
    } catch {}
    return null;
  }

  // retorna se houve chuva no dia
  async function fetchHistoricalRain(latlon: string, isoDate: string): Promise<boolean> {
    const [lat, lon] = latlon.split(',');
    const dt = Math.floor(new Date(isoDate).getTime() / 1000);
    try {
      const url =
        `https://api.openweathermap.org/data/2.5/onecall/timemachine?` +
        `lat=${lat}&lon=${lon}&dt=${dt}&appid=${OWM_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      return Array.isArray(json.hourly) && 
             json.hourly.some((h:any) => h.rain && h.rain['1h'] > 0);
    } catch {
      return false;
    }
  }

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recomendações</Text>

      <FlatList
        data={tips}
        keyExtractor={(_, i) => `tip-${i}`}
        renderItem={({ item }) => <Text style={styles.tip}>• {item}</Text>}
        ListFooterComponent={() => (
          <>
            <Text style={styles.subTitle}>Seu histórico vs. chuva</Text>
            <FlatList
              data={events}
              keyExtractor={e => `evt-${e.id}`}
              renderItem={({ item }) => (
                <View style={styles.eventRow}>
                  <Text style={styles.eventRegion}>{item.regionLabel}</Text>
                  <Text>
                    {new Date(item.created_at).toLocaleDateString()} –{' '}
                    {item.hadRain ? '🌧️ Teve chuva' : '☀️ Sem chuva'}
                  </Text>
                </View>
              )}
            />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  loader: { flex:1, justifyContent:'center' },
  title: { fontSize:24, fontWeight:'bold', marginBottom:12 },
  tip: { fontSize:16, marginVertical:4 },
  subTitle: { fontSize:20, fontWeight:'600', marginTop:24, marginBottom:8 },
  eventRow:{ paddingVertical:8, borderBottomWidth:1, borderColor:'#eee' },
  eventRegion:{ fontWeight:'600' },
  error:{ color:'red', textAlign:'center', marginTop:20 },
});
