import { useState, useCallback } from 'react'

export interface ColumnConfig {
  key: string
  label: string
  defaultVisible: boolean
}

const STORAGE_PREFIX = 'table-columns-'

function loadFromStorage(tableId: string, columns: ColumnConfig[]): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + tableId)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      return new Set(parsed)
    }
  } catch { /* ignore */ }
  return new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key))
}

function saveToStorage(tableId: string, visible: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + tableId, JSON.stringify([...visible]))
  } catch { /* ignore */ }
}

export function useColumnVisibility(tableId: string, columns: ColumnConfig[]) {
  const [visible, setVisibleSet] = useState<Set<string>>(() => loadFromStorage(tableId, columns))

  const toggle = useCallback(
    (key: string) => {
      setVisibleSet((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          // Don't allow hiding all columns
          if (next.size > 1) next.delete(key)
        } else {
          next.add(key)
        }
        saveToStorage(tableId, next)
        return next
      })
    },
    [tableId],
  )

  const isVisible = useCallback((key: string) => visible.has(key), [visible])

  return { isVisible, toggle, columns }
}
