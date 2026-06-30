import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Lightweight page transition wrapper.
 * Triggers a CSS animation on every route change by keying off the pathname.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Remove and re-add the animation class to restart it
    el.classList.remove('page-transition-enter')
    // Force reflow so the browser sees the removal
    void el.offsetWidth
    el.classList.add('page-transition-enter')
  }, [location.pathname])

  return (
    <div ref={ref} className="page-transition-enter h-full">
      {children}
    </div>
  )
}
