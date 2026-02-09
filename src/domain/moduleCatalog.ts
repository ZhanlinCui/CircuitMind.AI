import { WorkflowModuleDefinition } from './workflow';

export const MODULE_CATALOG: readonly WorkflowModuleDefinition[] = [
  {
    id: 'power_usb_5v',
    name: 'USB 5V 输入',
    category: 'power',
    ports: [
      { id: 'pwr_5v_out', name: '5V', kind: 'power', direction: 'out', voltage: 5, railName: '5V' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
    ],
  },
  {
    id: 'power_buck_3v3',
    name: '降压到 3.3V（Buck）',
    category: 'power',
    ports: [
      { id: 'vin_5v', name: 'VIN 5V', kind: 'power', direction: 'in', voltage: 5, railName: '5V' },
      { id: 'vout_3v3', name: '3.3V', kind: 'power', direction: 'out', voltage: 3.3, railName: '3V3' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
    ],
  },
  {
    id: 'mcu_esp32_wroom',
    name: 'ESP32-WROOM',
    category: 'mcu',
    ports: [
      { id: 'vdd_3v3', name: 'VDD 3.3V', kind: 'power', direction: 'in', voltage: 3.3, railName: '3V3' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
      { id: 'i2c', name: 'I2C', kind: 'bus', direction: 'bidirectional', bus: 'i2c' },
      { id: 'uart', name: 'UART', kind: 'bus', direction: 'bidirectional', bus: 'uart' },
    ],
  },
  {
    id: 'sensor_bme280',
    name: 'BME280 环境传感器',
    category: 'sensor',
    ports: [
      { id: 'vdd_3v3', name: 'VDD 3.3V', kind: 'power', direction: 'in', voltage: 3.3, railName: '3V3' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
      { id: 'i2c', name: 'I2C', kind: 'bus', direction: 'bidirectional', bus: 'i2c' },
    ],
  },
  {
    id: 'interface_usb_uart',
    name: 'USB 转串口（下载/调试）',
    category: 'interface',
    ports: [
      { id: 'vdd_5v', name: '5V', kind: 'power', direction: 'in', voltage: 5, railName: '5V' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
      { id: 'uart', name: 'UART', kind: 'bus', direction: 'bidirectional', bus: 'uart' },
      { id: 'usb', name: 'USB', kind: 'bus', direction: 'bidirectional', bus: 'usb' },
    ],
  },
  {
    id: 'glue_i2c_pullup',
    name: 'I2C 上拉电阻',
    category: 'glue',
    ports: [
      { id: 'vdd_3v3', name: '3.3V', kind: 'power', direction: 'in', voltage: 3.3, railName: '3V3' },
      { id: 'gnd', name: 'GND', kind: 'power', direction: 'bidirectional', voltage: 0, railName: 'GND' },
      { id: 'i2c', name: 'I2C', kind: 'bus', direction: 'bidirectional', bus: 'i2c' },
    ],
  },
];

export function getModuleCatalogById(moduleId: string): WorkflowModuleDefinition | undefined {
  return MODULE_CATALOG.find((m) => m.id === moduleId);
}
