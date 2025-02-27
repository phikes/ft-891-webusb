export type BaudRate = 4800 | 9600 | 19200 | 38400

// we could even implement the SerialPort interface from WebSerial and use their API entirely
export abstract class USBSerialDriver {
  static deviceFilters: USBDeviceFilter[]

  abstract initialize(): Promise<void>
  abstract read(delimiter: string): Promise<string | null>
  abstract write(text: string): Promise<void>
  abstract setBaudRate(baudRate: BaudRate): Promise<void>
  abstract close(): Promise<void>
}
