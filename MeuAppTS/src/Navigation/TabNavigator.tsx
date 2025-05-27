// navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // ou outra lib de ícones
import PanoramaScreen from '@/Screens/PanoramaScreen';
import RecommendationsScreen from '@/Screens/RecommendationsScreen';
import ProfileScreen from '@/Screens/ProfileScreen';  // exemplo de terceira aba
import LocationScreen from '@/Screens/LocationScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons['glyphMap'];

          switch (route.name) {
            case 'Panorama':
              iconName = 'home-outline';
              break;
            case 'Recommendations':
              iconName = 'shield-checkmark-outline';
              break;
            case 'Location':
              iconName = 'location-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Panorama" component={PanoramaScreen} options={{ title: 'Resumo' }} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Dicas' }} />
      <Tab.Screen name="Location" component={LocationScreen} options={{ title: 'Location' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
