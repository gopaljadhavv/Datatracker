import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Svg, { Path, Line, G } from 'react-native-svg';
import { useSensorData } from './SensorContext';

type SensorType = 'Gyroscope' | 'Accelerometer' | 'Temperature';

const PLOT_POINTS = 50;
const { width, height } = Dimensions.get('window');
const TAB_HEIGHT = 100; // Updated to match the tab bar height
const CHART_MARGIN = 0;
const AVAILABLE_HEIGHT = height - TAB_HEIGHT;
const CHART_HEIGHT = (AVAILABLE_HEIGHT / 3) - (CHART_MARGIN * 2);
const CHART_WIDTH = width;
const CHART_PADDING_TOP = 0;
const CHART_PADDING_BOTTOM = 0;

const ACCENT_COLOR = '#FFA500';  
const GRID_COLOR = '#3d3d3d';    
const BACKGROUND_COLOR = '#1c2130';
const TEXT_COLOR = '#FFFFFF';    
const ZERO_LINE_COLOR = '#5d5d5d';  
const LABEL_BG_COLOR = 'rgba(0, 255, 255, 0.1)'; 

const DataDisplayScreen: React.FC<{ sensorType: SensorType }> = ({ sensorType }) => {
  const { sensorData } = useSensorData();
  const [dataPoints, setDataPoints] = useState<number[][]>([[], [], []]);
  const [dataRange, setDataRange] = useState<[number, number]>([-1, 1]);

  useEffect(() => {
    const relevantData = sensorType === 'Temperature'
      ? [sensorData.temp, sensorData.temp, sensorData.temp]
      : (sensorType === 'Gyroscope' 
          ? [sensorData.gyro.x, sensorData.gyro.y, sensorData.gyro.z] 
          : [sensorData.accel.x, sensorData.accel.y, sensorData.accel.z]);

    setDataPoints(prevData => 
      prevData.map((axis, index) => {
        const newAxis = [...axis, relevantData[index]];
        return newAxis.slice(-PLOT_POINTS);
      })
    );

    // Dynamic range adjustment
    const maxAbsValue = Math.max(...relevantData.map(Math.abs));
    setDataRange(prevRange => {
      const [, prevMax] = prevRange;
      if (maxAbsValue > prevMax) {
        const newMax = Math.ceil(maxAbsValue * 1.2); // Add 20% buffer
        return [-newMax, newMax];
      } else if (maxAbsValue < prevMax / 2 && prevMax > 1) {
        const newMax = Math.max(Math.ceil(maxAbsValue * 2), 1); // Ensure minimum range of [-1, 1]
        return [-newMax, newMax];
      }
      return prevRange;
    });
  }, [sensorData, sensorType]);

  const getUnitLabel = (): string => {
    switch (sensorType) {
      case 'Gyroscope': return '°/s';
      case 'Accelerometer': return 'm/s²';
      case 'Temperature': return '°C';
      default: return '';
    }
  };

  const renderGrid = useMemo(() => {
    const horizontalLines = 5;
    const verticalLines = 10;
    const zeroY = CHART_HEIGHT / 2;

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
            strokeWidth="0.5"
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
            strokeWidth="0.5"
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
    const [minRange, maxRange] = dataRange;
    const range = maxRange - minRange;
    const currentValue = data.length > 0 ? data[data.length - 1].toFixed(2) : '0.00';

    const path = data.reduce((acc, point, index) => {
      const x = (index / (PLOT_POINTS - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - CHART_PADDING_BOTTOM - (((point - minRange) / range) * (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM));
      const clampedY = Math.max(CHART_PADDING_TOP, Math.min(y, CHART_HEIGHT - CHART_PADDING_BOTTOM));
      return `${acc} ${index === 0 ? 'M' : 'L'} ${x},${clampedY}`;
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
            <Text style={styles.valueText}>{`${currentValue} ${getUnitLabel()}`}</Text>
          </View>
        </View>
      </View>
    );
  }, [dataRange, renderGrid, getUnitLabel]);

  const renderTemperature = useCallback(() => {
    const currentTemp = dataPoints[0][0] || 0;
    
    return (
      <View style={styles.temperatureContainer}>
        <Text style={styles.temperatureLabel}>Temperature</Text>
        <Text style={styles.temperatureValue}>{`${currentTemp.toFixed(2)} ${getUnitLabel()}`}</Text>
      </View>
    );
  }, [dataPoints, getUnitLabel]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chartsContainer}>
        {sensorType === 'Temperature' ? (
          renderTemperature()
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
    marginVertical: CHART_MARGIN,
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
  unitToggle: {
    backgroundColor: ACCENT_COLOR,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  unitToggleText: {
    color: BACKGROUND_COLOR,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  temperatureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temperatureLabel: {
    color: TEXT_COLOR,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  temperatureValue: {
    color: TEXT_COLOR,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default React.memo(DataDisplayScreen);