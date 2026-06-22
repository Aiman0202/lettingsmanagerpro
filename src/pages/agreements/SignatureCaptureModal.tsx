import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, PenLine, ChevronRight } from 'lucide-react'
import SignaturePad from 'signature_pad'
import { embedSignaturesIntoAgreement } from '@/utils/agreements'

interface Signatory {
  type: 'tenant' | 'agent'
  id: string | null
  name: string
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [signatures, setSignatures] = useState<Record<number, string>>({})
  const [topazAvailable, setTopazAvailable] = useState(false)
  const [captureMode, setCaptureMode] = useState<'detecting' | 'topaz' | 'touch'>('detecting')
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)

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
      list.push({ type: 'tenant', id: tt.tenant_id, name: tt.tenants?.full_name ?? 'Tenant' })
    })

    // Agent — the logged-in letting agency staff member
    const agentName = companySettings?.company_name
      ? `${companySettings.company_name} (Agent)`
      : 'Letting Agent'
    list.push({ type: 'agent', id: currentUser?.id ?? null, name: agentName })

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
    if (captureMode === 'touch' && canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(0,0,0)',
        minWidth: 1,
        maxWidth: 3,
      })
    }
    return () => { sigPadRef.current = null }
  }, [captureMode, currentIndex])

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
    setSignatures((prev) => ({ ...prev, [currentIndex]: sig! }))
    if (currentIndex < signatories.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      await finalise(sig)
    }
  }

  async function finalise(lastSig: string) {
    setSaving(true)
    const allSigs = { ...signatures, [currentIndex]: lastSig }

    // Save each signature to DB
    for (let i = 0; i < signatories.length; i++) {
      const signatory = signatories[i]
      await supabase.from('agreement_signatures').insert({
        agreement_id: agreementId,
        signatory_type: signatory.type,
        signatory_id: signatory.type === 'tenant' ? signatory.id : null,
        signatory_name: signatory.name,
        signature_image_base64: allSigs[i],
        capture_method: captureMode === 'topaz' ? 'topaz' : 'touch',
        signed_by_user_id: signatory.type === 'agent' ? currentUser?.id : null,
        signed_at: new Date().toISOString(),
      } as any)
    }

    // Update agreement status to signed
    await (supabase.from('generated_agreements') as any).update({
      status: 'signed',
      signed_at: new Date().toISOString(),
    }).eq('id', agreementId)

    // Embed signatures into agreement HTML
    await embedSignaturesIntoAgreement(agreementId)

    setSaving(false)
    onCompleted()
  }

  const current = signatories[currentIndex]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Collect Signatures — {signatories.length} of {signatories.length} required</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          {/* Progress stepper */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {signatories.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  i < currentIndex
                    ? 'bg-green-100 text-green-700'
                    : i === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < currentIndex ? <CheckCircle className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                  {s.type === 'agent' ? 'Agent' : s.name}
                </div>
                {i < signatories.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />}
              </div>
            ))}
          </div>

          {/* Current signer */}
          {current && (
            <div className="space-y-4">
              <div className={`rounded-lg border p-3 text-sm ${current.type === 'agent' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <strong>{current.name}</strong>
                {current.type === 'tenant' ? ' (Tenant)' : ' (Agent — signing on behalf of the letting agency)'}
                {' '}— please sign below
              </div>

              {/* Capture mode toggle */}
              {topazAvailable && (
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setCaptureMode('topaz')}
                    className={`px-3 py-1.5 rounded border font-medium ${captureMode === 'topaz' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Topaz Pad
                  </button>
                  <button
                    onClick={() => setCaptureMode('touch')}
                    className={`px-3 py-1.5 rounded border font-medium ${captureMode === 'touch' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Touch / Mouse
                  </button>
                </div>
              )}

              {captureMode === 'touch' && (
                <div className="space-y-2">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={200}
                    className="border-2 border-dashed border-gray-300 rounded-lg w-full touch-none bg-white"
                    style={{ touchAction: 'none' }}
                  />
                  <Button variant="outline" size="sm" onClick={clearPad}>Clear</Button>
                </div>
              )}

              {captureMode === 'topaz' && (
                <div className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-8 text-center space-y-2">
                  <PenLine className="h-10 w-10 mx-auto text-purple-400" />
                  <p className="text-sm text-purple-700 font-medium">Sign on the Topaz pad</p>
                  <p className="text-xs text-purple-500">The pad is active — sign and press confirm on the device</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {currentIndex + 1} of {signatories.length} signatories
                </p>
                <Button onClick={handleCapture} disabled={saving}>
                  {saving ? 'Saving…' : currentIndex < signatories.length - 1 ? 'Next Signatory' : 'Complete & Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
