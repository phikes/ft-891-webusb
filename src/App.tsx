import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import "./app.scss"
import { Button, Col, Form, Row } from 'react-bootstrap'
import { CP2105Driver } from './drivers/CP2105Driver'
import { FT891Driver } from './drivers/FT891Driver'
import { useSyncVfo } from './hooks/useSyncVfo'
import { BaudRate } from './drivers/USBSerialDriver'

const App = () => {
  const [radioDriver, setRadioDriver] = useState<FT891Driver>()
  const [baudRate, setBaudRate] = useState<BaudRate>(4800)

  const externalVfo = useSyncVfo(radioDriver)
  useEffect(() => { if (externalVfo) _setVfo(externalVfo) }, [externalVfo])

  const [vfo, _setVfo] = useState(14250000)
  const setVfo = useCallback((vfo: number) => {
    if (!radioDriver) return

    _setVfo(vfo)
    radioDriver.setVfo(vfo)
  }, [radioDriver])

  const increaseVfo = useCallback((offset: -10 | 10) => () => setVfo(vfo + offset), [setVfo, vfo])

  const vfoFormatter = useMemo(() => new Intl.NumberFormat("de-DE", { style: "decimal" }), [])
  const formattedFvo = useMemo(() => vfoFormatter.format(vfo), [vfo, vfoFormatter])

  const handleConnect = useCallback(async () => {
    const usbDevice = await navigator.usb
      .requestDevice({ filters: CP2105Driver.deviceFilters }) // can easily concat all existing usb device drivers

    // could easily let the user decide which radio/accessory to instantiate with this usb driver
    const usbDriver = new CP2105Driver(usbDevice)
    await usbDriver.initialize()
    await usbDriver.setBaudRate(baudRate)
    const driver = new FT891Driver(usbDriver)

    setRadioDriver(driver)
  }, [baudRate])

  const handleDisconnect = useCallback(async () => {
    if (!radioDriver) return

    await radioDriver.close()
    setRadioDriver(undefined)
  }, [radioDriver])

  const handleBaudRateChange = useCallback(async({ target: { value }}: ChangeEvent<HTMLInputElement>) => {
    setBaudRate(parseInt(value, 10) as BaudRate)
    if(!radioDriver) return

    await handleDisconnect()
    // let user reconnect manually
  }, [handleDisconnect, radioDriver])

  return (
    <div className="container p-5">
      <Row>
        <Col lg={{ offset: 4, span: 4 }}>
          <h1>Yaesu FT-891</h1>
          <p className="fs-6">This demo utilizes the <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API" rel="noopener noreferrer" target="_blank">WebUSB API</a> to implement a rudimentary driver for the <a href="https://www.silabs.com/documents/public/application-notes/AN571.pdf" target="_blank" rel="noopener noreferrer">Silicon Labs CP2105</a> USB-serial bridge used in the Yaesu FT-891. On top of that it issues serial commands for the <a href="https://conspark.com.pl/files/resources/FT-891_CAT_OM_ENG_1909-C%20(1).pdf" target="_blank" rel="noopener noreferrer">CAT implementation</a> of the radio in order to send and read the VFO. <br /><br /><b>There is no driver on the host OS necessary! 🎉</b><br /><small>(It should even run on Android!)</small></p>
          <h2>VFO</h2>
          <div className="align-items-center d-flex gap-2 justify-content-center mb-3">
            {
              !radioDriver && <Button onClick={handleConnect}>Connect</Button>
            }
            {
              radioDriver && <>
                <div className="bg-light border rounded text-dark oxanium-font fs-1 py-1 px-3">{formattedFvo.slice(0, -1)}<small className="fs-4">{formattedFvo.slice(-1)}</small></div>

                <div className="d-flex flex-column gap-1">
                  <Button onClick={increaseVfo(10)} variant='light' size="sm">+</Button>
                  <Button onClick={increaseVfo(-10)} variant='light' size="sm">-</Button>
                </div>
              </>
            }
          </div>

          {radioDriver && <Button className="d-block mx-auto" onClick={handleDisconnect} variant="secondary">Disconnect</Button>}

          <Form.Group className="mb-3">
            <Form.Label>Baud Rate</Form.Label>
            <Form.Control as="select" onChange={handleBaudRateChange} size="sm" value={baudRate}>
              <option value="4800">4800</option>
              <option value="9600">9600</option>
              <option value="19200">19200</option>
              <option value="38400">38400</option>
            </Form.Control>
            <Form.Text>The baud rate can be set from <pre className="d-inline">Menu 05-06</pre> (long press <pre className="d-inline">F</pre>).</Form.Text>
          </Form.Group>
          <h2>Ideas</h2>
          <ul>
            <li><a href="https://github.com/Hamlib/Hamlib" target="_blank" rel="noopener noreferrer">Hamlib</a> in the browser 🎉</li>
            <li><b>Very simple logger</b> - a logger which uses no backend (but data sources + IndexedDB) and CAT control and is available from (nearly) any browser ⭐️</li>
            <li><b>Very convenient logger</b> - use <a href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition" target="_blank" rel="noopener noreferrer">SpeechRecognition API</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API" target="_blank" rel="noopener noreferrer">WebAudio API</a> and build a very convenient logger which prefills every QSL field from the QSO 🤓</li>
            <li><b><a href="https://wsjt.sourceforge.io/wsjtx.html" target="_blank" rel="noopener noreferrer">WSJT-X</a> but in the browser</b> (utilizing WebAudio and CAT control) 😇</li>
          </ul>
        </Col>
      </Row>
    </div>
  )
}

export default App
