import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function PreferencesScreen() {
  const [userId, setUserId] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tiposPreferencia, setTiposPreferencia] = useState([]);
  const [preferencias, setPreferencias] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('authToken');
        if (!storedId || !token) return Alert.alert('Erro', 'Autenticação inválida.');

        const id = Number(storedId);
        setUserId(id);

        const envRes = await axios.get('http://192.168.1.123:3001/api/environment/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEnvironments(envRes.data || []);
        setSelectedEnv(envRes.data[0]?.id_ambiente ?? null);

        const prefsRes = await axios.get('http://192.168.1.123:3001/api/preferencias/tipos');
        setTiposPreferencia(prefsRes.data || []);

        const initialValues = {};
        prefsRes.data.forEach(pref => {
          initialValues[pref.id_tipo_preferencia] = pref.valor_minimo;
        });
        setPreferencias(initialValues);

      } catch (err) {
        Alert.alert('Erro', 'Falha ao carregar dados.');
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      if (!userId || !selectedEnv) return Alert.alert("Erro", "Preencha todos os campos.");
      const token = await AsyncStorage.getItem('authToken');

      const preferenciasArray = Object.entries(preferencias).map(([id, valor]) => ({
        id_tipo_preferencia: parseInt(id),
        valor,
      }));

      await axios.post('http://192.168.1.123:3001/api/preferencias', {
        id_utilizador: userId,
        id_ambiente: selectedEnv,
        preferencias: preferenciasArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Sucesso", "Preferências guardadas com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Não foi possível guardar as preferências.");
      console.log(err);
    }
  };

  const selectedEnvName = environments.find(e => e.id_ambiente === selectedEnv)?.nome || 'Selecionar ambiente';

  return (
    <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
      <Text style={styles.title}>User Preferences</Text>

      <Text style={styles.label}>Environment:</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownText}>{selectedEnvName}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={environments}
              keyExtractor={item => item.id_ambiente.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedEnv(item.id_ambiente);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {tiposPreferencia.map(pref => (
        <View key={pref.id_tipo_preferencia}>
          <Text style={styles.label}>
            {pref.nome}: {preferencias[pref.id_tipo_preferencia]} {pref.unidades_preferencia}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={pref.valor_minimo}
            maximumValue={pref.valor_maximo}
            step={pref.nome.toLowerCase().includes('temperatura') ? 0.5 : 1}
            value={preferencias[pref.id_tipo_preferencia]}
            onValueChange={(value) =>
              setPreferencias(prev => ({
                ...prev,
                [pref.id_tipo_preferencia]: pref.nome.toLowerCase().includes('temperatura')
                  ? parseFloat(value.toFixed(2))
                  : Math.round(value)
              }))
            }
            minimumTrackTintColor="#ff6e40"
            thumbTintColor="#ff6e40"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Preferences</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#ff6e40', textAlign: 'center', marginBottom: 25 },
  label: { color: '#d0d7de', fontWeight: '600', marginTop: 20, marginBottom: 8, fontSize: 16 },
  dropdown: { backgroundColor: '#e9ecf6', borderRadius: 25, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  dropdownText: { color: '#1e3c72', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#f9fafb', borderRadius: 15, padding: 20, width: '80%', maxHeight: '70%' },
  modalItem: { padding: 12, borderBottomWidth: 1, borderColor: '#ccc' },
  modalItemText: { color: '#1e3c72', fontSize: 16 },
  cancelText: { marginTop: 10, color: '#cc5630', fontWeight: '700', textAlign: 'center' },
  slider: { width: '100%', height: 40 },
  button: {
    backgroundColor: '#1e3c72',
    borderRadius: 50,
    padding: 14,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: { color: '#ff6e40', fontWeight: '700', fontSize: 16 },
});
