import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, Clock, FileText, Upload, Trash2, Star, ShieldCheck, Ticket, Download, Calendar, Eye, MessageSquare, Zap, ClipboardList, Home, MapPin, PoundSterling, FileCheck, Settings, Globe, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDate, getComplianceStatus, getDaysUntil } from '@/lib/utils'
import ComplianceFormDialog from '@/components/ComplianceFormDialog'
import PropertyTimeline from '@/components/PropertyTimeline'
import HomeSafeLicenceDialog from '@/components/HomeSafeLicenceDialog'
import TicketFormDialog from '@/components/TicketFormDialog'
import ViewingFormDialog from '@/components/ViewingFormDialog'
import ViewingFeedbackDialog from '@/components/ViewingFeedbackDialog'
import PhotoLightbox from '@/components/PhotoLightbox'
import InventoryItemsTab from '@/components/InventoryItemsTab'
import { compressImage, generatePhotoFilename, isJPEG, formatFileSize } from '@/utils/image-compression'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/contexts/ToastContext'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, landlords(full_name, email, phone)')
        .eq('id', id!)
        .single()
      return (data as any) || null
    },
  })

  const { data: compliance } = useQuery({
    queryKey: ['compliance', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_compliance')
        .select('*')
        .eq('property_id', id!)
        .order('expiry_date', { ascending: true })
      return data ?? []
    },
  })

  const { data: maintenanceRequests } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('property_id', id!)
        .order('created_at', { ascending: false })
        .limit(10)
      return data ?? []
    },
  })

  const { data: tenancies } = useQuery({
    queryKey: ['tenancies-property', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancies')
        .select('*, tenancy_tenants(tenants(full_name))')
        .eq('property_id', id!)
        .order('start_date', { ascending: false })
      return data ?? []
    },
  })

  const { data: propertyViewings } = useQuery({
    queryKey: ['property-viewings', id],
    queryFn: async () => {
      const { data } = await (supabase.from('property_viewings') as any)
        .select('*')
        .eq('property_id', id!)
        .order('scheduled_at', { ascending: false })
        .limit(10)
      return (data ?? []) as any[]
    },
  })

  const [showCompliance, setShowCompliance] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showLicence, setShowLicence] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [showViewingForm, setShowViewingForm] = useState(false)
  const [feedbackViewing, setFeedbackViewing] = useState<any>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    features: false,
    location: false,
    financial: false,
    descriptions: false,
    media: false,
    compliance: false,
    management: false,
    website: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const { data: photos } = useQuery({
    queryKey: ['property-photos', id],
    queryFn: async () => {
      const { data } = await supabase.from('property_photos').select('*').eq('property_id', id!).order('is_primary', { ascending: false }).order('created_at')
      const photos = data ?? []
      return await Promise.all(
        photos.map(async (photo: any) => {
          const { data: urlData } = await supabase.storage.from('property-photos').createSignedUrl(photo.storage_path, 3600)
          return { ...photo, signedUrl: urlData?.signedUrl ?? '' }
        })
      )
    },
  })

  const { data: homeSafeLicence } = useQuery({
    queryKey: ['home-safe-licence', id],
    queryFn: async () => {
      const { data } = await supabase.from('property_home_safe_licences').select('*').eq('property_id', id!).maybeSingle()
      return data as any
    },
  })

  if (!property) return <div className="p-6 text-gray-400">Loading…</div>

  async function handleDownloadDoc(documentId: string) {
    const { data: doc } = await supabase.from('documents').select('storage_path').eq('id', documentId).single()
    if (!doc) return
    const { data } = await supabase.storage.from('documents').createSignedUrl((doc as any).storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/properties">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.address}</h1>
          <p className="text-gray-500 text-sm">
            <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 mr-1.5">{property.reference_number}</span>
            {property.postcode} — {property.type}
          </p>
        </div>
        <Badge variant={property.status === 'let' ? 'default' : property.status === 'available' ? 'success' : 'destructive'} className="ml-auto">
          {property.status}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setShowTicket(true)}>
          <Ticket className="h-4 w-4 mr-2" /> Add Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property info */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Bedrooms</span><span>{property.bedrooms ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bathrooms</span><span>{property.bathrooms ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">EPC Rating</span><span>{property.epc_rating ?? '—'}</span></div>
            {property.description && (
              <p className="text-gray-600 border-t pt-3">{property.description}</p>
            )}
            {property.utility_note && (
              <div className="border-t pt-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Utility Note</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{property.utility_note}</p>
                  </div>
                </div>
              </div>
            )}
            {property.inventory_note && (
              <div className="border-t pt-3">
                <div className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Inventory Note</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{property.inventory_note}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Home Safe Licence */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Home Safe Licence</CardTitle>
            <Button size="sm" onClick={() => setShowLicence(true)}>Manage</Button>
          </CardHeader>
          <CardContent>
            {homeSafeLicence ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={
                    homeSafeLicence.status === 'granted' ? 'success' :
                    homeSafeLicence.status === 'applied' || homeSafeLicence.status === 'under_review' ? 'default' :
                    homeSafeLicence.status === 'rejected' ? 'destructive' : 'secondary'
                  }>{homeSafeLicence.status.replace('_', ' ')}</Badge>
                </div>
                {homeSafeLicence.licence_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Licence #</span>
                    <span className="font-mono">{homeSafeLicence.licence_number}</span>
                  </div>
                )}
                {homeSafeLicence.licence_expiry_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires</span>
                    <span>{formatDate(homeSafeLicence.licence_expiry_date)}</span>
                  </div>
                )}
                {homeSafeLicence.document_id && (
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownloadDoc(homeSafeLicence.document_id)}>
                      <Download className="h-3 w-3 mr-1" /> View Licence Document
                    </Button>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Certificates:</p>
                  <div className="flex flex-wrap gap-1">
                    {homeSafeLicence.has_gas_safe && <Badge variant="success" className="text-xs">Gas Safe</Badge>}
                    {homeSafeLicence.has_eicr && <Badge variant="success" className="text-xs">EICR</Badge>}
                    {homeSafeLicence.has_epc && <Badge variant="success" className="text-xs">EPC</Badge>}
                    {homeSafeLicence.has_fire_risk_assessment && <Badge variant="success" className="text-xs">Fire Risk</Badge>}
                    {homeSafeLicence.has_legionella_risk && <Badge variant="success" className="text-xs">Legionella</Badge>}
                    {homeSafeLicence.has_smoke_co_alarms && <Badge variant="success" className="text-xs">Smoke/CO</Badge>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400 text-sm">No licence record</p>
                <Button variant="link" size="sm" onClick={() => setShowLicence(true)} className="mt-2">Create Record</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Features */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('features')}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Features
              </CardTitle>
              {expandedSections.features ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.features && (
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Subtype</p>
                <p className="font-medium">{property.property_subtype || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Floor</p>
                <p className="font-medium">{property.floor_number ? `Floor ${property.floor_number}${property.total_floors ? ` of ${property.total_floors}` : ''}` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Furnished</p>
                <p className="font-medium">{property.furnished_status || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Lift Access</p>
                <p className="font-medium">{property.lift_access ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Garden</p>
                <p className="font-medium">{property.has_garden ? (property.garden_type || 'Yes') : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Balcony/Terrace/Patio</p>
                <p className="font-medium">
                  {[property.has_balcony && 'Balcony', property.has_terrace && 'Terrace', property.has_patio && 'Patio'].filter(Boolean).join(', ') || 'None'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Parking</p>
                <p className="font-medium">{property.has_parking ? (property.parking_type || `Yes (${property.parking_spaces} spaces)`) : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Heating</p>
                <p className="font-medium">{property.heating_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Hot Water</p>
                <p className="font-medium">{property.hot_water_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Double Glazing</p>
                <p className="font-medium">{property.has_double_glazing ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Reception Rooms</p>
                <p className="font-medium">{property.reception_rooms || 1}</p>
              </div>
              <div>
                <p className="text-gray-500">Kitchen Type</p>
                <p className="font-medium">{property.kitchen_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Broadband</p>
                <p className="font-medium">{property.broadband_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Smart Home</p>
                <p className="font-medium">{property.has_smart_home ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Location & Area */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('location')}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Area
              </CardTitle>
              {expandedSections.location ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.location && (
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Nearest Station</p>
                  <p className="font-medium">{property.nearest_station || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Distance</p>
                  <p className="font-medium">{property.station_distance_minutes ? `${property.station_distance_minutes} min` : '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Council Tax Band</p>
                <p className="font-medium">{property.council_tax_band || '—'}</p>
              </div>
              {property.neighborhood_description && (
                <div>
                  <p className="text-gray-500 mb-1">Neighborhood</p>
                  <p className="text-sm">{property.neighborhood_description}</p>
                </div>
              )}
              {property.transport_links && (
                <div>
                  <p className="text-gray-500 mb-1">Transport Links</p>
                  <p className="text-sm">{property.transport_links}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('financial')}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="h-5 w-5" />
                Financial Details
              </CardTitle>
              {expandedSections.financial ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.financial && (
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Monthly Rent</p>
                <p className="font-medium text-lg">{property.monthly_rent ? `£${property.monthly_rent}` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Deposit</p>
                <p className="font-medium">{property.deposit_amount ? `£${property.deposit_amount}` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Minimum Term</p>
                <p className="font-medium">{property.minimum_term_months ? `${property.minimum_term_months} months` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Available From</p>
                <p className="font-medium">{property.available_from ? formatDate(property.available_from) : '—'}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Landlord */}
        <Card>
          <CardHeader><CardTitle>Landlord</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {property.landlords ? (
              <>
                <p className="font-medium">{property.landlords.full_name}</p>
                <p className="text-gray-500">{property.landlords.email}</p>
                <p className="text-gray-500">{property.landlords.phone ?? '—'}</p>
                <Link to={`/landlords`} className="text-blue-600 hover:underline text-xs">View landlord →</Link>
              </>
            ) : (
              <p className="text-gray-400">No landlord assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Compliance summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compliance</CardTitle>
            <Button size="sm" onClick={() => setShowCompliance(true)}><Plus className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            {compliance?.length === 0 ? (
              <p className="text-sm text-gray-400">No compliance records</p>
            ) : (
              <ul className="space-y-2">
                {(compliance ?? []).map((c: any) => {
                  const status = getComplianceStatus(c.expiry_date)
                  return (
                    <li key={c.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-gray-700">{c.type.replace(/_/g, ' ')}</span>
                        {c.document_id && (
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="Download certificate" onClick={() => handleDownloadDoc(c.document_id)}>
                            <Download className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {status === 'valid' && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {status === 'expiring_soon' && <Clock className="h-3 w-3 text-amber-500" />}
                        {status === 'expired' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <span className={
                          status === 'expired' ? 'text-red-600' :
                          status === 'expiring_soon' ? 'text-amber-600' : 'text-green-600'
                        }>
                          {formatDate(c.expiry_date)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Property Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryItemsTab propertyId={id!} />
          </CardContent>
        </Card>
      </div>

      {/* Tenancies */}
      <Card>
        <CardHeader><CardTitle>Tenancy History</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenants</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Rent/month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tenancies ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-6">No tenancies</TableCell></TableRow>
            ) : (tenancies ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>
                  {(t.tenancy_tenants ?? []).map((tt: any) => tt.tenants?.full_name).join(', ') || '—'}
                </TableCell>
                <TableCell>{formatDate(t.start_date)}</TableCell>
                <TableCell>{formatDate(t.end_date)}</TableCell>
                <TableCell>£{t.rent_amount?.toLocaleString()}</TableCell>
                <TableCell><Badge variant={t.status === 'active' ? 'success' : 'secondary'}>{t.status}</Badge></TableCell>
                <TableCell>
                  <Link to={`/tenancies/${t.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader><CardTitle>Recent Maintenance</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(maintenanceRequests ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-6">No maintenance requests</TableCell></TableRow>
            ) : (maintenanceRequests ?? []).map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>
                  <Badge variant={m.priority === 'urgent' ? 'destructive' : m.priority === 'high' ? 'warning' : 'secondary'}>
                    {m.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={m.status === 'resolved' ? 'success' : m.status === 'open' ? 'destructive' : 'secondary'}>
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(m.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Viewings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Viewings ({(propertyViewings ?? []).length})</CardTitle>
          <Button size="sm" onClick={() => setShowViewingForm(true)}>
            <Calendar className="h-4 w-4 mr-1" /> Schedule Viewing
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Prospect</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(propertyViewings ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-6">No viewings scheduled</TableCell></TableRow>
            ) : (propertyViewings ?? []).map((v: any) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{formatDate(v.scheduled_at)}</TableCell>
                <TableCell>{v.prospect_name}</TableCell>
                <TableCell className="capitalize">{v.source?.replace('_', ' ') ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={v.status === 'scheduled' ? 'default' : v.status === 'completed' ? 'success' : v.status === 'converted' ? 'default' : v.status === 'no_show' ? 'destructive' : 'secondary'}>
                    {v.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{v.rating?.replace('_', ' ') ?? '—'}</TableCell>
                <TableCell>
                  {v.status === 'scheduled' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setFeedbackViewing(v)}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Feedback
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Photo Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Photos ({(photos ?? []).length})</CardTitle>
          <Button size="sm" onClick={() => setShowPhotoUpload(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload Photos
          </Button>
        </CardHeader>
        <CardContent>
          {(photos ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-8">No photos uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(photos as any[]).map((photo, idx) => {
                return (
                  <div key={photo.id} className="relative group cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                    <img src={photo.signedUrl} alt="Property" className="w-full h-32 object-cover rounded-lg border" />
                    {photo.is_primary && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Star className="h-3 w-3" /> Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      {!photo.is_primary && (
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={async () => {
                          await supabase.from('property_photos').update({ is_primary: false } as any).eq('property_id', id)
                          await supabase.from('property_photos').update({ is_primary: true } as any).eq('id', photo.id)
                          qc.invalidateQueries({ queryKey: ['property-photos', id] })
                        }}>Set Primary</Button>
                      )}
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={async () => {
                        await supabase.storage.from('property-photos').remove([photo.storage_path])
                        await supabase.from('property_photos').delete().eq('id', photo.id)
                        qc.invalidateQueries({ queryKey: ['property-photos', id] })
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoUploadDialog open={showPhotoUpload} onClose={() => setShowPhotoUpload(false)} propertyId={id!} />

      <PhotoLightbox
        photos={(photos as any[] ?? []).map((p: any) => ({ id: p.id, url: p.signedUrl }))}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />

      <HomeSafeLicenceDialog open={showLicence} onClose={() => setShowLicence(false)} propertyId={id!} />

      <ComplianceFormDialog
        open={showCompliance}
        onClose={() => setShowCompliance(false)}
        propertyId={id!}
      />

      {/* Activity Timeline */}
      <PropertyTimeline propertyId={id!} />

      {/* Ticket Dialog */}
      {showTicket && (
        <TicketFormDialog
          propertyId={id!}
          open={showTicket}
          onClose={() => setShowTicket(false)}
          onSaved={() => {
            setShowTicket(false)
            qc.invalidateQueries({ queryKey: ['property-timeline', id] })
          }}
        />
      )}

      {/* Viewing Form Dialog */}
      <ViewingFormDialog
        open={showViewingForm}
        onClose={() => setShowViewingForm(false)}
        propertyId={id!}
        onSaved={() => {
          setShowViewingForm(false)
          qc.invalidateQueries({ queryKey: ['property-viewings', id] })
        }}
      />

      {/* Viewing Feedback Dialog */}
      <ViewingFeedbackDialog
        open={!!feedbackViewing}
        onClose={() => setFeedbackViewing(null)}
        viewing={feedbackViewing}
        onSaved={() => qc.invalidateQueries({ queryKey: ['property-viewings', id] })}
      />
    </div>
  )
}

function PhotoUploadDialog({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number }[]>([])

  // Fetch property details for address-based naming
  const { data: property } = useQuery({
    queryKey: ['property-minimal', propertyId],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('address, postcode')
        .eq('id', propertyId)
        .single()
      return data as any
    },
  })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!files || files.length === 0) return

    setUploading(true)
    setCompressionInfo([])
    const isFirst = !(await supabase.from('property_photos').select('id').eq('property_id', propertyId).limit(1)).data?.length

    const address = property?.address || 'property'
    const postcode = property?.postcode
    
    let failureCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let uploadFile: File | Blob = file
      let compressedSize = file.size

      try {
        // Compress JPEG images
        if (isJPEG(file)) {
          const compressedBlob = await compressImage(file, 1920, 0.8)
          uploadFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })
          compressedSize = compressedBlob.size
        }

        // Generate descriptive filename with property address
        const filename = generatePhotoFilename(address, postcode, i, file.name)
        const path = `${propertyId}/${filename}`

        const { error: uploadErr } = await supabase.storage.from('property-photos').upload(path, uploadFile)
        if (!uploadErr) {
          await supabase.from('property_photos').insert({
            property_id: propertyId,
            storage_path: path,
            is_primary: isFirst && i === 0,
          } as any)

          setCompressionInfo(prev => [...prev, { original: file.size, compressed: compressedSize }])
        } else {
          console.error(`Failed to upload ${file.name}:`, uploadErr)
          failureCount++
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
        failureCount++
      }
    }

    // Show error if any uploads failed
    if (failureCount > 0) {
      showError('Upload Incomplete', `${failureCount} of ${files.length} photos failed to upload`)
    } else {
      success('Photos uploaded', `${files.length} photo(s) uploaded successfully`)
    }

    setUploading(false)
    qc.invalidateQueries({ queryKey: ['property-photos', propertyId] })
    logAudit({ action: 'photo_uploaded', resource: 'property', resourceId: propertyId, details: { count: files.length } })
    setFiles(null)
    setCompressionInfo([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleUpload}>
          <DialogHeader><DialogTitle>Upload Property Photos</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Select Photos</Label>
              <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
              <p className="text-xs text-gray-500">You can select multiple photos at once</p>
            </div>
            {files && files.length > 0 && (
              <div className="border rounded p-3 space-y-2">
                <p className="text-sm font-medium">{files.length} photo(s) selected:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {Array.from(files).map((f, i) => {
                    const info = compressionInfo[i]
                    const saved = info ? info.original - info.compressed : 0
                    const savedPercent = info ? Math.round((saved / info.original) * 100) : 0
                    
                    return (
                      <li key={i} className="flex items-center justify-between">
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-gray-500 ml-2">{formatFileSize(f.size)}</span>
                        {info && saved > 0 && (
                          <span className="text-green-600 ml-2 font-medium">(-{savedPercent}%)</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {compressionInfo.length > 0 && (
                  <div className="pt-2 border-t text-xs text-green-700">
                    ✓ JPEG images will be compressed (max 1920px, 80% quality)
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading || !files || files.length === 0}>
              {uploading ? 'Uploading…' : `Upload ${files?.length ?? 0} Photo(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
