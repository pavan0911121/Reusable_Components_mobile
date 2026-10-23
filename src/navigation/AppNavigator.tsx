
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';

// Import screens
import {LoginScreen, RegisterScreen
} from '../screens';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import { ActivityIndicator, Text, View } from 'react-native';
import SideMenu from '../components/SideMenu';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();



function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
      />

    </AuthStack.Navigator>
  );
}

interface AppNavigatorProps {
  isUserLoggedIn: boolean;
}

function RootNavigator({ isUserLoggedIn }: AppNavigatorProps) {
  let content = <ActivityIndicator size="large" color="#007AFF" />;
  if (!isUserLoggedIn) {
    content = <AuthNavigator />;
  }
  // else if (isUserLoggedIn) {
  //   content = <SideMenu />;
  // }

  return (
    <NavigationContainer key={String(isUserLoggedIn)}>
      {content}
    </NavigationContainer>
  );
}

export default RootNavigator;