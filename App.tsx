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
import CalculationScreen from './screens/CalculationScreen';
import { SensorProvider } from './screens/SensorContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DataTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarStyle: { height: 50, backgroundColor: '#1c2130', paddingBottom:1 },
      tabBarActiveTintColor: '#FFA500', 
      tabBarInactiveTintColor: '#808080',
      headerStyle: { backgroundColor: '#1c2130' }, 
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontSize: 23, },
      tabBarLabelStyle: { fontSize: 12 , fontWeight: 'bold'},
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Angle') {
          iconName = focused ? 'rotate-3d' : 'rotate-3d-variant';
        } else if (route.name === 'Speed') {
          iconName = focused ? 'speedometer' : 'speedometer-medium';
        } else if (route.name === 'All Sensors') {
          iconName = focused ? 'thermometer' : 'thermometer-lines';
        } else if (route.name === 'Calculation') {
          iconName = focused ? 'calculator' : 'calculator-variant';
        }
        return <MaterialCommunityIcons name={iconName || 'alert'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen 
      name="Angle" 
      component={AngleScreen}
      options={{ title: 'Angle' }}
    />
    <Tab.Screen 
      name="Speed" 
      component={SpeedScreen}
      options={{ title: 'Speed' }}
    />
    <Tab.Screen 
      name="All Sensors" 
      component={AllSensorsScreen}
      options={{ title: 'All Sensors' }}
    />
    <Tab.Screen 
      name="Calculation" 
      component={CalculationScreen}
      options={{ title: 'Calculation' }}
    />
  </Tab.Navigator>
);

const AngleScreen = () => <DataDisplayScreen sensorType="Gyroscope" />;
const SpeedScreen = () => <DataDisplayScreen sensorType="Accelerometer" />;
const AllSensorsScreen = () => <DataDisplayScreen sensorType="Temperature" />;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash'); // State to manage initial route

  useEffect(() => {
    const initializeApp = async () => {
      const startTime = Date.now();
      try {
        await BluetoothManager.initialize();
        setIsBluetoothReady(true);
        setInitialRoute('DeviceConnection');
      } catch (error) {
        console.error('Failed to initialize Bluetooth:', error);
        Alert.alert(
          'Bluetooth Error',
          'Failed to initialize Bluetooth. Please ensure Bluetooth is enabled and try again.'
        );
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(2000 - elapsedTime, 0);
        setTimeout(() => setIsLoading(false), remainingTime);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <SensorProvider>
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#F0F0F0' }  
            }}
          >
            {isLoading ? (
              <Stack.Screen name="Splash" component={SplashScreen} />
            ) : (
              <>
                <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} />
                <Stack.Screen name="DataTabs" component={DataTabs} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SensorProvider>
    </SafeAreaProvider>
  );
};

export default App;
