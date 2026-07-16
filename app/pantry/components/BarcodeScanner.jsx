'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Keyboard, ScanLine, StopCircle } from 'lucide-react'
import { isValidGtin, normalizeBarcode } from '@/lib/barcodes'

export default function BarcodeScanner({ onDetected, loading = false }) {
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const frameRef = useRef(null)
  const stoppedRef = useRef(false)

  const stopCamera = () => {
    stoppedRef.current = true
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  useEffect(() => stopCamera, [])

  const submit = async (rawCode = code) => {
    const normalized = normalizeBarcode(rawCode)
    setCode(normalized)
    if (!isValidGtin(normalized)) {
      setMessage('Code incomplet ou chiffre de contrôle incorrect.')
      return
    }
    setMessage('')
    stopCamera()
    await onDetected(normalized)
  }

  const startCamera = async () => {
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('La caméra n’est pas disponible ici. Le champ accepte aussi une douchette USB/Bluetooth.')
      return
    }
    if (!('BarcodeDetector' in window)) {
      setMessage('Ce navigateur ne sait pas décoder la caméra. Utilisez le champ ou une douchette USB/Bluetooth.')
      return
    }

    try {
      stoppedRef.current = false
      const supported = await window.BarcodeDetector.getSupportedFormats?.()
      const wanted = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      const formats = supported?.length ? wanted.filter(format => supported.includes(format)) : wanted
      const detector = new window.BarcodeDetector({ formats })
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setScanning(true)

      let lastDetection = 0
      const detect = async (timestamp) => {
        if (stoppedRef.current || !videoRef.current) return
        if (timestamp - lastDetection > 220 && videoRef.current.readyState >= 2) {
          lastDetection = timestamp
          try {
            const results = await detector.detect(videoRef.current)
            const raw = results?.[0]?.rawValue
            if (raw) {
              await submit(raw)
              return
            }
          } catch {
            // A moving frame can fail decoding; keep scanning the next frame.
          }
        }
        frameRef.current = requestAnimationFrame(detect)
      }
      frameRef.current = requestAnimationFrame(detect)
    } catch (error) {
      stopCamera()
      setMessage(error?.name === 'NotAllowedError'
        ? 'Accès caméra refusé. Autorisez la caméra ou utilisez une douchette.'
        : 'Caméra indisponible. Utilisez le champ ou une douchette USB/Bluetooth.')
    }
  }

  return (
    <div className="barcode-scanner">
      <div className="barcode-intro">
        <ScanLine size={22} />
        <div>
          <strong>Lire le code-barres</strong>
          <span>Caméra du téléphone, douchette USB/Bluetooth ou saisie manuelle.</span>
        </div>
      </div>

      <form className="barcode-entry" onSubmit={event => { event.preventDefault(); submit() }}>
        <Keyboard size={18} aria-hidden="true" />
        <input
          value={code}
          onChange={event => setCode(normalizeBarcode(event.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="EAN-8, EAN-13, UPC…"
          aria-label="Code-barres"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !code}>Identifier</button>
      </form>

      <div className={`barcode-camera ${scanning ? '' : 'barcode-camera-hidden'}`}>
        <video ref={videoRef} muted playsInline aria-label="Aperçu de la caméra" />
        <div className="barcode-target" aria-hidden="true" />
        {scanning && (
          <button type="button" onClick={stopCamera}><StopCircle size={18} /> Arrêter</button>
        )}
      </div>
      {!scanning && (
        <button type="button" className="barcode-camera-button" onClick={startCamera} disabled={loading}>
          <Camera size={18} /> Scanner avec la caméra
        </button>
      )}

      {message && <p className="barcode-message" role="status">{message}</p>}
    </div>
  )
}
