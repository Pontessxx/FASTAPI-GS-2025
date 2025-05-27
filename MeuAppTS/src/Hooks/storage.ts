// src/Hooks/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const REGIONS_KEY = '@outage_regions';

export async function fetchRegions(): Promise<string[]> {
  const json = await AsyncStorage.getItem(REGIONS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addRegion(region: string): Promise<void> {
  const list = await fetchRegions();
  await AsyncStorage.setItem(REGIONS_KEY, JSON.stringify([region, ...list]));
}
