import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import {Platform, PermissionsAndroid} from 'react-native';

class BluetoothManager {
  private connectionTimeout: number = 10000; // Default timeout in milliseconds
  private onDevicesFoundCallback:
    | ((devices: BluetoothDevice[]) => void)
    | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null =
    null;
  private selectedDevice: BluetoothDevice | null = null;
  private isDiscovering: boolean = false;
  private isConnecting: boolean = false;

  async initialize() {
    await this.checkBluetoothEnabled();
    await this.requestPermissions();
  }

  private async checkBluetoothEnabled() {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
      }
    } catch (error) {
      console.error(
        'Bluetooth Classic is not available on this device:',
        error,
      );
      throw new Error('Bluetooth Classic is not available on this device.');
    }
  }

  private async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );
      } catch (err) {
        console.warn('Failed to obtain Bluetooth permissions:', err);
        throw new Error('Failed to obtain Bluetooth permissions.');
      }
    }
    return true;
  }

  async startDeviceDiscovery() {
    if (this.isDiscovering) {
      throw new Error('Device discovery already in progress');
    }

    this.isDiscovering = true;

    try {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();
      const discoveredDevices = await RNBluetoothClassic.startDiscovery();

      const allDevices = [
        ...(pairedDevices || []),
        ...(discoveredDevices || []),
      ];

      if (this.onDevicesFoundCallback) {
        this.onDevicesFoundCallback(allDevices);
      }

      return allDevices;
    } catch (error) {
      console.error('Error during device discovery:', error);
      throw new Error('An error occurred during device discovery');
    } finally {
      this.isDiscovering = false;
    }
  }

  async connectToDevice(device: BluetoothDevice) {
    if (this.isConnecting) {
      throw new Error('Already attempting to connect to a device');
    }

    this.isConnecting = true;

    try {
      const connected = await Promise.race([
        device.connect({
          connectorType: 'rfcomm',
          DELIMITER: '\n',
          DEVICE_CHARSET: Platform.OS === 'ios' ? 1536 : 'utf-8',
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.connectionTimeout,
          ),
        ),
      ]);

      if (connected) {
        console.log('Successfully connected to device');
        this.onConnectionChangeCallback?.(true);
        return true;
      } else {
        throw new Error('Failed to connect to the device');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      if (error instanceof Error) {
        if (error.message.includes('Already attempting connection')) {
          throw new Error('Already attempting to connect to this device');
        } else if (error.message.includes('Connection timeout')) {
          throw new Error('Connection attempt timed out');
        } else if (
          error instanceof
          kjd.reactnative.bluetooth.conn.ConnectionFailedException
        ) {
          throw new Error(
            'Connection failed. The device might be out of range or turned off',
          );
        } else {
          throw new Error('Failed to connect to the device');
        }
      } else {
        throw new Error('Failed to connect to the device');
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private monitorData(device: BluetoothDevice) {
    device.onDataReceived(({data}) => {
      // Parse and handle the received data here
      console.log('Data received:', data);
      // You can implement data parsing and update your state here
    });
  }

  async disconnect() {
    if (this.selectedDevice) {
      try {
        await this.selectedDevice.disconnect();
        this.selectedDevice = null;
        this.onConnectionChangeCallback?.(false);
      } catch (error) {
        console.error('Error disconnecting:', error);
        throw new Error('Failed to disconnect from the device.');
      }
    }
  }

  onDevicesFound(callback: (devices: BluetoothDevice[]) => void) {
    this.onDevicesFoundCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      return await RNBluetoothClassic.getBondedDevices();
    } catch (error) {
      console.error('Error getting paired devices:', error);
      throw new Error('Failed to get paired devices.');
    }
  }

  async pairDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // For Android, we need to use the createBond method
        return await (RNBluetoothClassic as any).createBond(device.address);
      } else {
        // For iOS, pairing is typically handled by the OS
        // We'll assume it's already paired if we can see it
        return true;
      }
    } catch (error) {
      console.error('Error pairing device:', error);
      throw new Error('Failed to pair with the device');
    }
  }
}

export default new BluetoothManager();
