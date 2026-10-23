import React from 'react';
import { View, StyleSheet, StatusBar, Image, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
     <Text>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo:{
    width: 100,
    height: 100,
    resizeMode: 'contain',
  }
});
