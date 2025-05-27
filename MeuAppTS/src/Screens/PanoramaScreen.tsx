// screens/PanoramaScreen.js
import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '@/types';

export default function PanoramaScreen() {
  const { signOut } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PanoramaScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',  // centraliza conteúdo
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
});
