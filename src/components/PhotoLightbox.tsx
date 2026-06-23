import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoLightboxProps {
  photos: { id: string; url: string }[]
  startIndex: number
  open: boolean
  onClose: () => void
}

export default function PhotoLightbox({ photos, startIndex, open, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  // Sync startIndex when lightbox opens
  useEffect(() => {
    if (open) setCurrentIndex(startIndex)
  }, [open, startIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
  }, [photos.length])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
  }, [photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose, goPrev, goNext])

  // Prevent body scroll while open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || photos.length === 0) return null

  const current = photos[currentIndex]

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Top bar: counter + close */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-10">
        <span className="text-white/80 text-sm font-mono bg-black/40 rounded px-2 py-1">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Left arrow */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Main image */}
      <img
        src={current.url}
        alt={`Photo ${currentIndex + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded select-none"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Right arrow */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>,
    document.body
  )
}
