// import React, { useState, useEffect } from 'react';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import DataDisplayScreen from './screens/DataDisplayScreen';
// import SplashScreen from './screens/SplashScreen';

// type TabParamList = {
//   Gyroscope: undefined;
//   Accelerometer: undefined;
//   Temperature: undefined;
// };

// const Tab = createBottomTabNavigator<TabParamList>();

// const GyroscopeScreen = () => <DataDisplayScreen sensorType="Gyroscope" />;
// const AccelerometerScreen = () => <DataDisplayScreen sensorType="Accelerometer" />;
// const TemperatureScreen = () => <DataDisplayScreen sensorType="Temperature" />;

// const App: React.FC = () => {
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     setTimeout(() => {
//       setIsLoading(false);
//     }, 2000); // Show splash screen for 2 seconds
//   }, []);

//   if (isLoading) {
//     return <SplashScreen />;
//   }

//   return (
//     <SafeAreaProvider>
//       <NavigationContainer>
//         <Tab.Navigator
//           screenOptions={({ route }) => ({
//             tabBarStyle: { backgroundColor: '#001F3F' },
//             tabBarActiveTintColor: '#2475B0',  // Electric blue
//             tabBarInactiveTintColor: '#FFFFFF',
//             headerStyle: { backgroundColor: '#0047AB' },
//             headerTintColor: '#FFFFFF',
//             headerTitleStyle: { fontWeight: 'bold' },
//             tabBarIcon: ({ focused, color, size }) => {
//               let iconName;
//               if (route.name === 'Gyroscope') {
//                 iconName = focused ? 'rotate-3d' : 'rotate-3d-variant';
//               } else if (route.name === 'Accelerometer') {
//                 iconName = focused ? 'speedometer' : 'speedometer-medium';
//               } else if (route.name === 'Temperature') {
//                 iconName = focused ? 'thermometer' : 'thermometer-lines';
//               }
//               return <MaterialCommunityIcons name={iconName || 'alert'} size={size} color={color} />;
//             },
//           })}
//         >
//           <Tab.Screen 
//             name="Gyroscope" 
//             component={GyroscopeScreen}
//             options={{ title: 'Gyroscope' }}
//           />
//           <Tab.Screen 
//             name="Accelerometer" 
//             component={AccelerometerScreen}
//             options={{ title: 'Accelerometer' }}
//           />
//           <Tab.Screen 
//             name="Temperature" 
//             component={TemperatureScreen}
//             options={{ title: 'Temperature' }}
//           />
//         </Tab.Navigator>
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// };

// // export default App;
