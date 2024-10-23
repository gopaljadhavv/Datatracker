import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import {Platform, PermissionsAndroid} from 'react-native';

class BluetoothManager {
  private onDevicesFoundCallback:
    | ((devices: BluetoothDevice[]) => void)
    | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null =
    null;
  private selectedDevice: BluetoothDevice | null = null;
  private isDiscovering: boolean = false;
  private isConnecting: boolean = false;
  private onDataReceivedCallback: ((data: any) => void) | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  async initialize() {
    try {
      await this.checkBluetoothEnabled();
      await this.requestPermissions();
    } catch (error) {
      console.error('Bluetooth initialization failed:', error);
      throw new Error(
        'Bluetooth is not available or permissions were not granted.',
      );
    }
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
      throw new Error('Device discovery r in progress');
    }

    this.isDiscovering = true;

    try {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();
      const discoveredDevices = await RNBluetoothClassic.startDiscovery();

      const allDevices = [
        ...(pairedDevices || []),
        ...(discoveredDevices || []),
      ];

      // Filter out duplicate devices based on their address
      const uniqueDevices = Array.from(new Map(allDevices.map(device => [device.address, device])).values());

      this.onDevicesFoundCallback?.(uniqueDevices);

      return uniqueDevices;
    } catch (error) {
      console.error('Error during device discovery:', error);
      throw new Error('An error occurred during device discovery');
    } finally {
      this.isDiscovering = false;
    }
  }

  async connectToDevice(device: BluetoothDevice) {
    if (this.isConnecting) {
      throw new Error(
        'A connection attempt is already in progress. Please wait or try again in sometime.',
      );
    }

    this.isConnecting = true;

    try {
      let connected = false;
      if (device.bonded) {
        // For paired devices, attempt to connect directly
        connected = await this.attemptConnection(device);
      } else {
        // For unpaired devices, attempt to pair first
        const paired = await this.pairDevice(device);
        if (paired) {
          connected = await this.attemptConnection(device);
        }
      }

      if (connected) {
        console.log('Successfully connected to device');
        this.selectedDevice = device;
        this.monitorData(device);
        this.startConnectionMonitoring();
        this.onConnectionChangeCallback?.(true);
        return true;
      } else {
        throw new Error('Failed to connect to the device');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to connect to the device');
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async attemptConnection(device: BluetoothDevice): Promise<boolean> {
    return await Promise.race([
      device.connect({
        connectorType: 'rfcomm',
        DELIMITER: '\n',
        DEVICE_CHARSET: Platform.OS === 'ios' ? 1536 : 'utf-8',
      }),
      new Promise<boolean>((_, reject) =>
        setTimeout(
          () => reject(new Error('Connection timeout')),
          5000, // 30 seconds timeout
        ),
      ),
    ]);
  }

  private parseData(data: string) {
    // console.log('Parsing data:', data);

    const matches = data.match(
      /\$gyroX:([-+]?\d*\.?\d+),gyroY:([-+]?\d*\.?\d+),gyroZ:([-+]?\d*\.?\d+),accX:([-+]?\d*\.?\d+),accY:([-+]?\d*\.?\d+),accZ:([-+]?\d*\.?\d+),tiltX\(degree\):([-+]?\d*\.?\d+),tiltY\(degree\):([-+]?\d*\.?\d+),zStroke\(m\):([-+]?\d*\.?\d+),temperature:([-+]?\d*\.?\d+)&/,
    );

    if (matches) {
      const parsedData = {
        gyro: {
          x: parseFloat(matches[1]),
          y: parseFloat(matches[2]),
          z: parseFloat(matches[3]),
        },
        accel: {
          x: parseFloat(matches[4]),
          y: parseFloat(matches[5]),
          z: parseFloat(matches[6]),
        },
        tilt: {
          x: parseFloat(matches[7]),
          y: parseFloat(matches[8]),
        },
        zStroke: parseFloat(matches[9]),
        temp: parseFloat(matches[10]), // Correctly capturing temperature
      };

      this.onDataReceivedCallback?.(parsedData);
    } else {
      console.error('Unable to parse data:', data);
    }
  }

  private monitorData(device: BluetoothDevice) {
    device.onDataReceived(({data}) => {
      // console.log('Raw data received:', data.toString());
      this.parseData(data.toString());
    });
  }

  private startConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(async () => {
      if (this.selectedDevice) {
        try {
          const isConnected = await this.selectedDevice.isConnected();
          if (!isConnected) {
            this.handleConnectionLoss();
          }
        } catch (error) {
          console.error('Error checking connection status:', error);
          this.handleConnectionLoss();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private handleConnectionLoss() {
    console.log('Connection lost');
    this.selectedDevice = null;
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    this.onConnectionChangeCallback?.(false);
  }

  async disconnect() {
    if (this.selectedDevice) {
      try {
        await this.selectedDevice.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      } finally {
        this.selectedDevice = null;
        if (this.connectionCheckInterval) {
          clearInterval(this.connectionCheckInterval);
        }
        this.onConnectionChangeCallback?.(false);
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
        // For Android, we need to use the createBond method if available
        if ('createBond' in RNBluetoothClassic) {
          const bondState = await (RNBluetoothClassic as any).createBond(
            device.address,
          );
          console.log('Bond state after pairing attempt:', bondState);
          return bondState === 'bonded';
        } else {
          console.warn(
            'createBond method not available, assuming device is already paired',
          );
          return true;
        }
      } else {
        // For iOS, pairing is typically handled by the OS
        // We'll assume it's already paired if we can see it
        console.log('Skipping pairing step on iOS');
        return true;
      }
    } catch (error) {
      console.error('Error pairing device:', error);
      // Instead of throwing an error, we'll return false
      return false;
    }
  }

  onDataReceived(callback: (data: any) => void) {
    this.onDataReceivedCallback = callback;
  }
}

export default new BluetoothManager();
