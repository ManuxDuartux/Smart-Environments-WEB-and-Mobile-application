// App.js (Mobile)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserRegisterScreen from './src/screens/UserRegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Register" component={UserRegisterScreen} options={{ title: 'Registo' }} />
        <Stack.Screen name="Login" component={LoginScreen} /> 
        <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: 'Preferências' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
