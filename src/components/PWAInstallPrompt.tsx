import { useState, useEffect } from 'react'
import { X, Download, Share2 } from 'lucide-react'

const DISMISS_KEY = 'pwa-install-dismissed'

/** Detect if the app is already running in standalone (installed) mode */
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true
}

/** Detect iOS Safari (which doesn't fire beforeinstallprompt) */
function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return

    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return

    // Check for iOS Safari
    if (isIOSSafari()) {
      setIsIOS(true)
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShowPrompt(false)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="install-prompt-banner">
      {/* App icon */}
      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
        LP
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {isIOS ? (
          <div>
            <p className="text-sm font-semibold text-gray-900">Install App</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              Tap <Share2 className="h-3 w-3" /> then "Add to Home Screen"
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-gray-900">Install LettingsPro</p>
            <p className="text-xs text-gray-500 mt-0.5">Quick access from your home screen</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="flex items-center justify-center h-7 w-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 touch-manipulation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
