import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryLegend } from 'victory-native';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  DataDisplay: { sensorType: SensorType };
};

type SensorType = 'Gyroscope' | 'Accelerometer';
type SensorData = {
  x: number;
  y: number;
  z: number;
};

const Stack = createStackNavigator<RootStackParamList>();
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const MAX_DATA_POINTS = 100; // More data points for smoother graphs

const generateRandomMPU6050Data = (dataType: SensorType): SensorData => {
  const randomValue = (min: number, max: number) => 
    Number((Math.random() * (max - min) + min).toFixed(3));

  switch (dataType) {
    case 'Accelerometer':
      return {
        x: randomValue(-1, 1),
        y: randomValue(-1, 1),
        z: randomValue(-1, 1),
      };
    case 'Gyroscope':
      return {
        x: randomValue(-125, 125),
        y: randomValue(-125, 125),
        z: randomValue(-125, 125),
      };
  }
};

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const sensors: SensorType[] = ['Gyroscope', 'Accelerometer'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Sensor Type</Text>
      <FlatList
        data={sensors}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('DataDisplay', { sensorType: item })}
          >
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const DataDisplayScreen: React.FC<{ route: { params: { sensorType: SensorType } } }> = ({ route }) => {
  const { sensorType } = route.params;
  const [sensorData, setSensorData] = useState<SensorData>(generateRandomMPU6050Data(sensorType));
  const [dataHistory, setDataHistory] = useState<{ x: number[], y: number[], z: number[] }>({
    x: [], y: [], z: []
  });

  const updateData = useCallback(() => {
    const newData = generateRandomMPU6050Data(sensorType);
    setSensorData(newData);

    setDataHistory(prev => ({
      x: [...prev.x, newData.x].slice(-MAX_DATA_POINTS),
      y: [...prev.y, newData.y].slice(-MAX_DATA_POINTS),
      z: [...prev.z, newData.z].slice(-MAX_DATA_POINTS),
    }));
  }, [sensorType]);

  useEffect(() => {
    const interval = setInterval(updateData, 100); // Fast refresh rate for smoother graph
    return () => clearInterval(interval);
  }, [updateData]);

  const renderChart = (data: number[], color: string, label: string) => (
    <View style={styles.chartContainer}>
      <Text style={[styles.axisLabel, { color }]}>{label} Axis</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        width={screenWidth}
        height={screenHeight * 0.25}
        padding={{ top: 10, bottom: 20, left: 40, right: 10 }}
        domain={{ y: sensorType === 'Accelerometer' ? [-1, 1] : [-125, 125] }}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => t.toFixed(1)}
          style={{
            axis: {stroke: color},
            tickLabels: {fill: color, fontSize: 10},
          }}
        />
        <VictoryAxis
          style={{
            axis: {stroke: "transparent"},
            ticks: {stroke: "transparent"},
            tickLabels: {fill: "transparent"},
          }}
        />
        <VictoryLine
          data={data.map((y, index) => ({ x: index, y }))}
          style={{
            data: { stroke: color, strokeWidth: 2 },
          }}
          interpolation="natural"  // Smooth the graph
        />
        <VictoryLegend
          x={screenWidth * 0.3}
          y={10}
          orientation="horizontal"
          gutter={20}
          data={[
            { name: `Value: ${sensorData.x}`, symbol: { fill: "#ff0000" } },
          ]}
        />
      </VictoryChart>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sensorType} Data</Text>
      {renderChart(dataHistory.x, '#ff0000', 'X')}
      {renderChart(dataHistory.y, '#00ff00', 'Y')}
      {renderChart(dataHistory.z, '#0000ff', 'Z')}
    </View>
  );
};

const App: React.FC = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="DataDisplay" 
          component={DataDisplayScreen}
          options={({ route }) => ({ 
            title: `${route.params.sensorType} Data`
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  chartContainer: {
    width: '100%',
    height: screenHeight * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  axisLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    top: 5,
    left: 10,
  },
});

export default App;
