import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BluSenseX</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c2130', // Dark blue-gray
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#efefef',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width : -1, height: 1 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
});

export default SplashScreen;