import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Text, Alert
} from 'react-native';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, code } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    try {
      const resp = await fetch('http://192.168.68.65:8000/reset-password', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, code, new_password: newPassword })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Não foi possível redefinir');
      }
      Alert.alert('Sucesso', 'Senha redefinida com sucesso', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Digite sua nova senha:</Text>
      <TextInput
        placeholder="Nova senha"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Redefinir Senha</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 12, borderRadius: 4 },
    button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    link: { alignItems: 'center', marginVertical: 6 },
    linkText: { color: '#007AFF' },
    error: { color: 'red', marginBottom: 8, textAlign: 'center' },
    success: { color: 'green', marginBottom: 8, textAlign: 'center' },
  });