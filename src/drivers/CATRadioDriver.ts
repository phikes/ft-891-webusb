export interface CATRadioDriver {
  getVfo?(): Promise<number | null>
  setVfo?(vfo: number): Promise<void>
  close(): Promise<void>
}
