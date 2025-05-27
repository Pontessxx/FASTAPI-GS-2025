import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from '@/Navigation/AuthStack';
import AppStack from '@/Navigation/AppStack';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/types';

export default function App() {
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      setUserToken(token);
    };
    loadToken();
  }, []);

  const authContext = {
    signIn: (token) => setUserToken(token),
    signOut: async () => {
      await AsyncStorage.removeItem('accessToken');
      setUserToken(null);
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {userToken ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}