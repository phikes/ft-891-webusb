import { useRef, useSyncExternalStore } from "react"
import { CATRadioDriver } from "../drivers/CATRadioDriver"

export const useSyncVfo = (radioDriver: CATRadioDriver | undefined, updateInterval = 500): number | null => {
  const currentVfo = useRef<number | null>(null)

  return useSyncExternalStore((update) => {
    if (!radioDriver) return () => {}

    const intervalId = setInterval(async () => {
      const newVfo = await radioDriver?.getVfo?.()

      update()
      currentVfo.current = newVfo ?? null
    }, updateInterval)

    return () => clearInterval(intervalId)
  }, () => currentVfo.current)
}
