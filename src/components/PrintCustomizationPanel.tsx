import { RotateCcw, FileText, Users, CheckCircle2, Hash, Type } from 'lucide-react'
import type { PrintOptions } from '@/utils/print-options'
import { DEFAULT_PRINT_OPTIONS } from '@/utils/print-options'

interface PrintCustomizationPanelProps {
  options: PrintOptions
  onChange: (opts: PrintOptions) => void
}

export default function PrintCustomizationPanel({ options, onChange }: PrintCustomizationPanelProps) {
  function updateAppendix(key: keyof PrintOptions['appendices'], value: boolean) {
    onChange({ ...options, appendices: { ...options.appendices, [key]: value } })
  }

  function updateNumbering(value: PrintOptions['pageNumbering']) {
    onChange({ ...options, pageNumbering: value })
  }

  function updateFontSize(value: PrintOptions['fontSize']) {
    onChange({ ...options, fontSize: value })
  }

  const appendices: Array<{ key: keyof PrintOptions['appendices']; label: string; desc: string; icon: React.ReactNode }> = [
    { key: 'compliance', label: 'Appendix A', desc: 'Compliance Certificates', icon: <FileText className="h-3.5 w-3.5 text-gray-400" /> },
    { key: 'tenantId', label: 'Appendix B', desc: 'Tenant ID Documents', icon: <Users className="h-3.5 w-3.5 text-gray-400" /> },
    { key: 'references', label: 'Appendix C', desc: 'Tenant References', icon: <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" /> },
    { key: 'signatureLog', label: 'Appendix D', desc: 'Signature Verification Log', icon: <Hash className="h-3.5 w-3.5 text-gray-400" /> },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Print Settings</h3>
        <button
          onClick={() => onChange(DEFAULT_PRINT_OPTIONS)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          title="Reset all options to defaults"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Appendices */}
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Appendices</p>
        <div className="space-y-1.5">
          {appendices.map((app) => (
            <label
              key={app.key}
              className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={options.appendices[app.key]}
                onChange={(e) => updateAppendix(app.key, e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-1 focus:ring-gray-400"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {app.icon}
                  <span className="text-xs font-medium text-gray-800">{app.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{app.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Page Numbering */}
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Hash className="h-3 w-3" /> Page Numbering
        </p>
        <div className="space-y-1">
          {([
            { value: 'arabic', label: 'Arabic (1, 2, 3)' },
            { value: 'roman', label: 'Roman (i, ii, iii)' },
            { value: 'none', label: 'None' },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="pageNumbering"
                value={opt.value}
                checked={options.pageNumbering === opt.value}
                onChange={() => updateNumbering(opt.value)}
                className="h-3 w-3 border-gray-300 text-gray-900 focus:ring-1 focus:ring-gray-400"
              />
              <span className="text-xs text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Header & Footer */}
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Header &amp; Footer</p>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Header text (overrides default)</label>
            <input
              type="text"
              value={options.headerText}
              onChange={(e) => onChange({ ...options, headerText: e.target.value })}
              placeholder="Agency | Property | Ref: ..."
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Footer text (overrides default)</label>
            <input
              type="text"
              value={options.footerText}
              onChange={(e) => onChange({ ...options, footerText: e.target.value })}
              placeholder="Page # | Agency Name"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Type className="h-3 w-3" /> Font Size
        </p>
        <div className="flex gap-1.5">
          {([
            { value: 'small', label: 'S', pt: '10pt' },
            { value: 'medium', label: 'M', pt: '12pt' },
            { value: 'large', label: 'L', pt: '14pt' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFontSize(opt.value)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                options.fontSize === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              title={`Font size: ${opt.pt}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          {options.fontSize === 'small' ? '10pt' : options.fontSize === 'medium' ? '12pt' : '14pt'} — {options.fontSize === 'large' ? 'Accessibility-friendly' : options.fontSize === 'small' ? 'Compact layout' : 'Standard size'}
        </p>
      </div>
    </div>
  )
}
