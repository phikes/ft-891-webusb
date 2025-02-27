import { BaudRate, USBSerialDriver } from "./USBSerialDriver"

const READ_TIMEOUT = 100;

// refer to https://www.silabs.com/documents/public/application-notes/AN571.pdf
enum ControlCommands {
  IFC_ENABLE = 0x00,
  SET_BAUDRATE = 0x1E,
  SET_MHS = 0x07
}

// this class should be extended by:
// * check configuration after setting (e.g. baud rate, modem handshaking configuration)
// * check queues after writing to ensure they are not blocked 
// * locking
export class CP2105Driver implements USBSerialDriver {
  static deviceFilters = [{ vendorId: 0x10c4 }]

  protected textDecoder = new TextDecoder()
  protected textEncoder = new TextEncoder()

  constructor(protected device: USBDevice) {}

  async close() {
    this.log("Closing device")
    await this.device.close()
  }

  async read(delimiter: string): Promise<string | null> {
    this.log("Starting to read from device")
    let result: string = "";

    let timeout = false
    setTimeout(() => timeout = true, READ_TIMEOUT)

    while (!timeout && !result.endsWith(delimiter)) {
      const chunk = await this.device.transferIn(1, 64);

      if (chunk.data?.byteLength === 0) continue

      const decodedChunk = this.textDecoder.decode(chunk.data!.buffer)
      this.log("Received decoded chunk: ", decodedChunk)
      result += decodedChunk

      if (timeout) {
        this.log("Read timeout")
        return null
      }
    }

    this.log("Read finished with result = ", result)
    return result
  }

  async write(text: string) {
    const encodedData = this.textEncoder.encode(text)
    this.log("Starting to write to device", encodedData.toString())

    await this.device.transferOut(1, encodedData)
  }

  async initialize() {
    if (!this.device.opened) {
      this.log("Opening device")
      await this.device.open()
    }

    // select the interface with 8 byte packet size
    if (!this.device.configuration) {
      this.log("Selecting configuration")
      await this.device.selectConfiguration(0)
    }

    this.log("Claiming interface")
    await this.device.claimInterface(this.device.configuration!.interfaces[0]!.interfaceNumber)

    await this.enableInterface()
    await this.configureModemHandshake()
  }

  protected log(...text: string[]) {
    console.log(`[CP2105Driver] ${text.join(" ")}`)
  }

  async setBaudRate(baudRate: BaudRate) {
    this.log("Setting baud rate to", baudRate.toString(10))
    await this.device.controlTransferOut({
      requestType: 'vendor',
      recipient: 'device',
      request: ControlCommands.SET_BAUDRATE,
      index: 0,
      value: 0,
    }, new Uint32Array([baudRate])); // sent as data, not as wValue because it can exceed 2 B
  }

  protected async enableInterface() {
    this.log("Enabling device interface")
    await this.device.controlTransferOut({
      requestType: 'vendor',
      recipient: 'device',
      request: ControlCommands.IFC_ENABLE,
      index: 0,
      value: 0b1,
    });
  }

  protected async configureModemHandshake() {
    this.log("Configuring device modem (DTR/RTS ready)")
    await this.device.controlTransferOut({
      requestType: 'vendor',
      recipient: 'device',
      request: ControlCommands.SET_MHS,
      index: 0,
      value: 0b1100000011, // set DTR/RTS high (lower bits are bit mask)
    });
  }
}
