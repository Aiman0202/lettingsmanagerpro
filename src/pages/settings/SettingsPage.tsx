import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, Users2, ShieldCheck, ClipboardList, Upload, Image } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

type SettingsTab = 'company' | 'users' | 'roles' | 'audit'

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('company')

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users2 },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Log', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Company profile, users, roles and permissions</p>
      </div>

      <div className="flex border-b border-gray-200 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'company' && <CompanySettings />}
      {tab === 'users' && <UsersSettings />}
      {tab === 'roles' && <RolesSettings />}
      {tab === 'audit' && <AuditLog />}
    </div>
  )
}

function CompanySettings() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    company_name: '', address: '', email: '', phone: '', vat_number: '', bank_details: '',
    default_fee_percentage: '10', company_registration_number: '', website: '',
    address_line1: '', address_line2: '', city: '', postcode: '', company_description: '',
    logo_storage_path: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').single()
      if (data) {
        setForm({
          company_name: data.company_name ?? '',
          address: data.address ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          vat_number: data.vat_number ?? '',
          bank_details: data.bank_details ?? '',
          default_fee_percentage: String(data.default_fee_percentage ?? 10),
          company_registration_number: data.company_registration_number ?? '',
          website: data.website ?? '',
          address_line1: data.address_line1 ?? '',
          address_line2: data.address_line2 ?? '',
          city: data.city ?? '',
          postcode: data.postcode ?? '',
          company_description: data.company_description ?? '',
          logo_storage_path: data.logo_storage_path ?? '',
        })
        if (data.logo_storage_path) {
          setLogoUrl(supabase.storage.from('company-assets').getPublicUrl(data.logo_storage_path).data.publicUrl)
        }
      }
      return data
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let logoPath = form.logo_storage_path
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logo-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('company-assets').upload(path, logoFile)
      if (!uploadErr) logoPath = path
    }

    const payload = {
      company_name: form.company_name,
      address: form.address || null,
      email: form.email || null,
      phone: form.phone || null,
      vat_number: form.vat_number || null,
      bank_details: form.bank_details || null,
      default_fee_percentage: parseFloat(form.default_fee_percentage),
      company_registration_number: form.company_registration_number || null,
      website: form.website || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      city: form.city || null,
      postcode: form.postcode || null,
      company_description: form.company_description || null,
      logo_storage_path: logoPath || null,
    }
    const { data: existing } = await supabase.from('company_settings').select('id').single()
    if (existing) {
      await supabase.from('company_settings').update(payload as any).eq('id', existing.id)
    } else {
      await supabase.from('company_settings').insert(payload as any)
    }
    setSaving(false)
    setSaved(true)
    qc.invalidateQueries({ queryKey: ['company-settings'] })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-20 w-auto border rounded" />
              ) : (
                <div className="h-20 w-32 bg-gray-100 border rounded flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-300" />
                </div>
              )}
              <div className="flex-1">
                <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                <p className="text-xs text-gray-500 mt-1">Upload PNG, JPG or SVG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Registration Number</Label>
              <Input value={form.company_registration_number} onChange={(e) => setForm({ ...form, company_registration_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>VAT Number</Label>
              <Input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })} placeholder="Brief company description" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Default Agency Fee (%)</Label>
              <Input type="number" step="0.1" min="0" max="100" value={form.default_fee_percentage} onChange={(e) => setForm({ ...form, default_fee_percentage: e.target.value })} />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label className="text-base">Address</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Address Line 1</Label>
                <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Address Line 2</Label>
                <Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-1.5">
            <Label>Bank Details</Label>
            <Input value={form.bank_details} onChange={(e) => setForm({ ...form, bank_details: e.target.value })} placeholder="Sort code / Account number" />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function UsersSettings() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role_id: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const { data: users } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('*, roles(id, name, description)')
        .order('full_name')
      return data ?? []
    },
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('*').order('name')
      return data ?? []
    },
  })

  const isAdmin = profile?.role === 'admin'

  function openNew() {
    setEditingUser(null)
    setForm({ full_name: '', email: '', role_id: (roles?.[0] as any)?.id ?? '', is_active: true })
    setShowForm(true)
  }

  function openEdit(user: any) {
    setEditingUser(user)
    setForm({
      full_name: user.full_name ?? '',
      email: user.email ?? '',
      role_id: user.role_id ?? (roles?.find((r: any) => r.name === user.role) as any)?.id ?? '',
      is_active: user.is_active ?? true,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.role_id) return
    setSaving(true)

    const selectedRole = (roles ?? []).find((r: any) => r.id === form.role_id) as any

    if (editingUser) {
      await (supabase.from('users') as any).update({
        full_name: form.full_name,
        role_id: form.role_id,
        role: selectedRole?.name ?? editingUser.role,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', editingUser.id)
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: generateTempPassword(),
      })

      if (authError || !authData.user) {
        console.error('Failed to create auth user:', authError)
        setSaving(false)
        return
      }

      await (supabase.from('users') as any).insert({
        id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        role_id: form.role_id,
        role: selectedRole?.name ?? 'negotiator',
        is_active: form.is_active,
      })
    }

    setSaving(false)
    setShowForm(false)
    qc.invalidateQueries({ queryKey: ['staff-users'] })
  }

  async function toggleActive(user: any) {
    await (supabase.from('users') as any).update({
      is_active: !user.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    qc.invalidateQueries({ queryKey: ['staff-users'] })
  }

  async function resetPassword(email: string) {
    if (!email) return
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      console.error('Password reset failed:', error)
      alert('Failed to send password reset email: ' + error.message)
    } else {
      alert(`Password reset email sent to ${email}`)
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew}>
            Add Staff Member
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role *</Label>
                  <Select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
                    <option value="">Select role…</option>
                    {(roles ?? []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </div>
              </div>
              {editingUser ? (
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed here. Contact admin to change email.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  <p className="text-xs text-gray-500">A temporary password will be generated. The user should reset it on first login.</p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active account
              </label>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingUser ? 'Update User' : 'Create User'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-400">No staff users</TableCell></TableRow>
            ) : (users ?? []).map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-sm text-gray-500">{u.email ?? '—'}</TableCell>
                <TableCell>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    {u.roles?.name ?? u.role ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? 'success' : 'secondary'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(u.created_at)}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resetPassword(u.email)}>
                        Reset Password
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function generateTempPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!1'
}

function RolesSettings() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const resources = ['properties', 'landlords', 'tenants', 'tenancies', 'maintenance', 'finance', 'documents', 'agreements', 'settings']

  const { data: roles } = useQuery({
    queryKey: ['roles-with-perms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('roles')
        .select('*, permissions(*)')
        .order('name')
      return data ?? []
    },
  })

  const isAdmin = profile?.role === 'admin'

  function openNewRole() {
    setEditingRole(null)
    setRoleForm({ name: '', description: '' })
    setShowForm(true)
  }

  function openEditRole(role: any) {
    setEditingRole(role)
    setRoleForm({ name: role.name ?? '', description: role.description ?? '' })
    setShowForm(true)
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleForm.name) return
    setSaving(true)

    if (editingRole) {
      await (supabase.from('roles') as any).update({
        name: roleForm.name,
        description: roleForm.description,
      }).eq('id', editingRole.id)
    } else {
      const { data: newRole, error } = await (supabase.from('roles') as any)
        .insert({ name: roleForm.name, description: roleForm.description })
        .select('id')
        .single()

      if (!error && newRole) {
        // Seed empty permissions for the new role
        const perms = resources.map((resource) => ({
          role_id: (newRole as any).id,
          resource,
          can_read: false,
          can_write: false,
          can_delete: false,
        }))
        await (supabase.from('permissions') as any).insert(perms)
      }
    }

    setSaving(false)
    setShowForm(false)
    qc.invalidateQueries({ queryKey: ['roles-with-perms'] })
    qc.invalidateQueries({ queryKey: ['roles'] })
  }

  async function updatePermission(roleId: string, permId: string | null, resource: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) {
    if (permId) {
      await (supabase.from('permissions') as any).update({ [field]: value }).eq('id', permId)
    } else {
      await (supabase.from('permissions') as any).insert({
        role_id: roleId,
        resource,
        [field]: value,
        can_read: field === 'can_read' ? value : false,
        can_write: field === 'can_write' ? value : false,
        can_delete: field === 'can_delete' ? value : false,
      })
    }
    qc.invalidateQueries({ queryKey: ['roles-with-perms'] })
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNewRole}>Add Role</Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Role Name *</Label>
                  <Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingRole ? 'Update Role' : 'Create Role'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(roles ?? []).map((role: any) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="capitalize text-base">{role.name}</CardTitle>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => openEditRole(role)}>Edit</Button>
            )}
          </CardHeader>
          <CardContent>
            {role.description && <p className="text-sm text-gray-500 mb-3">{role.description}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Write</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => {
                  const perm = (role.permissions ?? []).find((p: any) => p.resource === resource)
                  return (
                    <TableRow key={resource}>
                      <TableCell className="capitalize">{resource}</TableCell>
                      {(['can_read', 'can_write', 'can_delete'] as const).map((field) => (
                        <TableCell key={field}>
                          {isAdmin ? (
                            <input
                              type="checkbox"
                              checked={perm?.[field] ?? false}
                              onChange={(e) => updatePermission(role.id, perm?.id ?? null, resource, field, e.target.checked)}
                            />
                          ) : (
                            perm?.[field] ? '✓' : '—'
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AuditLog() {
  const { data: logs } = useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      return data ?? []
    },
  })

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(logs ?? []).length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-400">No audit entries</TableCell></TableRow>
          ) : (logs ?? []).map((l: any) => (
            <TableRow key={l.id}>
              <TableCell className="font-mono text-xs">{l.action}</TableCell>
              <TableCell>{l.resource} {l.resource_id ? `(${l.resource_id.slice(0, 8)}…)` : ''}</TableCell>
              <TableCell>{formatDate(l.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
