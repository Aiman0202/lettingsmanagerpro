import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CouncilFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    address_line1: string
    address_line2: string
    city: string
    postcode: string
    phone: string
    email: string
    website: string
    contact_person: string
    licensing_required: boolean
    licence_type: string
    notes: string
    required_documents: Array<{
      document_type: string
      is_required: boolean
      description: string
      sort_order: number
    }>
  }) => void
  initialData?: {
    id: string
    name: string
    address_line1: string | null
    address_line2: string | null
    city: string | null
    postcode: string | null
    phone: string | null
    email: string | null
    website: string | null
    contact_person: string | null
    licensing_required: boolean
    licence_type: string | null
    notes: string | null
    required_documents: Array<{
      document_type: string
      is_required: boolean
      description: string | null
      sort_order: number
    }>
  } | null
}

const COMMON_DOCUMENTS = [
  'Gas Safety Certificate',
  'EICR (Electrical Installation Condition Report)',
  'EPC (Energy Performance Certificate)',
  'How to Rent Guide Acknowledgment',
  'Deposit Protection Certificate',
  'Smoke/CO Alarm Test Record',
  'Fire Risk Assessment',
  'Legionella Risk Assessment',
  'HMO Licence',
  'Building Insurance Certificate',
  'Tenant ID Documents',
  'Signed Tenancy Agreement',
]

export default function CouncilFormDialog({ open, onClose, onSave, initialData }: CouncilFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [addressLine1, setAddressLine1] = useState(initialData?.address_line1 ?? '')
  const [addressLine2, setAddressLine2] = useState(initialData?.address_line2 ?? '')
  const [city, setCity] = useState(initialData?.city ?? '')
  const [postcode, setPostcode] = useState(initialData?.postcode ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [website, setWebsite] = useState(initialData?.website ?? '')
  const [contactPerson, setContactPerson] = useState(initialData?.contact_person ?? '')
  const [licensingRequired, setLicensingRequired] = useState(initialData?.licensing_required ?? false)
  const [licenceType, setLicenceType] = useState(initialData?.licence_type ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  
  const [requiredDocuments, setRequiredDocuments] = useState<
    Array<{ document_type: string; is_required: boolean; description: string; sort_order: number }>
  >(
    initialData?.required_documents ?? 
    COMMON_DOCUMENTS.map((doc, idx) => ({
      document_type: doc,
      is_required: idx < 8, // First 8 are required by default
      description: '',
      sort_order: idx,
    }))
  )

  const handleSave = () => {
    if (!name.trim()) return
    
    onSave({
      name: name.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      city: city.trim(),
      postcode: postcode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      contact_person: contactPerson.trim(),
      licensing_required: licensingRequired,
      licence_type: licenceType,
      notes: notes.trim(),
      required_documents: requiredDocuments,
    })
  }

  const toggleDocumentRequired = (index: number) => {
    setRequiredDocuments(prev =>
      prev.map((doc, idx) =>
        idx === index ? { ...doc, is_required: !doc.is_required } : doc
      )
    )
  }

  const updateDocumentDescription = (index: number, description: string) => {
    setRequiredDocuments(prev =>
      prev.map((doc, idx) =>
        idx === index ? { ...doc, description } : doc
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Council' : 'Add Council'}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Council Name */}
          <div className="space-y-1.5">
            <Label>Council Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Birmingham City Council"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label className="text-base">Address</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Address Line 1</Label>
                <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Address Line 2</Label>
                <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <Label className="text-base">Contact Information</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0121 303 1111" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="housing@council.gov.uk" />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.council.gov.uk" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Housing Department" />
              </div>
            </div>
          </div>

          {/* Licensing */}
          <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Label className="text-base">Property Licensing</Label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={licensingRequired}
                onChange={(e) => setLicensingRequired(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="font-medium">Licensing required by this council</span>
            </label>
            {licensingRequired && (
              <div className="space-y-1.5 ml-6">
                <Label>Licence Type</Label>
                <select
                  value={licenceType}
                  onChange={(e) => setLicenceType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="Selective">Selective Licensing</option>
                  <option value="Additional">Additional Licensing</option>
                  <option value="Mandatory">Mandatory HMO Licensing</option>
                </select>
              </div>
            )}
          </div>

          {/* Required Documents */}
          <div className="space-y-3">
            <Label className="text-base">Required Documents for Submission</Label>
            <p className="text-sm text-gray-500">Select which documents this council requires in submission packs</p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {requiredDocuments.map((doc, index) => (
                <div key={index} className="p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={doc.is_required}
                      onChange={() => toggleDocumentRequired(index)}
                      className="h-4 w-4 mt-1"
                    />
                    <div className="flex-1">
                      <label className="text-sm font-medium cursor-pointer" onClick={() => toggleDocumentRequired(index)}>
                        {doc.document_type}
                      </label>
                      <Textarea
                        value={doc.description}
                        onChange={(e) => updateDocumentDescription(index, e.target.value)}
                        placeholder="Add notes about this document requirement..."
                        rows={1}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">
                ✓ {requiredDocuments.filter(d => d.is_required).length} required
              </span>
              <span className="text-gray-500">
                ○ {requiredDocuments.filter(d => !d.is_required).length} optional
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this council..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {initialData ? 'Update Council' : 'Add Council'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
