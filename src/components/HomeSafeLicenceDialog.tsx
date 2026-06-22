import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertTriangle, Clock, FileCheck, ShieldCheck, XCircle, Download, X } from 'lucide-react'

const statusConfig = {
  certificates_pending: { label: 'Certificates Pending', icon: FileCheck, color: 'secondary' as const },
  applied: { label: 'Applied', icon: Clock, color: 'default' as const },
  under_review: { label: 'Under Review', icon: ShieldCheck, color: 'default' as const },
  granted: { label: 'Granted', icon: CheckCircle, color: 'success' as const },
  rejected: { label: 'Rejected', icon: XCircle, color: 'destructive' as const },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'warning' as const },
}

const certificateList = [
  { key: 'has_gas_safe', label: 'Gas Safety Certificate' },
  { key: 'has_eicr', label: 'EICR (Electrical)' },
  { key: 'has_epc', label: 'EPC Rating' },
  { key: 'has_fire_risk_assessment', label: 'Fire Risk Assessment' },
  { key: 'has_legionella_risk', label: 'Legionella Risk Assessment' },
  { key: 'has_smoke_co_alarms', label: 'Smoke & CO Alarms' },
]

export default function HomeSafeLicenceDialog({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const qc = useQueryClient()
  const [licence, setLicence] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [certificates, setCertificates] = useState({
    has_gas_safe: false, has_eicr: false, has_epc: false,
    has_fire_risk_assessment: false, has_legionella_risk: false, has_smoke_co_alarms: false,
  })
  const [applicationDate, setApplicationDate] = useState('')
  const [applicationRef, setApplicationRef] = useState('')
  const [licenceNumber, setLicenceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      loadLicence()
    }
  }, [open, propertyId])

  async function loadLicence() {
    setLoading(true)
    const result: any = await supabase.from('property_home_safe_licences').select('*').eq('property_id', propertyId).maybeSingle()
    const licenceData = result.data
    if (licenceData) {
      setLicence(licenceData)
      setCertificates({
        has_gas_safe: licenceData.has_gas_safe ?? false,
        has_eicr: licenceData.has_eicr ?? false,
        has_epc: licenceData.has_epc ?? false,
        has_fire_risk_assessment: licenceData.has_fire_risk_assessment ?? false,
        has_legionella_risk: licenceData.has_legionella_risk ?? false,
        has_smoke_co_alarms: licenceData.has_smoke_co_alarms ?? false,
      })
      setApplicationDate(licenceData.application_date ?? '')
      setApplicationRef(licenceData.application_reference ?? '')
      setLicenceNumber(licenceData.licence_number ?? '')
      setIssueDate(licenceData.licence_issue_date ?? '')
      setExpiryDate(licenceData.licence_expiry_date ?? '')
      setRejectionReason(licenceData.rejection_reason ?? '')
      setNotes(licenceData.notes ?? '')
    }
    setLoading(false)
  }

  async function handleDownloadDoc(documentId: string) {
    const { data: doc } = await supabase.from('documents').select('storage_path').eq('id', documentId).single()
    if (!doc) return
    const { data } = await supabase.storage.from('documents').createSignedUrl((doc as any).storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleSave() {
    setSaving(true)

    let documentId: string | null = licence?.document_id ?? null

    // Upload file if selected
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `licences/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
      if (uploadErr) {
        alert('Upload failed: ' + uploadErr.message)
        setSaving(false)
        return
      }

      const { data: newDoc } = await (supabase.from('documents') as any).insert({
        name: 'Home Safe Licence Document',
        storage_path: path,
        entity_type: 'property',
        entity_id: propertyId,
        category: 'Compliance',
        size_bytes: file.size,
      } as any).select('id').single()

      documentId = (newDoc as any)?.id ?? null
    }

    const payload = {
      property_id: propertyId,
      status: determineStatus(),
      ...certificates,
      application_date: applicationDate || null,
      application_reference: applicationRef || null,
      licence_number: licenceNumber || null,
      licence_issue_date: issueDate || null,
      licence_expiry_date: expiryDate || null,
      rejection_reason: rejectionReason || null,
      notes: notes || null,
      document_id: documentId,
    }

    if (licence) {
      await (supabase.from('property_home_safe_licences') as any).update(payload).eq('id', licence.id)
    } else {
      await (supabase.from('property_home_safe_licences') as any).insert(payload)
    }

    qc.invalidateQueries({ queryKey: ['home-safe-licence', propertyId] })
    qc.invalidateQueries({ queryKey: ['property', propertyId] })
    qc.invalidateQueries({ queryKey: ['home-safe-licences-all'] })
    setSaving(false)
    onClose()
  }

  function determineStatus() {
    if (certificates.has_gas_safe && certificates.has_eicr && certificates.has_epc) {
      if (applicationDate && !licenceNumber) return 'applied'
      if (applicationDate && applicationRef) return 'under_review'
      if (licenceNumber && issueDate) return 'granted'
      if (rejectionReason) return 'rejected'
      return 'certificates_pending'
    }
    return 'certificates_pending'
  }

  const allCertificatesReady = Object.values(certificates).every(Boolean)
  const canApply = allCertificatesReady && !licence?.licence_number
  const canGrant = licence?.status === 'under_review' || licence?.status === 'applied'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Home Safe Licensing</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Current Status */}
            {licence && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Current Status</p>
                      <Badge variant={statusConfig[licence.status as keyof typeof statusConfig]?.color ?? 'secondary'} className="text-base px-3 py-1">
                        {statusConfig[licence.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                    {licence.licence_number && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Licence Number</p>
                        <p className="font-mono font-bold">{licence.licence_number}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificates Checklist */}
            <div className="space-y-2">
              <Label>Prerequisite Certificates</Label>
              <p className="text-xs text-gray-500">Check all certificates that are current and valid</p>
              <div className="grid grid-cols-2 gap-2">
                {certificateList.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certificates[key as keyof typeof certificates]}
                      onChange={(e) => setCertificates({ ...certificates, [key]: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {!allCertificatesReady && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  All certificates required before applying for licence
                </p>
              )}
            </div>

            {/* Application Details */}
            <div className="space-y-3">
              <Label className="text-base">Application Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Application Date</Label>
                  <Input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Application Reference</Label>
                  <Input value={applicationRef} onChange={(e) => setApplicationRef(e.target.value)} placeholder="e.g. HSL-2024-12345" />
                </div>
              </div>
            </div>

            {/* Licence Details */}
            <div className="space-y-3">
              <Label className="text-base">Licence Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Licence Number</Label>
                  <Input value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} placeholder="e.g. LIC-987654" />
                </div>
                <div className="space-y-1.5">
                  <Label>Issue Date</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Rejection */}
            {(licence?.status === 'rejected' || rejectionReason) && (
              <div className="space-y-1.5">
                <Label>Rejection Reason</Label>
                <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={2} />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." />
            </div>

            {/* Licence Document Upload */}
            <div className="space-y-2">
              <Label>Licence Document</Label>
              {licence?.document_id ? (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadDoc(licence.document_id)}>
                    <Download className="h-3 w-3 mr-1" /> Download existing document
                  </Button>
                  <span className="text-xs text-gray-400">or upload new:</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Upload the licence certificate or approval letter (PDF, JPG, PNG)</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && <p className="text-xs text-gray-500">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {canApply && (
                <Button type="button" variant="default" onClick={() => {
                  setApplicationDate(new Date().toISOString().split('T')[0])
                  setApplicationRef('')
                }} className="flex-1">
                  <Clock className="h-4 w-4 mr-1" /> Mark as Applied
                </Button>
              )}
              {canGrant && (
                <Button type="button" onClick={() => {
                  setIssueDate(new Date().toISOString().split('T')[0])
                  setLicenceNumber('')
                }} className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark as Granted
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
