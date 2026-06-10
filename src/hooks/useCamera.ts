import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  error: string | null
  isReady: boolean
  isStarting: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

async function requestVideoStream(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: 'user',
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: 'user',
        width: { ideal: 1280, min: 960 },
        height: { ideal: 720, min: 540 },
      },
      audio: false,
    },
    {
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
    { video: true, audio: false },
  ]

  let lastError: unknown = null

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      if (isAbortError(err)) {
        throw err
      }
      lastError = err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not access camera. Please allow camera permission.')
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const generationRef = useRef(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const stopCamera = useCallback(() => {
    generationRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setIsReady(false)
    setIsStarting(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    const generation = generationRef.current + 1
    generationRef.current = generation

    setError(null)
    setIsReady(false)
    setIsStarting(true)

    try {
      const mediaStream = await requestVideoStream()

      if (generation !== generationRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = mediaStream
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        setIsReady(true)
      }
    } catch (err) {
      if (generation !== generationRef.current || isAbortError(err)) {
        return
      }

      const message =
        err instanceof Error
          ? err.message
          : 'Could not access camera. Please allow camera permission.'
      setError(message)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
      setIsReady(false)
    } finally {
      if (generation === generationRef.current) {
        setIsStarting(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startCamera()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      stopCamera()
    }
  }, [startCamera, stopCamera])

  return {
    videoRef,
    stream,
    error,
    isReady,
    isStarting,
    startCamera,
    stopCamera,
  }
}
