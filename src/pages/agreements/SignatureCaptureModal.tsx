import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, PenLine, ChevronRight, User, Eye, Hand, Trash2 } from 'lucide-react'
import SignaturePad from 'signature_pad'
import { embedSignaturesIntoAgreement } from '@/utils/agreements'
import { useSwipe } from '@/hooks/useSwipe'
import { useToast } from '@/contexts/ToastContext'

interface Signatory {
  type: 'tenant' | 'agent'
  id: string | null
  name: string
  witnessEnabled: boolean
}

interface WitnessData {
  name: string
  address: string
  occupation: string
  signature: string | null
}

interface SignatureCaptureModalProps {
  agreementId: string
  onClose: () => void
  onCompleted: () => void
}

declare global {
  interface Window {
    SigWebTablet?: {
      GetSigImageB64: () => string
      SetDisplayXSize: (n: number) => void
      SetDisplayYSize: (n: number) => void
      SetTabletState: (state: number, ctx: any, interval: number) => void
      GetTabletState: () => number
    }
  }
}

async function detectTopaz(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:47290', { signal: AbortSignal.timeout(800) })
    return res.ok || res.status === 405
  } catch {
    return false
  }
}

export default function SignatureCaptureModal({ agreementId, onClose, onCompleted }: SignatureCaptureModalProps) {
  const [signatories, setSignatories] = useState<Signatory[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<'signatory' | 'witness'>('signatory')
  const [signatures, setSignatures] = useState<Record<number, string>>({})
  const [witnessData, setWitnessData] = useState<Record<number, WitnessData>>({})
  const [topazAvailable, setTopazAvailable] = useState(false)
  const [captureMode, setCaptureMode] = useState<'detecting' | 'topaz' | 'touch'>('detecting')
  const [saving, setSaving] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 560, height: 200 })
  const [isLandscape, setIsLandscape] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)
  const { success, error: showError } = useToast()

  const { data: agreement } = useQuery({
    queryKey: ['agreement-detail', agreementId],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_agreements')
        .select('*, tenancies(landlord_id, landlords(full_name), tenancy_tenants(tenant_id, is_lead, tenants(full_name)))')
        .eq('id', agreementId)
        .single()
      return data
    },
  })

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-signature'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('company_name').limit(1).single()
      return data as any
    },
  })

  // Build signatory queue: tenant(s) first, then agent
  useEffect(() => {
    if (!agreement) return
    const list: Signatory[] = []

    const tenancyTenants = (agreement as any).tenancies?.tenancy_tenants ?? []
    tenancyTenants.forEach((tt: any) => {
      list.push({ type: 'tenant', id: tt.tenant_id, name: tt.tenants?.full_name ?? 'Tenant', witnessEnabled: false })
    })

    const agentName = companySettings?.company_name
      ? `${companySettings.company_name} (Agent)`
      : 'Letting Agent'
    list.push({ type: 'agent', id: currentUser?.id ?? null, name: agentName, witnessEnabled: false })

    setSignatories(list)
  }, [agreement, currentUser, companySettings])

  // Detect Topaz on mount
  useEffect(() => {
    detectTopaz().then((available) => {
      setTopazAvailable(available)
      setCaptureMode(available ? 'topaz' : 'touch')
    })
  }, [])

  // Init touch signature pad when mode is touch
  useEffect(() => {
    // Cleanup previous instance first
    if (sigPadRef.current) {
      sigPadRef.current.clear()
      sigPadRef.current = null
    }
    
    if (captureMode === 'touch' && canvasRef.current) {
      const isMobile = window.innerWidth < 768
      const canvas = canvasRef.current
      
      sigPadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(0,0,0)',
        minWidth: isMobile ? 1.5 : 1,
        maxWidth: isMobile ? 3.5 : 3,
        dotSize: isMobile ? 2 : 1,
        velocityFilterWeight: 0.7,
      })
      
      // Add haptic feedback on touch devices
      const handlePointerDown = () => {
        setIsDrawing(true)
      }
      const handlePointerUp = () => {
        setIsDrawing(false)
        if (navigator.vibrate) navigator.vibrate(10)
      }
      
      canvas.addEventListener('pointerdown', handlePointerDown)
      canvas.addEventListener('pointerup', handlePointerUp)
      
      // Cleanup function
      return () => {
        if (sigPadRef.current) {
          sigPadRef.current.clear()
          sigPadRef.current = null
        }
        canvas.removeEventListener('pointerdown', handlePointerDown)
        canvas.removeEventListener('pointerup', handlePointerUp)
      }
    }
    
    // Cleanup when switching away from touch mode
    return () => {
      if (sigPadRef.current) {
        sigPadRef.current.clear()
        sigPadRef.current = null
      }
    }
  }, [captureMode, currentIdx, phase])

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth
      const isMobile = width < 640
      const isTablet = width >= 640 && width < 1024
      
      if (isMobile) {
        setCanvasSize({ width: Math.min(width - 48, 400), height: 180 })
      } else if (isTablet) {
        setCanvasSize({ width: Math.min(width - 96, 560), height: 200 })
      } else {
        setCanvasSize({ width: 560, height: 200 })
      }
      
      setIsLandscape(width > window.innerHeight)
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Session persistence - restore on mount
  useEffect(() => {
    const saved = localStorage.getItem(`signature-session-${agreementId}`)
    if (saved) {
      try {
        const session = JSON.parse(saved)
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
          setSignatures(session.signatures || {})
          setWitnessData(session.witnessData || {})
          setCurrentIdx(session.currentIdx || 0)
          setPhase(session.phase || 'signatory')
        }
      } catch {
        localStorage.removeItem(`signature-session-${agreementId}`)
      }
    }
  }, [agreementId])

  // Session persistence - save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(signatures).length > 0) {
        localStorage.setItem(`signature-session-${agreementId}`, JSON.stringify({
          signatures,
          witnessData,
          currentIdx,
          phase,
          timestamp: Date.now(),
        }))
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [signatures, witnessData, currentIdx, phase, agreementId])

  function clearPad() {
    sigPadRef.current?.clear()
  }

  function getSignatureFromPad(): string | null {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return null
    return sigPadRef.current.toDataURL('image/png')
  }

  async function captureTopaz(): Promise<string | null> {
    if (!window.SigWebTablet) return null
    return new Promise((resolve) => {
      try {
        window.SigWebTablet!.SetDisplayXSize(400)
        window.SigWebTablet!.SetDisplayYSize(150)
        const timer = setInterval(() => {
          const state = window.SigWebTablet!.GetTabletState()
          if (state === 1) {
            clearInterval(timer)
            const b64 = window.SigWebTablet!.GetSigImageB64()
            resolve(b64 ? `data:image/png;base64,${b64}` : null)
          }
        }, 500)
        setTimeout(() => { clearInterval(timer); resolve(null) }, 60000)
      } catch {
        resolve(null)
      }
    })
  }

  async function handleCapture() {
    let sig: string | null = null
    if (captureMode === 'topaz') {
      sig = await captureTopaz()
    } else {
      sig = getSignatureFromPad()
    }
    if (!sig) {
      alert('Please provide a signature before proceeding.')
      return
    }

    if (phase === 'signatory') {
      setSignatures((prev) => ({ ...prev, [currentIdx]: sig! }))
      // If witness is enabled for this signatory, move to witness phase
      if (signatories[currentIdx].witnessEnabled) {
        setPhase('witness')
        clearPad()
      } else {
        advanceToNext()
      }
    } else {
      // Witness signature captured
      setWitnessData((prev) => ({
        ...prev,
        [currentIdx]: { ...prev[currentIdx], signature: sig! },
      }))
      advanceToNext()
    }
  }

  function advanceToNext() {
    if (currentIdx < signatories.length - 1) {
      setCurrentIdx((i) => i + 1)
      setPhase('signatory')
      clearPad()
    } else {
      finalise()
    }
  }

  function updateWitnessField(field: keyof WitnessData, value: string) {
    setWitnessData((prev) => ({
      ...prev,
      [currentIdx]: { ...prev[currentIdx], [field]: value, signature: prev[currentIdx]?.signature ?? null },
    }))
  }

  function toggleWitness(idx: number, enabled: boolean) {
    setSignatories((prev) => prev.map((s, i) => i === idx ? { ...s, witnessEnabled: enabled } : s))
    if (!enabled) {
      setWitnessData((prev) => {
        const copy = { ...prev }
        delete copy[idx]
        return copy
      })
    } else if (!witnessData[idx]) {
      setWitnessData((prev) => ({ ...prev, [idx]: { name: '', address: '', occupation: '', signature: null } }))
    }
  }

  async function finalise() {
    setSaving(true)
    
    try {
      // Save session before submission
      localStorage.setItem(`signature-session-${agreementId}`, JSON.stringify({
        signatures,
        witnessData,
        currentIdx,
        phase,
        timestamp: Date.now(),
      }))

      // Collect all signature inserts
      const signatureInserts = signatories.map((signatory, i) => {
        const witness = signatory.witnessEnabled ? witnessData[i] : null
        return (supabase.from('agreement_signatures') as any).insert({
          agreement_id: agreementId,
          signatory_type: signatory.type,
          signatory_id: signatory.type === 'tenant' ? signatory.id : null,
          signatory_name: signatory.name,
          signature_image_base64: signatures[i],
          capture_method: captureMode === 'topaz' ? 'topaz' : 'touch',
          signed_by_user_id: signatory.type === 'agent' ? currentUser?.id : null,
          signed_at: new Date().toISOString(),
          witness_name: witness?.name || null,
          witness_address: witness?.address || null,
          witness_occupation: witness?.occupation || null,
          witness_signature_base64: witness?.signature || null,
        })
      })

      // Execute all inserts in parallel
      const results = await Promise.all(signatureInserts) as any[]
      const errors = results.filter((r: any) => r.error)
      
      if (errors.length > 0) {
        throw new Error(`Failed to save ${errors.length} signature(s): ${errors[0].error.message}`)
      }

      // Update agreement status to signed
      const { error: updateError } = await (supabase.from('generated_agreements') as any).update({
        status: 'signed',
        signed_at: new Date().toISOString(),
      }).eq('id', agreementId)

      if (updateError) {
        throw new Error(`Failed to update agreement status: ${updateError.message}`)
      }

      // Embed signatures into agreement HTML
      await embedSignaturesIntoAgreement(agreementId)
      
      // Clear session on successful completion
      localStorage.removeItem(`signature-session-${agreementId}`)
      
      success('Signatures saved', 'Agreement has been signed successfully')
      onCompleted()
    } catch (err) {
      console.error('Signature finalization failed:', err)
      showError('Signature Failed', err instanceof Error ? err.message : 'Failed to save signatures. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Determine if the current step can proceed
  const canProceed = (() => {
    if (phase === 'signatory') return !!signatures[currentIdx]
    // Witness phase: need all witness fields filled + signature
    const w = witnessData[currentIdx]
    return w?.name && w?.address && w?.occupation && w?.signature
  })()

  const current = signatories[currentIdx]
  const totalSteps = signatories.reduce((acc, s) => acc + (s.witnessEnabled ? 2 : 1), 0)
  const completedSteps = signatories.slice(0, currentIdx).reduce((acc, s) => acc + (s.witnessEnabled ? 2 : 1), 0) + (phase === 'witness' ? 1 : (signatures[currentIdx] ? 1 : 0))
  
  // Swipe navigation for signatories (disabled while drawing)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe({
    onSwipeLeft: () => {
      if (!isDrawing && currentIdx < signatories.length - 1) {
        advanceToNext()
      }
    },
    onSwipeRight: () => {
      if (!isDrawing && currentIdx > 0) {
        setCurrentIdx((i) => i - 1)
        setPhase('signatory')
        clearPad()
      }
    },
    threshold: 60,
  })

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-full sm:max-w-2xl mx-0 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg sm:text-xl">Sign Tenancy Agreement</DialogTitle>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {signatories.length} signature{(signatories.length > 1 ? 's' : '')} required
          </p>
        </DialogHeader>
        <div 
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress stepper */}
          {/* Mobile view (<640px) */}
          <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-4">
            <span className="text-sm font-medium">Signer {currentIdx + 1} of {signatories.length}</span>
            <Badge variant="outline" className="text-xs">{current?.type === 'agent' ? 'Agent' : current?.name}</Badge>
          </div>
          
          {/* Desktop view (≥640px) - horizontal stepper */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
            {signatories.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-start gap-0.5">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    i < currentIdx
                      ? 'bg-green-100 text-green-700'
                      : i === currentIdx && phase === 'signatory'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentIdx ? <CheckCircle className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                    {s.type === 'agent' ? 'Agent' : s.name}
                  </div>
                  {s.witnessEnabled && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ml-3 ${
                      i < currentIdx
                        ? 'bg-green-50 text-green-600'
                        : i === currentIdx && phase === 'witness'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      <Eye className="h-2.5 w-2.5" />
                      Witness
                    </div>
                  )}
                </div>
                {i < signatories.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1 shrink-0" />}
              </div>
            ))}
          </div>

          {/* Current signer */}
          {current && (
            <div className="space-y-4">
              {/* Signatory phase */}
              {phase === 'signatory' && (
                <>
                  <div className={`rounded-lg border p-3 sm:p-4 text-sm ${current.type === 'agent' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <strong>{current.name}</strong>
                    {current.type === 'tenant' ? ' (Tenant)' : ' (Agent — signing on behalf of the letting agency)'}
                    {' '}— please sign below
                  </div>

                  {/* Witness toggle - touch-friendly */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={current.witnessEnabled}
                      onChange={(e) => toggleWitness(currentIdx, e.target.checked)}
                      disabled={!!signatures[currentIdx]}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium">Witness required for this signature</span>
                  </label>

                  {/* Capture mode toggle - touch-friendly grid */}
                  {topazAvailable && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCaptureMode('topaz')}
                        className={`h-12 rounded-lg border-2 font-medium text-sm flex items-center justify-center gap-2 ${
                          captureMode === 'topaz' 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'border-gray-300 text-gray-600 active:bg-gray-50'
                        }`}
                      >
                        <PenLine className="h-4 w-4" />
                        Topaz Pad
                      </button>
                      <button
                        onClick={() => setCaptureMode('touch')}
                        className={`h-12 rounded-lg border-2 font-medium text-sm flex items-center justify-center gap-2 ${
                          captureMode === 'touch' 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'border-gray-300 text-gray-600 active:bg-gray-50'
                        }`}
                      >
                        <Hand className="h-4 w-4" />
                        Touch / Mouse
                      </button>
                    </div>
                  )}

                  {captureMode === 'touch' && (
                    <div className="space-y-2">
                      <div ref={canvasContainerRef} className="relative">
                        <canvas
                          ref={canvasRef}
                          width={canvasSize.width}
                          height={canvasSize.height}
                          className="border-2 border-dashed border-gray-300 rounded-lg w-full touch-none bg-white"
                          style={{ touchAction: 'none' }}
                          aria-label="Signature pad - sign here with your finger or stylus"
                        />
                        {!sigPadRef.current?.isEmpty() && (
                          <button
                            onClick={() => {
                              if (window.confirm('Clear signature?')) {
                                clearPad()
                              }
                            }}
                            className="absolute top-2 right-2 h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                            aria-label="Clear signature"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear
                          </button>
                        )}
                        {sigPadRef.current?.isEmpty() && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-gray-400 text-sm">Sign here with your finger or stylus</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {captureMode === 'topaz' && (
                    <div className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-8 text-center space-y-2">
                      <PenLine className="h-10 w-10 mx-auto text-purple-400" />
                      <p className="text-sm text-purple-700 font-medium">Sign on the Topaz pad</p>
                      <p className="text-xs text-purple-500">The pad is active — sign and press confirm on the device</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <p className="text-sm text-gray-500">
                      Step {completedSteps + 1} of {totalSteps}
                    </p>
                    <Button 
                      onClick={handleCapture} 
                      disabled={saving}
                      className="h-12 px-6 text-base"
                    >
                      {saving ? 'Saving…' : current.witnessEnabled ? 'Next: Witness' : (currentIdx < signatories.length - 1 ? 'Next Signatory' : 'Complete & Save')}
                    </Button>
                  </div>
                </>
              )}

              {/* Witness phase */}
              {phase === 'witness' && (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <strong>Witness</strong> for <strong>{current.name}</strong> — please complete the details below and sign
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Witness Full Name *</Label>
                      <Input
                        value={witnessData[currentIdx]?.name ?? ''}
                        onChange={(e) => updateWitnessField('name', e.target.value)}
                        placeholder="e.g. John Smith"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Witness Address *</Label>
                      <Input
                        value={witnessData[currentIdx]?.address ?? ''}
                        onChange={(e) => updateWitnessField('address', e.target.value)}
                        placeholder="e.g. 123 High Street, London, SW1A 1AA"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Witness Occupation *</Label>
                      <Input
                        value={witnessData[currentIdx]?.occupation ?? ''}
                        onChange={(e) => updateWitnessField('occupation', e.target.value)}
                        placeholder="e.g. Solicitor"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Witness Signature *</Label>
                    {captureMode === 'touch' && (
                      <div ref={canvasContainerRef} className="relative">
                        <canvas
                          ref={canvasRef}
                          width={canvasSize.width}
                          height={Math.round(canvasSize.height * 0.75)}
                          className="border-2 border-dashed border-amber-300 rounded-lg w-full touch-none bg-white"
                          style={{ touchAction: 'none' }}
                          aria-label="Witness signature pad"
                        />
                        {sigPadRef.current && !sigPadRef.current.isEmpty() && (
                          <button
                            onClick={() => {
                              if (window.confirm('Clear witness signature?')) {
                                clearPad()
                              }
                            }}
                            className="absolute top-2 right-2 h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                            aria-label="Clear witness signature"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                    {captureMode === 'topaz' && (
                      <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center space-y-2">
                        <PenLine className="h-8 w-8 mx-auto text-amber-400" />
                        <p className="text-sm text-amber-700 font-medium">Witness: Sign on the Topaz pad</p>
                        <p className="text-xs text-amber-500">Sign and press confirm on the device</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <p className="text-sm text-gray-500">
                      Step {completedSteps + 1} of {totalSteps}
                    </p>
                    <Button 
                      onClick={handleCapture} 
                      disabled={saving || !canProceed}
                      className="h-12 px-6 text-base"
                    >
                      {saving ? 'Saving…' : (currentIdx < signatories.length - 1 ? 'Next Signatory' : 'Complete & Save')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
