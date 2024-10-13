import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SectionList } from 'react-native';
import BluetoothManager from './BluetoothManager';
import { BluetoothDevice } from 'react-native-bluetooth-classic';


const { width, height } = Dimensions.get('window');

const DeviceConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // console.log('DeviceConnectionScreen useEffect triggered');
    fetchPairedDevices();

    BluetoothManager.onDevicesFound((newDevices) => {
      const paired = newDevices.filter(device => device.bonded);
      const available = newDevices.filter(device => !device.bonded);
      setPairedDevices(prevDevices => [...new Set([...prevDevices, ...paired])]);
      setAvailableDevices(prevDevices => [...new Set([...prevDevices, ...available])]);
      setScanning(false);
    });

    BluetoothManager.onConnectionChange((connected) => {
      if (connected) {
        navigation.navigate('DataTabs');
      } else {
        Alert.alert(
          'Connection Lost',
          'The connection to the device was lost.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset the screen state
                setPairedDevices([]);
                setAvailableDevices([]);
                setScanning(false);
                fetchPairedDevices();
                // Navigate back to DeviceConnection screen if connection is lost
                navigation.replace('DeviceConnection');
              },
            },
          ]
        );
      }
    });

    return () => {
      // Clean up on component unmount
      BluetoothManager.disconnect();
    };
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
      await BluetoothManager.connectToDevice(device);
    } catch (error) {
      console.error('Error connecting to device:', error);
      let errorMessage = 'Failed to connect to the device. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('read failed') || error.message.includes('socket might closed')) {
          errorMessage = 'Connection lost. The device might be out of range or turned off. Please ensure the device is nearby and powered on, then try again.';
        } else if (error.message.includes('Already attempting to connect')) {
          errorMessage = 'A connection attempt is already in progress. Please wait a moment before trying again.';
        } else {
          errorMessage = error.message;
        }
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

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionHeaderLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const sections = [
    { title: 'Paired Devices', data: pairedDevices },
    ...(availableDevices.length > 0 ? [{ title: 'Available Devices', data: availableDevices }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        
        <TouchableOpacity
          onPress={scanForDevices}
          style={[styles.scanButton, scanning && styles.disabledButton]}
          disabled={scanning}
        >
          <Text style={styles.scanButtonText}>
            {scanning ? 'Scanning...' : 'SCAN FOR DEVICES'}
          </Text>
        </TouchableOpacity>
        
        {scanning && <ActivityIndicator size="large" color="#FFA500" />}
        
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.address}-${index}`}
          renderItem={renderDeviceItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={<Text style={styles.emptyListText}>No devices found</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#1c2130',
    
    paddingBottom: 100,
  },
  contentContainer: {
    padding: 20,
    height:height,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
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
  sectionHeaderContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  sectionHeaderLine: {
    borderTopWidth: 2,
    borderTopColor: '#3d3d3d',
    marginLeft: -20,
    marginRight: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    // backgroundColor: '#2a3040',
    padding: 5,
    borderRadius: 5,
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
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DeviceConnectionScreen;