import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Building2, Users, ClipboardList, Wrench, PoundSterling, AlertTriangle, ArrowRight, Sparkles, FileCheck, Home, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

function StatCard({ title, value, icon: Icon, color, href }: {
  title: string; value: string | number; icon: React.ElementType; color: string; href: string
}) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
        <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center ${color} shrink-0`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: propertiesCount } = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: async () => {
      const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: activeTenancies } = useQuery({
    queryKey: ['dashboard-active-tenancies'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tenancies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      return count ?? 0
    },
  })

  const { data: openMaintenance } = useQuery({
    queryKey: ['dashboard-maintenance'],
    queryFn: async () => {
      const { count } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
      return count ?? 0
    },
  })

  const { data: overdueRent } = useQuery({
    queryKey: ['dashboard-overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('rent_transactions')
        .select('amount')
        .eq('status', 'overdue')
        .lte('due_date', today)
      return (data ?? []).reduce((sum, t) => sum + t.amount, 0)
    },
  })

  const { data: expiringCompliance } = useQuery({
    queryKey: ['dashboard-compliance'],
    queryFn: async () => {
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)
      const { count } = await supabase
        .from('property_compliance')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', in30.toISOString().split('T')[0])
      return count ?? 0
    },
  })

  const { data: endingTenancies } = useQuery({
    queryKey: ['dashboard-ending'],
    queryFn: async () => {
      const in60 = new Date()
      in60.setDate(in60.getDate() + 60)
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('tenancies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('end_date', in60.toISOString().split('T')[0])
        .gte('end_date', today)
      return count ?? 0
    },
  })

  // Tenancies ending in 30 / 60 / 90 day buckets
  const { data: endingBuckets } = useQuery({
    queryKey: ['dashboard-ending-buckets'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const buckets = [30, 60, 90]
      const results: Record<string, number> = {}
      for (const days of buckets) {
        const d = new Date()
        d.setDate(d.getDate() + days)
        const { count } = await supabase
          .from('tenancies')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .lte('end_date', d.toISOString().split('T')[0])
          .gte('end_date', today)
        results[`${days}`] = count ?? 0
      }
      return results
    },
  })

  const { data: missingChecklists } = useQuery({
    queryKey: ['dashboard-missing-checklists'],
    queryFn: async () => {
      const { data: activeTenancies } = await supabase
        .from('tenancies')
        .select('id')
        .eq('status', 'active')
      const tenancyIds = (activeTenancies ?? []).map((t: any) => t.id)
      if (tenancyIds.length === 0) return 0
      const { count } = await supabase
        .from('tenancy_checklists')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'move_in')
        .in('tenancy_id', tenancyIds)
      return tenancyIds.length - (count ?? 0)
    },
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">What needs your attention today</p>
      </div>

      {/* Action Required */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(overdueRent ?? 0) > 0 && (
            <ActionItem
              icon={PoundSterling} iconColor="text-red-600" iconBg="bg-red-50"
              title={`${formatCurrency(overdueRent ?? 0)} overdue rent`}
              description="Tenants behind on payments"
              href="/finance" label="View Finances"
            />
          )}
          {(endingBuckets?.['90'] ?? 0) > 0 && (
            <>
              {(endingBuckets?.['30'] ?? 0) > 0 && (
                <ActionItem
                  icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50"
                  title={`${endingBuckets['30']} tenanc${endingBuckets['30'] === 1 ? 'y' : 'ies'} ending within 30 days`}
                  description="Urgent — take action immediately"
                  href="/tenancies" label="View Tenancies"
                />
              )}
              {(endingBuckets?.['60'] ?? 0) > 0 && (
                <ActionItem
                  icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50"
                  title={`${endingBuckets['60']} tenanc${endingBuckets['60'] === 1 ? 'y' : 'ies'} ending within 60 days`}
                  description="Plan renewals and inspections"
                  href="/tenancies" label="View Tenancies"
                />
              )}
              {(endingBuckets?.['90'] ?? 0) > 0 && (
                <ActionItem
                  icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-50"
                  title={`${endingBuckets['90']} tenanc${endingBuckets['90'] === 1 ? 'y' : 'ies'} ending within 90 days`}
                  description="Start preparing for end of tenancy"
                  href="/tenancies" label="View Tenancies"
                />
              )}
            </>
          )}
          {(expiringCompliance ?? 0) > 0 && (
            <ActionItem
              icon={AlertTriangle} iconColor="text-orange-600" iconBg="bg-orange-50"
              title={`${expiringCompliance} compliance item${expiringCompliance === 1 ? '' : 's'} expiring in 30 days`}
              description="Renew certificates and checks"
              href="/compliance" label="View Compliance"
            />
          )}
          {(openMaintenance ?? 0) > 0 && (
            <ActionItem
              icon={Wrench} iconColor="text-blue-600" iconBg="bg-blue-50"
              title={`${openMaintenance} open maintenance request${openMaintenance === 1 ? '' : 's'}`}
              description="Jobs awaiting completion"
              href="/maintenance" label="View Maintenance"
            />
          )}
          {(missingChecklists ?? 0) > 0 && (
            <ActionItem
              icon={FileCheck} iconColor="text-purple-600" iconBg="bg-purple-50"
              title={`${missingChecklists} tenanc${missingChecklists === 1 ? 'y' : 'ies'} missing move-in checklist`}
              description="Complete move-in documentation"
              href="/tenancies" label="View Tenancies"
            />
          )}
          {(propertiesCount ?? 0) > 0 && ((activeTenancies ?? 0) < (propertiesCount ?? 0)) && (
            <ActionItem
              icon={Home} iconColor="text-green-600" iconBg="bg-green-50"
              title={`${(propertiesCount ?? 0) - (activeTenancies ?? 0)} propert${(propertiesCount ?? 0) - (activeTenancies ?? 0) === 1 ? 'y' : 'ies'} ready for tenancy`}
              description="Set up new tenancies for available properties"
              href="/onboarding" label="Start Onboarding"
            />
          )}
          {!overdueRent && !endingTenancies && !expiringCompliance && !openMaintenance && !missingChecklists && (
            <p className="text-sm text-gray-500 py-2">All caught up! No items require immediate attention.</p>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Onboarding Pipeline
          </CardTitle>
          <Link to="/onboarding">
            <Button size="sm">
              <Sparkles className="h-4 w-4 mr-1" /> New Tenancy Setup
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 sm:gap-4">
            <PipelineStep label="Properties\nAvailable" count={propertiesCount ?? 0} color="bg-blue-500" />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <PipelineStep label="Active\nTenancies" count={activeTenancies ?? 0} color="bg-green-500" />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <PipelineStep label="Ending\nSoon" count={endingTenancies ?? 0} color="bg-amber-500" />
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Properties" value={propertiesCount ?? 0} icon={Building2} color="bg-blue-500" href="/properties" />
        <StatCard title="Active Tenancies" value={activeTenancies ?? 0} icon={ClipboardList} color="bg-green-500" href="/tenancies" />
        <StatCard title="Open Maintenance" value={openMaintenance ?? 0} icon={Wrench} color="bg-orange-500" href="/maintenance" />
        <StatCard title="Expiring Compliance" value={expiringCompliance ?? 0} icon={AlertTriangle} color="bg-amber-500" href="/compliance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RecentActivity />
        <UpcomingAlerts />
      </div>
    </div>
  )
}

function ActionItem({ icon: Icon, iconColor, iconBg, title, description, href, label }: {
  icon: React.ElementType; iconColor: string; iconBg: string; title: string; description: string; href: string; label: string
}) {
  return (
    <Link to={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <span className="text-xs text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {label} <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}

function PipelineStep({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex-1 text-center">
      <div className={`h-12 w-12 sm:h-14 sm:w-14 ${color} rounded-full flex items-center justify-center mx-auto mb-2`}>
        <span className="text-white text-lg sm:text-xl font-bold">{count}</span>
      </div>
      <p className="text-xs text-gray-600 whitespace-pre-line leading-tight">{label}</p>
    </div>
  )
}

function RecentActivity() {
  const { data: recent } = useQuery({
    queryKey: ['recent-tenancies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancies')
        .select(`
          id, status, start_date, end_date, rent_amount,
          properties(address),
          landlords(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tenancies</CardTitle>
      </CardHeader>
      <CardContent>
        {(recent ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No tenancies yet.</p>
        ) : (
          <ul className="space-y-3">
            {(recent ?? []).map((t: any) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{t.properties?.address ?? '—'}</p>
                  <p className="text-gray-500 text-xs">{t.landlords?.full_name ?? '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['upcoming-compliance'],
    queryFn: async () => {
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)
      const { data } = await supabase
        .from('property_compliance')
        .select('id, type, expiry_date, properties(address)')
        .lte('expiry_date', in30.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(5)
      return data ?? []
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Expiring (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {(alerts ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No compliance items expiring soon.</p>
        ) : (
          <ul className="space-y-3">
            {(alerts ?? []).map((a: any) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{a.type.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-gray-500 text-xs">{a.properties?.address ?? '—'}</p>
                </div>
                <span className="text-xs text-red-600 font-medium">
                  {new Date(a.expiry_date).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
