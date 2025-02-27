import { CATRadioDriver } from "./CATRadioDriver";
import { USBSerialDriver } from "./USBSerialDriver";

const LOCK_ID = "FT891"
const MIN_VFO = 30000
const MAX_VFO = 54000000

export class FT891Driver implements CATRadioDriver {
  constructor(protected serial: USBSerialDriver) {}

  async getVfo() {
    let frequencyString: string | null = null

    await navigator.locks.request(LOCK_ID, async () => {
      this.log("Requesting VFO")
      await this.serial.write("FA;")

      frequencyString = await this.serial.read(";")
      this.log("Received VFO = ", frequencyString ?? "null")
    })

    // typescript is unaware here that the callback to request is executed and frequenceyString might actually be a string
    return typeof frequencyString === "string" ? parseInt((frequencyString as string).replace(/(^FA)|(;$)/, ""), 10) : null
  }

  async setVfo(vfo: number) {
    if (vfo < MIN_VFO || vfo > MAX_VFO) return

    // of course this should be in a command factory, i.e. buildCommand(command: CommandType): string
    await navigator.locks.request(LOCK_ID, async () => {
      const command = `FA${vfo.toString(10).padStart(9, "0")};`
      this.log("Writing to serial", command)
      await this.serial.write(command) 
    })
  }

  async close() {
    this.log("Closing device")
    await this.serial.close()
  }

  protected log(...text: string[]) {
    console.log(`[FT891Driver] ${text.join(" ")}`)
  }
}
