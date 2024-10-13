import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Splash: undefined;
  DeviceConnection: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    console.log('SplashScreen useEffect triggered');
    const timer = setTimeout(() => {
      navigation.replace('DeviceConnection');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mould Oscillation</Text>
      <ActivityIndicator size="large" color="#FFA500" style={styles.loader} />
      <View style={styles.versionContainer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        {/* <Text style={styles.version}>INNOVORTEX TECHNOLOGIES LLP</Text> */}
      </View>
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
    fontSize: 40,
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
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  version: {
    color: '#ffffff',
    fontSize: 14,
    marginVertical: 2,
  },
});

export default SplashScreen;
