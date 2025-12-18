import React, { useState } from 'react';
import {Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos obrigatórios", "Preencha o email e a password.");
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.123:3001/api/auth/login', { email, password });

      const userId = response.data.user?.id_utilizador;
      const token = response.data.token;

      if (!userId || !token) throw new Error('Credenciais incompletas.');

      await AsyncStorage.setItem('userId', userId.toString());
      await AsyncStorage.setItem('authToken', token);

      Alert.alert("Login efetuado com sucesso!");
      navigation.navigate('Preferences');
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha no login.');
    }
  };

  return (
    <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="example@email.com"
          placeholderTextColor="#7a8aac"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#7a8aac"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account? <Text style={styles.linkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#ff6e40', // laranja para destaque
    marginBottom: 30,
  },
  label: {
    color: '#d0d7de', // cinza claro para texto
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#e9ecf6', // azul muito claro
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    color: '#1e3c72', // azul escuro para texto
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#5a7abf',
  },
  button: {
    backgroundColor: '#1e3c72', // azul escuro
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#ff6e40', // laranja para texto do botão
    fontWeight: '700',
    fontSize: 18,
  },
  link: {
    textAlign: 'center',
    color: '#d0d7de',
    marginTop: 12,
    fontSize: 15,
  },
  linkBold: {
    fontWeight: '700',
    color: '#ff6e40',
    textDecorationLine: 'underline',
  },
});
