import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import BleManager from 'react-native-ble-manager';
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
      BleManager.start({ showAlert: false });
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
        const requestResult = await RNBluetoothClassic.requestBluetoothEnabled();
        if (!requestResult) {
          throw new Error('User did not enable Bluetooth');
        }
      }
    } catch (error) {
      console.error('Bluetooth Classic is not available on this device:', error);
      await this.checkBLEEnabled();
    }
  }

  private async checkBLEEnabled() {
    const permissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
    if (!permissionGranted) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
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
      throw new Error('Device discovery is already in progress');
    }

    this.isDiscovering = true;

    try {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();
      const discoveredDevices = await RNBluetoothClassic.startDiscovery();

      const allDevices = [
        ...(pairedDevices || []),
        ...(discoveredDevices || []),
      ];

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
        'A connection attempt is already in progress. Please wait or try again later.',
      );
    }

    this.isConnecting = true;

    try {
      let connected = false;
      if (device.bonded) {
        connected = await this.attemptConnection(device);
      } else {
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
      throw new Error('Failed to connect to the device');
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
          5000, // 5 seconds timeout
        ),
      ),
    ]);
  }

  private parseData(data: string) {
    try {
      const parsedData = JSON.parse(data);
      const sensorData = {
        gyro: {
          x: parseFloat(parsedData.gyroX),
          y: parseFloat(parsedData.gyroY),
          z: parseFloat(parsedData.gyroZ),
        },
        accel: {
          x: parseFloat(parsedData.accX),
          y: parseFloat(parsedData.accY),
          z: parseFloat(parsedData.accZ),
        },
        tilt: {
          x: parseFloat(parsedData.tiltX),
          y: parseFloat(parsedData.tiltY),
        },
        zStroke: parseFloat(parsedData.distance),
        temp: parseFloat(parsedData.temperature),
      };

      this.onDataReceivedCallback?.(sensorData);
    } catch (error) {
      console.error('Unable to parse data:', data, error);
    }
  }

  private monitorData(device: BluetoothDevice) {
    device.onDataReceived(({data}) => {
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
        if ('createBond' in RNBluetoothClassic) {
          const bondState = await (RNBluetoothClassic as any).createBond(device.address);
          console.log('Bond state after pairing attempt:', bondState);
          return bondState === 'bonded';
        } else {
          console.warn('createBond method not available, assuming device is already paired');
          return true;
        }
      } else {
        console.log('Skipping pairing step on iOS');
        return true;
      }
    } catch (error) {
      console.error('Error pairing device:', error);
      return false;
    }
  }

  onDataReceived(callback: (data: any) => void) {
    this.onDataReceivedCallback = callback;
  }
}

export default new BluetoothManager();
