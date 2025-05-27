// storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OutageEvent {
  id: string;              // uuid ou timestamp
  region: string;          // bairro, cidade ou CEP
  duration: string;        // ex: "2h30", "45m"
  reportedAt: string;      // ISO date
  damages: string;         // descrição livre
}

const STORAGE_KEY = '@outage_events';

export async function fetchEvents(): Promise<OutageEvent[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveEvents(events: OutageEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export async function addEvent(evt: OutageEvent): Promise<void> {
  const all = await fetchEvents();
  await saveEvents([evt, ...all]);
}
