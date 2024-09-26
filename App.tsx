import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SplashScreen from './screens/SplashScreen';
import DeviceConnectionScreen from './screens/DeviceConnectionScreen';
import DataDisplayScreen from './screens/DataDisplayScreen';
import BluetoothManager from './screens/BluetoothManager';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DataTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarStyle: { backgroundColor: '#1c2130' },
      tabBarActiveTintColor: '#FFA500', 
      tabBarInactiveTintColor: '#808080',
      headerStyle: { backgroundColor: '#1c2130' }, 
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontSize: 23, },
      tabBarLabelStyle: { fontSize: 12 , fontWeight: 'bold'},
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Gyroscope') {
          iconName = focused ? 'rotate-3d' : 'rotate-3d-variant';
        } else if (route.name === 'Accelerometer') {
          iconName = focused ? 'speedometer' : 'speedometer-medium';
        } else if (route.name === 'Temperature') {
          iconName = focused ? 'thermometer' : 'thermometer-lines';
        }
        return <MaterialCommunityIcons name={iconName || 'alert'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen 
      name="Gyroscope" 
      component={GyroscopeScreen}
      options={{ title: 'Gyroscope' }}
    />
    <Tab.Screen 
      name="Accelerometer" 
      component={AccelerometerScreen}
      options={{ title: 'Accelerometer' }}
    />
    <Tab.Screen 
      name="Temperature" 
      component={TemperatureScreen}
      options={{ title: 'Temperature' }}
    />
  </Tab.Navigator>
);

const GyroscopeScreen = () => <DataDisplayScreen sensorType="Gyroscope" />;
const AccelerometerScreen = () => <DataDisplayScreen sensorType="Accelerometer" />;
const TemperatureScreen = () => <DataDisplayScreen sensorType="Temperature" />;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await BluetoothManager.initialize();
        setIsBluetoothReady(true);
      } catch (error) {
        console.error('Failed to initialize Bluetooth:', error);
        Alert.alert(
          'Bluetooth Error',
          'Failed to initialize Bluetooth. Please ensure Bluetooth is enabled and try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeApp, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#F0F0F0' }  
          }}
        >
          <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} />
          <Stack.Screen name="DataTabs" component={DataTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;