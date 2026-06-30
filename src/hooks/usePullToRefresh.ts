import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const PULL_THRESHOLD = 60 // px to trigger refresh
const MAX_PULL = 100

/**
 * Pull-to-refresh hook for mobile.
 * Attach the returned ref to the scrollable container.
 * When user pulls down from the top, invalidates all queries.
 */
export function usePullToRefresh() {
  const containerRef = useRef<HTMLElement>(null)
  const queryClient = useQueryClient()
  const startY = useRef(0)
  const pulling = useRef(false)
  const indicatorRef = useRef<HTMLDivElement | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.min(currentY - startY.current, MAX_PULL)

    if (distance > 0 && indicatorRef.current) {
      indicatorRef.current.style.opacity = String(Math.min(distance / PULL_THRESHOLD, 1))
      indicatorRef.current.style.transform = `translateX(-50%) translateY(${distance * 0.4}px)`
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    const el = containerRef.current
    if (!el) return

    const currentY = window.TouchEvent
      ? (indicatorRef.current?.style.transform.match(/translateY\(([^)]+)px\)/)?.[1] ?? '0')
      : '0'
    const distance = parseFloat(currentY) / 0.4

    // Reset indicator
    if (indicatorRef.current) {
      indicatorRef.current.style.opacity = '0'
      indicatorRef.current.style.transform = 'translateX(-50%) translateY(0px)'
    }

    if (distance >= PULL_THRESHOLD) {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10)

      // Show refreshing state
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = '1'
        indicatorRef.current.style.transform = 'translateX(-50%) translateY(24px)'
        indicatorRef.current.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Refreshing...</span>'
      }

      // Invalidate all queries to trigger refetch
      await queryClient.invalidateQueries()

      // Hide indicator after a brief delay
      setTimeout(() => {
        if (indicatorRef.current) {
          indicatorRef.current.style.opacity = '0'
          indicatorRef.current.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Pull to refresh</span>'
        }
      }, 500)
    }
  }, [queryClient])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Only enable on touch devices
    if (!('ontouchstart' in window)) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { containerRef, indicatorRef }
}
