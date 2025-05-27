import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from '@/Navigation/TabNavigator';
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
    </Stack.Navigator>
  );
}