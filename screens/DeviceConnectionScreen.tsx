import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import BluetoothManager from './BluetoothManager';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

const DeviceConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchPairedDevices();

    BluetoothManager.onDevicesFound((devices) => {
      const paired = devices.filter(device => device.bonded);
      const available = devices.filter(device => !device.bonded);
      setPairedDevices(paired);
      setAvailableDevices(available);
      setScanning(false);
    });

    BluetoothManager.onConnectionChange((connected) => {
      if (connected) {
        navigation.navigate('DataTabs');
      }
    });
  }, [navigation]);

  const fetchPairedDevices = async () => {
    try {
      const paired = await BluetoothManager.getPairedDevices();
      setPairedDevices(paired || []);
    } catch (error) {
      console.error('Error fetching paired devices:', error);
      Alert.alert('Error', 'Failed to fetch paired devices. Please try again.');
    }
  };

  const scanForDevices = async () => {
    setScanning(true);
    setAvailableDevices([]);
    try {
      await BluetoothManager.startDeviceDiscovery();
    } catch (error) {
      console.error('Error scanning for devices:', error);
      setScanning(false);
      Alert.alert('Error', 'Failed to scan for devices. Please try again.');
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // Check if the device is already paired
      if (!device.bonded) {
        // If not paired, initiate the pairing process
        const paired = await BluetoothManager.pairDevice(device);
        if (!paired) {
          throw new Error('Failed to pair with the device');
        }
      }

      // Now attempt to connect
      await BluetoothManager.connectToDevice(device);
      // If connection is successful, you might want to navigate to the data screen
      navigation.navigate('DataTabs');
    } catch (error) {
      console.error('Error connecting to device:', error);
      let errorMessage = 'Failed to connect to the device. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Already attempting')) {
          errorMessage = 'Already attempting to connect to this device. Please wait.';
        } else if (error.message.includes('Connection timeout')) {
          errorMessage = 'Connection attempt timed out. The device might be out of range.';
        } else if (error.message.includes('out of range or turned off')) {
          errorMessage = 'Connection failed. The device might be out of range or turned off.';
        } else if (error.message.includes('Failed to pair')) {
          errorMessage = 'Failed to pair with the device. Please try again or check your device settings.';
        }
      } else {
        errorMessage = 'An unknown error occurred';
      }
      
      Alert.alert('Connection Error', errorMessage);
    }
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceInfo}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>
      
      {/* <Text style={styles.sectionTitle}>Paired Devices</Text> */}
      <FlatList
        data={pairedDevices}
        keyExtractor={(item) => `paired-${item.address}`}
        renderItem={renderDeviceItem}
        ListEmptyComponent={<Text style={styles.emptyListText}>No paired devices</Text>}
      />
      
      <TouchableOpacity
        onPress={scanForDevices}
        style={[styles.scanButton, scanning && styles.disabledButton]}
        disabled={scanning}
      >
        <Text style={styles.scanButtonText}>
          {scanning ? 'Scanning...' : 'SCAN FOR AVAILABLE DEVICES'}
        </Text>
      </TouchableOpacity>
      
      {scanning && <ActivityIndicator size="large" color="#FFA500" />}
      
      {availableDevices.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          <FlatList
            data={availableDevices}
            keyExtractor={(item) => `available-${item.address}`}
            renderItem={renderDeviceItem}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1c2130',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  scanButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
    marginVertical: 20,
  },
  scanButtonText: {
    color: '#1c2130',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#808080',
  },
  deviceItem: {
    backgroundColor: '#2a3040',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  deviceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceInfo: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  emptyListText: {
    color: '#808080',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default DeviceConnectionScreen;