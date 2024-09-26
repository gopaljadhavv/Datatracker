class MPU6050Simulator {
  private gyroX = 0;
  private gyroY = 0;
  private gyroZ = 0;
  private accelX = 0;
  private accelY = 0;
  private accelZ = 0;
  private temp = 25;

  private updateGyro() {
    this.gyroX += (Math.random() - 0.5) * 10;
    this.gyroY += (Math.random() - 0.5) * 10;
    this.gyroZ += (Math.random() - 0.5) * 10;
    
    // Constrain values
    this.gyroX = Math.max(-250, Math.min(250, this.gyroX));
    this.gyroY = Math.max(-250, Math.min(250, this.gyroY));
    this.gyroZ = Math.max(-250, Math.min(250, this.gyroZ));
  }

  private updateAccel() {
    this.accelX += (Math.random() - 0.5) * 0.1;
    this.accelY += (Math.random() - 0.5) * 0.1;
    this.accelZ += (Math.random() - 0.5) * 0.1;
    
    // Constrain values
    this.accelX = Math.max(-2, Math.min(2, this.accelX));
    this.accelY = Math.max(-2, Math.min(2, this.accelY));
    this.accelZ = Math.max(-2, Math.min(2, this.accelZ));
  }

  private updateTemp() {
    this.temp += (Math.random() - 0.5) * 0.1;
    this.temp = Math.max(20, Math.min(30, this.temp));
  }

  public getData() {
    this.updateGyro();
    this.updateAccel();
    this.updateTemp();

    return {
      gyro: { x: this.gyroX, y: this.gyroY, z: this.gyroZ },
      accel: { x: this.accelX, y: this.accelY, z: this.accelZ },
      temp: this.temp
    };
  }
}

export default new MPU6050Simulator();
