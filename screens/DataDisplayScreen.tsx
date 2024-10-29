import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import Svg, {Path, Line, G} from 'react-native-svg';
import {useSensorData} from './SensorContext';

type SensorType = 'Gyroscope' | 'Accelerometer' | 'Temperature';

const PLOT_POINTS = 50;
const {width, height} = Dimensions.get('window');
const TAB_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const CHART_MARGIN = 0;
const AVAILABLE_HEIGHT = height - TAB_HEIGHT - HEADER_HEIGHT;
const CHART_HEIGHT = AVAILABLE_HEIGHT / 3 - CHART_MARGIN * 2;
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
  const [height, setHeight] = useState<number>(0);
  const [displacement, setDisplacement] = useState<number>(0);

  const relevantData = useMemo(() => {
    return sensorType === 'Temperature'
      ? [sensorData.temp, sensorData.temp, sensorData.temp]
      : sensorType === 'Gyroscope'
      ? [sensorData.gyro.x, sensorData.gyro.y, sensorData.gyro.z]
      : [sensorData.accel.x, sensorData.accel.y, sensorData.accel.z];
  }, [sensorData, sensorType]);

  const updateDataPoints = useCallback((newData: number[]) => {
    setDataPoints(prevData =>
      prevData.map((axis, index) => {
        const newAxis = [...axis, newData[index]];
        return newAxis.slice(-PLOT_POINTS);
      }),
    );
  }, []);

  const updateDataRange = useCallback((newData: number[]) => {
    const maxAbsValue = Math.max(...newData.map(Math.abs));
    setDataRange(prevRange => {
      const [, prevMax] = prevRange;
      if (maxAbsValue > prevMax) {
        const newMax = Math.ceil(maxAbsValue * 1.2);
        return [-newMax, newMax];
      } else if (maxAbsValue < prevMax / 2 && prevMax > 1) {
        const newMax = Math.max(Math.ceil(maxAbsValue * 2), 1);
        return [-newMax, newMax];
      }
      return prevRange;
    });
  }, []);

  useEffect(() => {
    updateDataPoints(relevantData);
    updateDataRange(relevantData);
  }, [relevantData, updateDataPoints, updateDataRange]);

  useEffect(() => {
    setDisplacement(sensorData.zStroke - height);
  }, [sensorData.zStroke, height]);


  const getUnitLabel = (): string => {
    switch (sensorType) {
      case 'Gyroscope':
        return 'rad';
      case 'Accelerometer':
        return 'm/s²';
      case 'Temperature':
        return '°C';
      default:
        return '';
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
            y1={(CHART_HEIGHT / horizontalLines) * i}
            x2={CHART_WIDTH}
            y2={(CHART_HEIGHT / horizontalLines) * i}
            stroke={GRID_COLOR}
            strokeWidth="0.5"
          />
        ))}
        {[...Array(verticalLines)].map((_, i) => (
          <Line
            key={`v${i}`}
            x1={(CHART_WIDTH / verticalLines) * i}
            y1="0"
            x2={(CHART_WIDTH / verticalLines) * i}
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

  const renderChart = useCallback(
    (data: number[], label: string) => {
      const [minRange, maxRange] = dataRange;
      const range = maxRange - minRange;
      const currentValue =
        data.length > 0 ? data[data.length - 1].toFixed(2) : '0.00';

      const path = data.reduce((acc, point, index) => {
        const x = (index / (PLOT_POINTS - 1)) * CHART_WIDTH;
        const y =
          CHART_HEIGHT -
          CHART_PADDING_BOTTOM -
          ((point - minRange) / range) *
            (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM);
        const clampedY = Math.max(
          CHART_PADDING_TOP,
          Math.min(y, CHART_HEIGHT - CHART_PADDING_BOTTOM),
        );
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
              <Text
                style={
                  styles.valueText
                }>{`${currentValue} ${getUnitLabel()}`}</Text>
            </View>
          </View>
        </View>
      );
    },
    [dataRange, renderGrid, getUnitLabel],
  );

  const renderAllSensorData = useCallback(() => {
    const formatValue = (value: number): string => {
        if (value > 2 && Number.isInteger(value)) {
            return value.toFixed(0);
        }
        return value.toFixed(2);
    };

    const renderDataBlock = (
        title: string,
        data: Array<{ label: string; value: number; unit: string }>
    ) => (
        <View style={styles.dataBlock}>
            <Text style={styles.blockTitle}>{title}</Text>
            {data.map(({ label, value, unit }, index) => (
                <View key={`${label}-${index}`} style={styles.dataRow}>
                    <View style={styles.dataLabelValueContainer}>
                        <Text style={styles.dataLabel}>{label}:</Text>
                        <Text style={styles.dataValue}>{formatValue(value)}</Text>
                        <Text style={styles.dataUnit}>{unit}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.allSensorContainer}>
            {/* Angle Block */}
            {renderDataBlock('Angle', [
                { label: 'X', value: sensorData.gyro.x, unit: 'rad' },
                { label: 'Y', value: sensorData.gyro.y, unit: 'rad' },
                { label: 'Z', value: sensorData.gyro.z, unit: 'rad' },
            ])}

            {/* Speed and Tilt Block */}
            {renderDataBlock('Speed', [
                { label: 'X', value: sensorData.accel.x, unit: 'm/s²' },
                { label: 'X', value: sensorData.tilt.x, unit: 'mm' },
                { label: 'Y', value: sensorData.accel.y, unit: 'm/s²' },
                { label: 'Y', value: sensorData.tilt.y, unit: 'mm' },
                { label: 'Z', value: sensorData.accel.z, unit: 'm/s²' },
            ])}

            {/* Z Stroke Block */}
            <View style={styles.dataBlock}>
                <Text style={styles.blockTitle}>Z Stroke</Text>
                <View style={styles.dataRow}>
                    <View style={styles.dataLabelValueContainer}>
                        <Text style={styles.dataLabel}>Distance:</Text>
                        <Text style={styles.dataValue}>
                            {formatValue(sensorData.zStroke)}
                        </Text>
                        <Text style={styles.dataUnit}>mm</Text>
                    </View>
                </View>
                <View style={styles.dataRow}>
                    <View style={styles.dataLabelValueContainer}>
                        <Text style={styles.dataLabel}>Set Height:</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={height.toString()}
                            onChangeText={(text) => setHeight(Number(text))}
                            placeholder="Enter height in mm"
                            placeholderTextColor="#AAAAAA"
                        />
                    </View>
                </View>
                <View style={styles.dataRow}>
                    <View style={styles.dataLabelValueContainer}>
                        <Text style={styles.dataLabel}>Displacement:</Text>
                        <Text style={styles.dataValue}>
                            {formatValue(displacement)}
                        </Text>
                        <Text style={styles.dataUnit}>mm</Text>
                    </View>
                </View>
            </View>

            {/* Temperature Block */}
            <View style={styles.dataBlock}>
                <Text style={styles.blockTitle}>Temperature</Text>
                <View style={styles.dataRow}>
                    <View style={styles.dataLabelValueContainer}>
                        <Text style={styles.dataLabel}>Temperature:</Text>
                        <Text style={styles.dataValue}>{formatValue(sensorData.temp)}</Text>
                        <Text style={styles.dataUnit}>°C</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}, [sensorData, height, displacement]);

  return (
    <SafeAreaView style={styles.container}>
      {sensorType === 'Temperature' ? (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {renderAllSensorData()}
        </ScrollView>
      ) : (
        <View style={styles.chartsContainer}>
          {renderChart(dataPoints[0], 'X')}
          {renderChart(dataPoints[1], 'Y')}
          {renderChart(dataPoints[2], 'Z')}
        </View>
      )}
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
    top: 9,
    left: 10,
  },
  valueContainer: {
    position: 'absolute',
    top: 9,
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
  scrollViewContent: {
    flexGrow: 1,
  },
  allSensorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dataBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 7,
    width: '90%', // Adjust width for better centering
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: 7,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the data row
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  dataLabelValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center', // Center the label and value
    width: '100%',
    paddingLeft: 10,
  },
  dataLabel: {
    fontSize: 18,
    color: TEXT_COLOR,
    marginRight: 10,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginRight: 5,
  },
  dataUnit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginRight: 5,
  },
  input: {
    width: '40%', // Make it responsive and match other fields
    height: 35, // Set a comfortable height to match other fields
    borderWidth: 1, // Optional: Add a border if other fields have borders
    borderColor: ACCENT_COLOR, // Match the border color with other fields
    borderRadius: 5,
    paddingHorizontal: 10, // Add padding for better text placement
    marginTop: -3, // Space above the input
    marginBottom: -3, // Space below the input
    color: '#FFFFFF', // Text color to match other fields
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent background
    fontSize: 14, // Increase font size for better readability
  },
});

export default React.memo(DataDisplayScreen);