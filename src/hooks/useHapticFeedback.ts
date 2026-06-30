import { useCallback } from 'react'

/** Duration of light tap vibration in ms */
const TAP_DURATION = 10
/** Duration of success vibration pattern */
const SUCCESS_PATTERN = [10, 50, 10]

/**
 * Hook providing haptic feedback helpers for mobile.
 * Falls back silently on unsupported browsers.
 * Only triggers on touch-capable devices.
 */
export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  /** Light tap feedback — single short vibration */
  const tap = useCallback(() => {
    if (!isSupported) return
    // Only on touch devices / mobile screens
    if (window.innerWidth > 1024) return
    navigator.vibrate(TAP_DURATION)
  }, [isSupported])

  /** Success feedback — double pulse pattern */
  const success = useCallback(() => {
    if (!isSupported) return
    if (window.innerWidth > 1024) return
    navigator.vibrate(SUCCESS_PATTERN)
  }, [isSupported])

  return { tap, success, isSupported }
}
