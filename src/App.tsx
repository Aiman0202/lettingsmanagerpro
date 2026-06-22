import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PropertiesPage from '@/pages/properties/PropertiesPage'
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage'
import LandlordsPage from '@/pages/landlords/LandlordsPage'
import LandlordDetailPage from '@/pages/landlords/LandlordDetailPage'
import TenantsPage from '@/pages/tenants/TenantsPage'
import TenantDetailPage from '@/pages/tenants/TenantDetailPage'
import TenanciesPage from '@/pages/tenancies/TenanciesPage'
import TenancyCreatePage from '@/pages/tenancies/TenancyCreatePage'
import TenancyDetailPage from '@/pages/tenancies/TenancyDetailPage'
import CompliancePage from '@/pages/compliance/CompliancePage'
import MaintenancePage from '@/pages/maintenance/MaintenancePage'
import FinancePage from '@/pages/finance/FinancePage'
import LandlordStatementsPage from '@/pages/finance/LandlordStatementsPage'
import ArrearsPage from '@/pages/finance/ArrearsPage'
import DocumentsPage from '@/pages/documents/DocumentsPage'
import AgreementsPage from '@/pages/agreements/AgreementsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
      <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />
      <Route path="/landlords" element={<ProtectedRoute><LandlordsPage /></ProtectedRoute>} />
      <Route path="/landlords/:id" element={<ProtectedRoute><LandlordDetailPage /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
      <Route path="/tenants/:id" element={<ProtectedRoute><TenantDetailPage /></ProtectedRoute>} />
      <Route path="/tenancies" element={<ProtectedRoute><TenanciesPage /></ProtectedRoute>} />
      <Route path="/tenancies/new" element={<ProtectedRoute><TenancyCreatePage /></ProtectedRoute>} />
      <Route path="/tenancies/:id" element={<ProtectedRoute><TenancyDetailPage /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
      <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/finance/statements" element={<ProtectedRoute><LandlordStatementsPage /></ProtectedRoute>} />
      <Route path="/finance/arrears" element={<ProtectedRoute><ArrearsPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
      <Route path="/agreements" element={<ProtectedRoute><AgreementsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
