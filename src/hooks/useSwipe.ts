import { useRef, useCallback } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

/**
 * Custom hook for detecting swipe gestures on touch devices.
 * Useful for mobile navigation in signing flows, carousels, etc.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeHandlers) {
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const isSwiping = useRef<boolean>(false)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)
    
    // Only consider it a swipe if horizontal movement exceeds vertical
    if (deltaX > deltaY && deltaX > 10) {
      isSwiping.current = true
    }
  }, [])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    
    // Only trigger if horizontal movement is dominant and exceeds threshold
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }
    
    isSwiping.current = false
  }, [onSwipeLeft, onSwipeRight, threshold])
  
  return { handleTouchStart, handleTouchMove, handleTouchEnd, isSwiping: isSwiping.current }
}
