import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/Screens/LoginScreen';
import SignupScreen from '@/Screens/SignUpScreen';
import ForgotPasswordScreen from '@/Screens/ForgotPasswordScreen';
import VerifyCodeScreen from '@/Screens/VerifyCodeScreen';
import ResetPasswordScreen from '@/Screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar Código' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Redefinir Senha' }} />
    </Stack.Navigator>
  );
}