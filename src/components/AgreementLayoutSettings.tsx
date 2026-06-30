import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { 
  loadAgreementSettings, 
  getDefaultSettings, 
  validateSettings,
  generateSettingsCSS,
  type AgreementLayoutSettings 
} from '@/utils/agreement-settings'
import { generateAgreementHTML } from '@/utils/agreement-html'

export default function AgreementLayoutSettings() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState<Partial<AgreementLayoutSettings>>({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Load settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['agreement-layout-settings'],
    queryFn: loadAgreementSettings,
  })

  // Initialize form when settings load
  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AgreementLayoutSettings) => {
      const validationErrors = validateSettings(data)
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '))
      }

      const { error } = await (supabase.from('agreement_layout_settings') as any)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'default')
      
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement-layout-settings'] })
      success('Settings Saved', 'Agreement layout settings have been updated successfully.')
      setErrors([])
    },
    onError: (err: Error) => {
      showError('Save Failed', err.message)
    },
  })

  const handleSave = () => {
    setErrors([])
    if (!form.page_size) {
      setErrors(['Please load settings first'])
      return
    }
    saveMutation.mutate(form as AgreementLayoutSettings)
  }

  const handlePreview = async () => {
    try {
      const testSettings = form as AgreementLayoutSettings
      const testHTML = generateAgreementHTML({
        agreement: { created_at: new Date().toISOString() },
        propertyAddress: '123 Example Street',
        propertyPostcode: 'SW1A 1AA',
        landlordName: 'John Landlord',
        tenantNames: ['Jane Tenant', 'Bob Tenant'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: '1200',
        depositAmount: '1500',
        signatures: [],
        settings: testSettings,
      })

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showError('Preview blocked', 'Please allow popups to preview agreements')
        return
      }

      printWindow.document.write(testHTML)
      printWindow.document.close()
    } catch (err) {
      showError('Preview failed', err instanceof Error ? err.message : 'Could not generate preview')
    }
  }

  const handleReset = () => {
    const defaults = getDefaultSettings()
    setForm(defaults)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading settings…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agreement Print Layout</h3>
          <p className="text-sm text-gray-500 mt-1">Customize margins, fonts, colors, and layout for printed agreements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Page Size</Label>
                <Select 
                  value={form.page_size || 'A4'} 
                  onChange={(e) => setForm({ ...form, page_size: e.target.value })}
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Orientation</Label>
                <Select 
                  value={form.page_orientation || 'portrait'} 
                  onChange={(e) => setForm({ ...form, page_orientation: e.target.value })}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Margins</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input 
                  placeholder="Top (e.g., 20mm)" 
                  value={form.margin_top || ''}
                  onChange={(e) => setForm({ ...form, margin_top: e.target.value })}
                />
                <Input 
                  placeholder="Right" 
                  value={form.margin_right || ''}
                  onChange={(e) => setForm({ ...form, margin_right: e.target.value })}
                />
                <Input 
                  placeholder="Bottom" 
                  value={form.margin_bottom || ''}
                  onChange={(e) => setForm({ ...form, margin_bottom: e.target.value })}
                />
                <Input 
                  placeholder="Left" 
                  value={form.margin_left || ''}
                  onChange={(e) => setForm({ ...form, margin_left: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Font Family</Label>
              <Select 
                value={form.font_family || 'Times New Roman'} 
                onChange={(e) => setForm({ ...form, font_family: e.target.value })}
              >
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Garamond">Garamond</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Base Font Size</Label>
                <Input 
                  placeholder="e.g., 11pt" 
                  value={form.base_font_size || ''}
                  onChange={(e) => setForm({ ...form, base_font_size: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Line Height</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="1" 
                  max="3"
                  value={form.line_height ?? 1.8}
                  onChange={(e) => setForm({ ...form, line_height: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Heading Sizes</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input 
                  placeholder="H1 (e.g., 28pt)" 
                  value={form.heading1_size || ''}
                  onChange={(e) => setForm({ ...form, heading1_size: e.target.value })}
                />
                <Input 
                  placeholder="H2" 
                  value={form.heading2_size || ''}
                  onChange={(e) => setForm({ ...form, heading2_size: e.target.value })}
                />
                <Input 
                  placeholder="H3" 
                  value={form.heading3_size || ''}
                  onChange={(e) => setForm({ ...form, heading3_size: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Heading Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={form.heading_color || '#1a1a1a'}
                    onChange={(e) => setForm({ ...form, heading_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={form.heading_color || '#1a1a1a'}
                    onChange={(e) => setForm({ ...form, heading_color: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={form.text_color || '#000000'}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={form.text_color || '#000000'}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Border Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={form.border_color || '#333333'}
                    onChange={(e) => setForm({ ...form, border_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={form.border_color || '#333333'}
                    onChange={(e) => setForm({ ...form, border_color: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Page */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cover Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="show_cover_page"
                checked={form.show_cover_page ?? true}
                onChange={(e) => setForm({ ...form, show_cover_page: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="show_cover_page">Show cover page</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Logo Max Height</Label>
                <Input 
                  placeholder="e.g., 80px" 
                  value={form.logo_max_height || ''}
                  onChange={(e) => setForm({ ...form, logo_max_height: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Logo Max Width</Label>
                <Input 
                  placeholder="e.g., 250px" 
                  value={form.logo_max_width || ''}
                  onChange={(e) => setForm({ ...form, logo_max_width: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title Size</Label>
                <Input 
                  placeholder="e.g., 28pt" 
                  value={form.cover_title_size || ''}
                  onChange={(e) => setForm({ ...form, cover_title_size: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle Size</Label>
                <Input 
                  placeholder="e.g., 14pt" 
                  value={form.cover_subtitle_size || ''}
                  onChange={(e) => setForm({ ...form, cover_subtitle_size: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="show_signatures_inline"
                checked={form.show_signatures_inline ?? true}
                onChange={(e) => setForm({ ...form, show_signatures_inline: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="show_signatures_inline">Show signatures inline</Label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="show_signature_page"
                checked={form.show_signature_page ?? true}
                onChange={(e) => setForm({ ...form, show_signature_page: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="show_signature_page">Show dedicated signature page</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Signature Image Height</Label>
                <Input 
                  placeholder="e.g., 60px" 
                  value={form.signature_image_height || ''}
                  onChange={(e) => setForm({ ...form, signature_image_height: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Block Spacing</Label>
                <Input 
                  placeholder="e.g., 40px" 
                  value={form.signature_block_spacing || ''}
                  onChange={(e) => setForm({ ...form, signature_block_spacing: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Footer & Page Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Footer Text</Label>
              <Input 
                placeholder="Use {date} for generated date" 
                value={form.footer_text || ''}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              />
              <p className="text-xs text-gray-500">Use {'{date}'} placeholder for the generation date</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="show_page_numbers"
                checked={form.show_page_numbers ?? true}
                onChange={(e) => setForm({ ...form, show_page_numbers: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="show_page_numbers">Show page numbers</Label>
            </div>
            {form.show_page_numbers && (
              <div className="space-y-1.5">
                <Label>Page Number Position</Label>
                <Select 
                  value={form.page_number_position || 'bottom-center'} 
                  onChange={(e) => setForm({ ...form, page_number_position: e.target.value })}
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watermark */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Watermark</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="show_watermark_logo"
                checked={form.show_watermark_logo ?? false}
                onChange={(e) => setForm({ ...form, show_watermark_logo: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="show_watermark_logo">Show company logo as background watermark</Label>
            </div>
            {form.show_watermark_logo && (
              <div className="space-y-1.5">
                <Label>Watermark Opacity ({Math.round((form.watermark_opacity ?? 0.08) * 100)}%)</Label>
                <input 
                  type="range" 
                  min="3" 
                  max="30" 
                  value={Math.round((form.watermark_opacity ?? 0.08) * 100)}
                  onChange={(e) => setForm({ ...form, watermark_opacity: parseInt(e.target.value) / 100 })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Lower = more subtle. Recommended: 5–10%</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
