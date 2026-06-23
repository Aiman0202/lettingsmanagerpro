import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { MERGE_FIELDS_BY_CATEGORY, type MergeFieldCategory } from '../mergeFields'

interface MergeFieldPanelProps {
  onInsert: (fieldKey: string) => void
}

const CATEGORY_ORDER: MergeFieldCategory[] = [
  'Tenancy', 'Property', 'Landlord', 'Tenant', 'Agency',
  'Financial', 'Inventory', 'HMO', 'Guarantor', 'Utilities', 'Other',
]

export default function MergeFieldPanel({ onInsert }: MergeFieldPanelProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORY_ORDER))

  const toggleCategory = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const filtered = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    fields: (MERGE_FIELDS_BY_CATEGORY[cat] ?? []).filter(
      (f) =>
        !search ||
        f.label.toLowerCase().includes(search.toLowerCase()) ||
        f.key.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((g) => g.fields.length > 0)

  return (
    <div className="border-l border-gray-200 bg-white w-64 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Merge Fields
        </h3>
        <Input
          placeholder="Search fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filtered.map(({ category, fields }) => (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full text-left px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded flex items-center gap-1"
              >
                <span className="text-gray-400">{expanded.has(category) ? '▾' : '▸'}</span>
                {category}
              </button>
              {expanded.has(category) && (
                <div className="ml-2 space-y-0.5">
                  {fields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => onInsert(field.key)}
                      className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
