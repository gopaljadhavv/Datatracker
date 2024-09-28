import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigation) {
        navigation.replace('DeviceConnection');
      } else {
        console.error('Navigation prop is undefined in SplashScreen');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BluSenseX</Text>
      <ActivityIndicator size="large" color="#FFA500" style={styles.loader} />
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c2130',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#efefef',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    letterSpacing: 2,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    color: '#efefef',
    fontSize: 14,
  },
});

export default SplashScreen;