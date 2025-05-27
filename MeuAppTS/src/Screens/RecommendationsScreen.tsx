// screens/RecommendationsScreen.js
import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '@/types';

export default function RecommendationsScreen() {
  const { signOut } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RecommendationsScreen</Text>
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
