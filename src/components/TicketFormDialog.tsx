import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { logAudit } from '@/lib/audit'

interface TicketFormDialogProps {
  propertyId: string
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const TICKET_TYPES = [
  { value: 'enquiry', label: 'Enquiry' },
  { value: 'notice', label: 'Notice' },
  { value: 'issue', label: 'Issue/Complaint' },
  { value: 'action_item', label: 'Action Item' },
]

const TICKET_SUBTYPES: Record<string, Array<{ value: string; label: string }>> = {
  enquiry: [
    { value: 'viewing_request', label: 'Viewing Request' },
    { value: 'general_enquiry', label: 'General Enquiry' },
    { value: 'rental_enquiry', label: 'Rental Enquiry' },
  ],
  notice: [
    { value: 'section_21', label: 'Section 21 Notice' },
    { value: 'section_8', label: 'Section 8 Notice' },
    { value: 'rent_increase', label: 'Rent Increase Notice' },
    { value: 'entry_notice', label: 'Entry Notice' },
    { value: 'lease_renewal', label: 'Lease Renewal' },
  ],
  issue: [
    { value: 'noise_complaint', label: 'Noise Complaint' },
    { value: 'maintenance_issue', label: 'Maintenance Issue' },
    { value: 'neighbour_dispute', label: 'Neighbour Dispute' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'other', label: 'Other' },
  ],
  action_item: [
    { value: 'inspection_due', label: 'Inspection Due' },
    { value: 'certificate_renewal', label: 'Certificate Renewal' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'other', label: 'Other' },
  ],
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function TicketFormDialog({ propertyId, open, onClose, onSaved }: TicketFormDialogProps) {
  const [type, setType] = useState('enquiry')
  const [subtype, setSubtype] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setType('enquiry')
      setSubtype('')
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      await (supabase.from('property_tickets') as any).insert({
        property_id: propertyId,
        type,
        subtype: subtype || null,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'open',
        due_date: dueDate || null,
      })
      logAudit({ action: 'ticket_created', resource: 'property', resourceId: propertyId, details: { type, title: title.trim(), priority } })
      onSaved()
    } catch (error) {
      console.error('Failed to create ticket:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Property Ticket</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Ticket Type</Label>
              <Select value={type} onChange={(e) => {
                setType(e.target.value)
                setSubtype('') // Reset subtype when type changes
              }}>
                {TICKET_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>

            {/* Subtype */}
            <div className="space-y-1.5">
              <Label>Subtype</Label>
              <Select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
                <option value="">Select subtype...</option>
                {(TICKET_SUBTYPES[type] ?? []).map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the ticket"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description..."
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
