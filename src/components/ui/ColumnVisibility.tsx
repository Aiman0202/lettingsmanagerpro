import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Columns3, Check } from 'lucide-react'
import type { ColumnConfig } from '@/hooks/useColumnVisibility'

interface ColumnVisibilityProps {
  columns: ColumnConfig[]
  onToggle: (key: string) => void
  isVisible: (key: string) => boolean
}

export function ColumnVisibility({ columns, onToggle, isVisible }: ColumnVisibilityProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} title="Toggle columns">
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline ml-1.5">Columns</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Show columns
          </p>
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => onToggle(col.key)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <span className={`h-4 w-4 flex items-center justify-center rounded border text-xs ${
                isVisible(col.key) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
              }`}>
                {isVisible(col.key) && <Check className="h-3 w-3" />}
              </span>
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
