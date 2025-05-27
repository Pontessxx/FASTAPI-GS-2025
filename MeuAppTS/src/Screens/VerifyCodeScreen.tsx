import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Text, Alert
} from 'react-native';

export default function VerifyCodeScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    try {
      const resp = await fetch('http://192.168.68.65:8000/reset-password/verify-code', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, code })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Código inválido');
      }
      // navega para a tela de reset de senha
      navigation.navigate('ResetPassword', { email, code });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Insira o código enviado para {email}:</Text>
      <TextInput
        placeholder="Código"
        value={code}
        onChangeText={setCode}
        style={styles.input}
        keyboardType="numeric"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verificar Código</Text>
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