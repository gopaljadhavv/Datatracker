import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Svg, { Path, Line, G } from 'react-native-svg';
import Simulator from './Simulator';

type SensorType = 'Gyroscope' | 'Accelerometer' | 'Temperature';

const PLOT_POINTS = 50;
const { width, height } = Dimensions.get('window');
const TAB_HEIGHT = 105;
const CHART_HEIGHT = (height - TAB_HEIGHT) / 3;
const CHART_WIDTH = width;

const ACCENT_COLOR = '#FFA500';  
const GRID_COLOR = '#3d3d3d';    
const BACKGROUND_COLOR = '#1c2130';
const TEXT_COLOR = '#FFFFFF';    
const ZERO_LINE_COLOR = '#5d5d5d';  
const LABEL_BG_COLOR = 'rgba(0, 255, 255, 0.1)'; 

const getDataRange = (sensorType: SensorType): [number, number] => {
  switch (sensorType) {
    case 'Gyroscope': return [-250, 250];
    case 'Accelerometer': return [-2, 2];
    case 'Temperature': return [20, 30];
    default: return [-1, 1];
  }
};

const DataDisplayScreen: React.FC<{ sensorType: SensorType }> = ({ sensorType }) => {
  const [dataPoints, setDataPoints] = useState<number[][]>([[], [], []]);

  const updateData = useCallback(() => {
    const newData = Simulator.getData();
    const relevantData = sensorType === 'Temperature'
      ? [newData.temp, newData.temp, newData.temp]
      : (sensorType === 'Gyroscope' ? [newData.gyro.x, newData.gyro.y, newData.gyro.z] : [newData.accel.x, newData.accel.y, newData.accel.z]);

    setDataPoints(prevData => 
      prevData.map((axis, index) => {
        const newAxis = [...axis, relevantData[index]];
        return newAxis.slice(-PLOT_POINTS);
      })
    );
  }, [sensorType]);

  useEffect(() => {
    const interval = setInterval(updateData, 100);
    return () => clearInterval(interval);
  }, [updateData]);

  const renderGrid = useMemo(() => {
    const horizontalLines = 5;
    const verticalLines = 10;
    const zeroY = CHART_HEIGHT / 2;  // Center the zero line

    return (
      <G>
        {[...Array(horizontalLines)].map((_, i) => (
          <Line
            key={`h${i}`}
            x1="0"
            y1={CHART_HEIGHT / horizontalLines * i}
            x2={CHART_WIDTH}
            y2={CHART_HEIGHT / horizontalLines * i}
            stroke={GRID_COLOR}
            strokeWidth="1"
          />
        ))}
        {[...Array(verticalLines)].map((_, i) => (
          <Line
            key={`v${i}`}
            x1={CHART_WIDTH / verticalLines * i}
            y1="0"
            x2={CHART_WIDTH / verticalLines * i}
            y2={CHART_HEIGHT}
            stroke={GRID_COLOR}
            strokeWidth="1"
          />
        ))}
        <Line
          x1="0"
          y1={zeroY}
          x2={CHART_WIDTH}
          y2={zeroY}
          stroke={ZERO_LINE_COLOR}
          strokeWidth="1"
        />
      </G>
    );
  }, []);

  const renderChart = useCallback((data: number[], label: string) => {
    const [minRange, maxRange] = getDataRange(sensorType);
    const range = maxRange - minRange;
    const currentValue = data.length > 0 ? data[data.length - 1].toFixed(2) : '0.00';

    const path = data.reduce((acc, point, index) => {
      const x = (index / (PLOT_POINTS - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((point - minRange) / range) * CHART_HEIGHT;
      return `${acc} ${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }, '');

    return (
      <View key={`chart-${label}`} style={styles.chartContainer}>
        <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
          {renderGrid}
          <Path d={path} stroke={ACCENT_COLOR} strokeWidth="2" fill="none" />
        </Svg>
        <View style={styles.labelContainer}>
          <View style={styles.labelBackground}>
            <Text style={styles.axisLabelText}>{label}</Text>
          </View>
        </View>
        <View style={styles.valueContainer}>
          <View style={styles.labelBackground}>
            <Text style={styles.valueText}>{currentValue}</Text>
          </View>
        </View>
      </View>
    );
  }, [sensorType, renderGrid]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chartsContainer}>
        {sensorType === 'Temperature' ? (
          renderChart(dataPoints[0], 'T')
        ) : (
          <>
            {renderChart(dataPoints[0], 'X')}
            {renderChart(dataPoints[1], 'Y')}
            {renderChart(dataPoints[2], 'Z')}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  chartsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: TAB_HEIGHT,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
  },
  labelContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  valueContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  labelBackground: {
    backgroundColor: LABEL_BG_COLOR,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  axisLabelText: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
  valueText: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default React.memo(DataDisplayScreen);