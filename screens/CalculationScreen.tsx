import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';

const { width, height } = Dimensions.get('window');

const HEADER_HEIGHT = 10;
const TAB_HEIGHT = 100;

const CalculationScreen: React.FC = () => {
  const [inputValue1, setInputValue1] = useState<string>('');
  const [inputValue2, setInputValue2] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateInput = (value: string) => {
    return /^\d*\.?\d*$/.test(value);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    if (validateInput(value)) {
      setter(value);
      setError(null);
    } else {
      setError('Please enter valid numbers');
    }
  };

  const calculateFormula = () => {
    const value1 = parseFloat(inputValue1);
    const value2 = parseFloat(inputValue2);
    if (!isNaN(value1) && !isNaN(value2)) {
      const P = 2 * value1 * value2;
      const B = P / 1000;
      const NS = 1 - B;
      setResult(NS);
      setError(null);
    } else {
      setError('Please enter valid numbers');
      setResult(null);
    }
  };

  const clearInputs = () => {
    setInputValue1('');
    setInputValue2('');
    setResult(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.calculationSection}>
          <Text style={styles.title}>Formula</Text>
          <View style={styles.formulaContainer}>
            <Text style={styles.formulaText}>P = 2 × </Text>
            <TextInput
              style={styles.input}
              onChangeText={handleInputChange(setInputValue1)}
              value={inputValue1}
              keyboardType="numeric"
              placeholder="Value 1"
              placeholderTextColor="#999"
            />
            <Text style={styles.formulaText}> × </Text>
            <TextInput
              style={styles.input}
              onChangeText={handleInputChange(setInputValue2)}
              value={inputValue2}
              keyboardType="numeric"
              placeholder="Value 2"
              placeholderTextColor="#999"
            />
          </View>
          <Text style={styles.formula}>B = P / 1000</Text>
          <Text style={styles.formula}>NS = 1 - B</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={calculateFormula}>
              <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={clearInputs}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {result !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultValue}>NS = {result.toFixed(4)}</Text>
            </View>
          )}
        </View>
        {/* <View style={styles.zStrokeSection}>
          <Text style={styles.zStrokeText}>Z-Stroke</Text>
          Z-stroke content will be added here in the future 
        </View> */}
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1c2130',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: HEADER_HEIGHT,
    paddingBottom: TAB_HEIGHT,
  },
  calculationSection: {
    height: (height - HEADER_HEIGHT - TAB_HEIGHT) / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f3a',
  },
  zStrokeSection: {
    height: (height - HEADER_HEIGHT - TAB_HEIGHT) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  formulaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
  },
  formulaText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  formula: {
    fontSize: 23,
    color: '#FFFFFF',
    marginBottom: 5,
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  input: {
    width: width * 0.2,
    height: 36,
    borderWidth: 2,
    borderColor: '#FFA500',
    borderRadius: 18,
    padding: 8,
    marginHorizontal: 5,
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '45%',
  },
  buttonText: {
    color: '#1c2130',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'georgia',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 10,
    alignItems: 'center',
    fontStyle: 'italic',
    backgroundColor: 'rgba(0, 123, 123, 0.1)',
    padding: 20,
    width: '100%',
  },
  resultValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  zStrokeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'georgia',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
});

export default CalculationScreen;