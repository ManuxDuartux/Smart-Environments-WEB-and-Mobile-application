import React, { useState } from 'react';
import {Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function UserRegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({ nome: '', email: '', password: '' });

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const { nome, email, password } = formData;

    if (!nome || !email || !password) {
      Alert.alert("Campos obrigatórios", "Por favor preencha todos os campos.");
      return;
    }

    try {
      await axios.post('http://192.168.1.123:3001/api/auth/register', formData); 
      Alert.alert("Sucesso", "Utilizador registado com sucesso!");
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao registar.');
    }
  };

  return (
    <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.nome}
          onChangeText={(text) => handleChange('nome', text)}
          placeholder="Insert your name"
          placeholderTextColor="#5a7abf"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          placeholder="example@email.com"
          placeholderTextColor="#5a7abf"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#5a7abf"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
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
  label: {
    color: '#d0d7de',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#e9ecf6',
    padding: 14,
    borderRadius: 25,
    marginBottom: 12,
    color: '#1e3c72',
    borderWidth: 1.5,
    borderColor: '#5a7abf',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1e3c72',
    borderRadius: 50,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#ff6e40',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#d0d7de',
    marginTop: 10,
  },
  linkBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#ff6e40',
  },
});
