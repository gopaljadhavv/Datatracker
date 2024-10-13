import React, { createContext, useState, useContext, useEffect } from 'react';
import BluetoothManager from './BluetoothManager';
import MPU6050Simulator from './Simulator';

interface SensorData {
  gyro: { x: number; y: number; z: number };
  accel: { x: number; y: number; z: number };
  tilt: { x: number; y: number };
  zStroke: number;
  temp: number;
}

interface SensorContextType {
  sensorData: SensorData;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData>({
    gyro: { x: 0, y: 0, z: 0 },
    accel: { x: 0, y: 0, z: 0 },
    tilt: { x: 0, y: 0 },
    zStroke: 0,
    temp: 0,
  });

  useEffect(() => {
    const handleDataReceived = (data: SensorData) => {
      setSensorData(data);
    };

    BluetoothManager.onDataReceived(handleDataReceived);

    return () => {
      BluetoothManager.onDataReceived(() => {}); // Ensure this properly cleans up
    };
  }, []);

  return (
    <SensorContext.Provider value={{ sensorData }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorProvider');
  }
  return context;
};