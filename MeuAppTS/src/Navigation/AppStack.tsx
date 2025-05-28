import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from '@/Navigation/TabNavigator';
import RegionDetailScreen from '@/Screens/RegionDetailScreen';
import TimeInterruptionScreen from '@/Screens/TimeInterruptionScreen';
import DamagesScreen from '@/Screens/DamagesScreen';
// importe aqui outras telas do App

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator>

      {/* Outras telas protegidas */}
      <Stack.Screen
        name="Home"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="RegionDetail" component={RegionDetailScreen} options={{ title: 'Região Detalhes' }} />
      <Stack.Screen name="TimeInterruption" component={TimeInterruptionScreen} options={{ title: 'Tempo de Interrupção' }} />
      <Stack.Screen name="Damages" component={DamagesScreen} />
    </Stack.Navigator>
  );
}