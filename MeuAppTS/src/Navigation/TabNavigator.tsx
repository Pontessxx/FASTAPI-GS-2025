// navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // ou outra lib de ícones
import PanoramaScreen from '@/Screens/PanoramaScreen';
import RecommendationsScreen from '@/Screens/RecommendationsScreen';
import ProfileScreen from '@/Screens/ProfileScreen';  // exemplo de terceira aba

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,             // esconde header caso queira
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          if (route.name === 'Panorama') {
            iconName = 'home-outline';
          } else if (route.name === 'Recommendations') {
            iconName = 'shield-checkmark-outline';
          } else {
            iconName = 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Panorama" component={PanoramaScreen} options={{ title: 'Resumo' }} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Dicas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
