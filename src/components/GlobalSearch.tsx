import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Search, Building2, Users, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchResult {
  type: 'property' | 'landlord' | 'tenant'
  id: string
  label: string
  sublabel: string
  href: string
}

const ICONS = {
  property: Building2,
  landlord: UserCheck,
  tenant: Users,
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const { data: results } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2) return []
      const results: SearchResult[] = []

      const [properties, landlords, tenants] = await Promise.all([
        supabase.from('properties').select('id, address, postcode').ilike('address', `%${query}%`).limit(3),
        supabase.from('landlords').select('id, full_name, email').ilike('full_name', `%${query}%`).limit(3),
        supabase.from('tenants').select('id, full_name, email').ilike('full_name', `%${query}%`).limit(3),
      ])

      for (const p of (properties.data ?? [])) {
        results.push({ type: 'property', id: p.id, label: p.address, sublabel: p.postcode ?? '', href: `/properties/${p.id}` })
      }
      for (const l of (landlords.data ?? [])) {
        results.push({ type: 'landlord', id: l.id, label: l.full_name, sublabel: l.email ?? '', href: `/landlords/${l.id}` })
      }
      for (const t of (tenants.data ?? [])) {
        results.push({ type: 'tenant', id: t.id, label: t.full_name, sublabel: t.email ?? '', href: `/tenants/${t.id}` })
      }

      return results
    },
    enabled: query.length >= 2,
  })

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="Search properties, landlords, tenants…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-12 text-sm"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
          Ctrl+K
        </kbd>
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {(results ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No results found</p>
          ) : (
            <div>
              {(['property', 'landlord', 'tenant'] as const).map((type) => {
                const typeResults = (results ?? []).filter((r) => r.type === type)
                if (typeResults.length === 0) return null
                const Icon = ICONS[type]
                return (
                  <div key={type}>
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase text-gray-400 bg-gray-50">
                      {type}s
                    </p>
                    {typeResults.map((r) => (
                      <Link
                        key={r.id}
                        to={r.href}
                        onClick={() => { setOpen(false); setQuery('') }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                          <p className="text-xs text-gray-500 truncate">{r.sublabel}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
