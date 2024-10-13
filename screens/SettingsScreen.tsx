import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

const SettingsScreen = () => {
  const [averageCount, setAverageCount] = useState('5');

  const handleSave = () => {
    // Here you would typically save this value to your app's state or storage
    console.log('Average count set to:', averageCount);
    // You might want to use a state management solution like Redux or Context API to make this value available across your app
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Number of values to average:</Text>
      <TextInput
        style={styles.input}
        value={averageCount}
        onChangeText={setAverageCount}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1c2130',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1c2130',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;