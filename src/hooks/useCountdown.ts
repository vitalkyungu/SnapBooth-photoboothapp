import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCountdownResult {
  count: number | null
  isRunning: boolean
  startCountdown: (seconds: number) => Promise<void>
  cancelCountdown: () => void
}

export function useCountdown(onTick?: (remaining: number) => void): UseCountdownResult {
  const [count, setCount] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const resolveRef = useRef<(() => void) | null>(null)
  const intervalRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const cancelCountdown = useCallback(() => {
    clearTimer()
    setCount(null)
    setIsRunning(false)
    resolveRef.current = null
  }, [clearTimer])

  const startCountdown = useCallback(
    (seconds: number) => {
      cancelCountdown()

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve
        setIsRunning(true)
        let remaining = seconds
        setCount(remaining)
        onTick?.(remaining)

        intervalRef.current = window.setInterval(() => {
          remaining -= 1
          if (remaining <= 0) {
            clearTimer()
            setCount(null)
            setIsRunning(false)
            resolveRef.current?.()
            resolveRef.current = null
            return
          }

          setCount(remaining)
          onTick?.(remaining)
        }, 1000)
      })
    },
    [cancelCountdown, clearTimer, onTick],
  )

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    count,
    isRunning,
    startCountdown,
    cancelCountdown,
  }
}
