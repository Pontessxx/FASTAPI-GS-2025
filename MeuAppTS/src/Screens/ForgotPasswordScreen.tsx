import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Text, Alert
} from 'react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleForgot = async () => {
    try {
      const resp = await fetch(
        `http://192.168.68.65:8000/reset-password/send-code?email=${encodeURIComponent(email)}`
      );
      if (!resp.ok) throw new Error('Falha ao enviar código');
      const { msg, code } = await resp.json();
      // mostra um alerta com o código
      Alert.alert(
        'Recuperação de senha',
        `${msg}\n\nSeu código é: ${code}`,
        [{ text: 'OK', onPress: () => {
            // navega para a tela de verificação, passando o email (e o código se quiser)
            navigation.navigate('VerifyCode', { email /*, code*/ });
          }
        }]
      );
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Digite seu email para recuperação:</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleForgot}>
        <Text style={styles.buttonText}>Enviar Código</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Voltar ao Login</Text>
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