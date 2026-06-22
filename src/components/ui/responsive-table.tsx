import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('overflow-x-auto -mx-4 sm:mx-0', className)}>
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  )
}

export function MobileCards({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('space-y-3 sm:hidden', className)}>
      {children}
    </div>
  )
}

export function MobileCard({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('bg-white border rounded-lg p-4 shadow-sm', className)}>
      {children}
    </div>
  )
}

export function MobileCardRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-2 py-2 border-b last:border-0', className)}>
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}
