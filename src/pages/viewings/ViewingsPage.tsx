import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Plus, Calendar, Clock, ChevronLeft, ChevronRight, Eye, MessageSquare, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ViewingFormDialog from '@/components/ViewingFormDialog'
import ViewingFeedbackDialog from '@/components/ViewingFeedbackDialog'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 border-blue-200 text-blue-700',
  completed: 'bg-green-50 border-green-200 text-green-700',
  cancelled: 'bg-gray-50 border-gray-200 text-gray-500',
  no_show: 'bg-red-50 border-red-200 text-red-700',
  converted: 'bg-purple-50 border-purple-200 text-purple-700',
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'destructive',
  converted: 'default',
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1 // Monday as start
  start.setDate(start.getDate() - diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function ViewingsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editViewing, setEditViewing] = useState<any>(null)
  const [feedbackViewing, setFeedbackViewing] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)

  const weekBase = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase])
  const weekStart = weekDays[0].toISOString().split('T')[0]
  const weekEnd = weekDays[6].toISOString().split('T')[0]

  const { data: viewings, isLoading } = useQuery({
    queryKey: ['viewings', weekStart, weekEnd, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('property_viewings')
        .select('*, properties(address, postcode)')
        .gte('scheduled_at', `${weekStart}T00:00:00`)
        .lte('scheduled_at', `${weekEnd}T23:59:59`)
        .order('scheduled_at', { ascending: true })
      if (statusFilter) q = q.eq('status', statusFilter)
      const { data } = await q
      return (data ?? []) as any[]
    },
  })

  // Today's viewings
  const todayStr = new Date().toISOString().split('T')[0]
  const todayViewings = useMemo(
    () => (viewings ?? []).filter((v) => v.scheduled_at.startsWith(todayStr)),
    [viewings, todayStr],
  )

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const day of weekDays) {
      map.set(day.toISOString().split('T')[0], [])
    }
    for (const v of viewings ?? []) {
      const dateKey = v.scheduled_at.split('T')[0]
      if (map.has(dateKey)) map.get(dateKey)!.push(v)
    }
    return map
  }, [viewings, weekDays])

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viewings</h1>
          <p className="text-gray-500 text-sm mt-1">{(viewings ?? []).length} viewings this week</p>
        </div>
        <Button onClick={() => { setEditViewing(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Schedule Viewing
        </Button>
      </div>

      {/* Today's Summary */}
      {todayViewings.length > 0 && weekOffset === 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Today ({todayViewings.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {todayViewings.slice(0, 6).map((v) => (
                <div key={v.id} className="bg-white border border-blue-100 rounded-lg p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-600">{new Date(v.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium truncate">{v.properties?.address ?? '—'}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{v.prospect_name} · {v.duration_minutes}min</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="no-print">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-48">
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
            <option value="converted">Converted</option>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500 hidden sm:inline">
              {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Week Calendar */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading viewings…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const dateKey = day.toISOString().split('T')[0]
            const dayViewings = grouped.get(dateKey) ?? []
            const isToday = dateKey === todayStr
            return (
              <div key={dateKey} className={`border rounded-lg ${isToday ? 'border-blue-300 bg-blue-50/20' : 'border-gray-200 bg-white'}`}>
                <div className={`p-2 border-b text-center ${isToday ? 'bg-blue-100' : 'bg-gray-50'} rounded-t-lg`}>
                  <p className="text-xs text-gray-500">{dayNames[i]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </p>
                </div>
                <div className="p-1.5 space-y-1.5 min-h-[100px]">
                  {dayViewings.length === 0 && (
                    <p className="text-xs text-gray-300 text-center py-4">No viewings</p>
                  )}
                  {dayViewings.map((v) => (
                    <div
                      key={v.id}
                      className={`border rounded p-2 text-xs cursor-pointer hover:shadow-sm transition-shadow ${STATUS_COLORS[v.status] ?? 'bg-gray-50 border-gray-200'}`}
                      onClick={() => {
                        if (v.status === 'scheduled') setFeedbackViewing(v)
                        else setEditViewing(v)
                      }}
                    >
                      <p className="font-semibold">{new Date(v.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="truncate font-medium mt-0.5">{v.properties?.address ?? '—'}</p>
                      <p className="text-gray-500 truncate">{v.prospect_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant={STATUS_BADGE_VARIANT[v.status] ?? 'outline'} className="text-[10px] px-1.5">{v.status}</Badge>
                        {v.rating && <Badge variant="secondary" className="text-[10px] px-1.5">{v.rating.replace('_', ' ')}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* All Viewings Table (below calendar for mobile) */}
      <Card className="md:hidden">
        <CardHeader><CardTitle className="text-base">All Viewings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(viewings ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-6">No viewings found</p>
          ) : (viewings ?? []).map((v) => (
            <div key={v.id} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{v.properties?.address ?? '—'}</span>
                <Badge variant={STATUS_BADGE_VARIANT[v.status] ?? 'outline'} className="text-xs">{v.status}</Badge>
              </div>
              <p className="text-xs text-gray-500">{formatDate(v.scheduled_at)} · {v.prospect_name}</p>
              <div className="flex gap-2">
                {v.status === 'scheduled' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setFeedbackViewing(v)}>
                    <MessageSquare className="h-3 w-3 mr-1" /> Feedback
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditViewing(v); setShowForm(true) }}>
                  <Eye className="h-3 w-3 mr-1" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewingFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditViewing(null) }}
        editViewing={editViewing}
      />

      <ViewingFeedbackDialog
        open={!!feedbackViewing}
        onClose={() => setFeedbackViewing(null)}
        viewing={feedbackViewing}
      />
    </div>
  )
}
