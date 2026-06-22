import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string
  role: string
  is_active: boolean
}

interface Permission {
  resource: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  permissions: Permission[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  can: (resource: string, action: 'read' | 'write' | 'delete') => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  async function loadProfileAndPermissions(userId: string) {
    const { data: prof } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (prof) {
      setProfile(prof as UserProfile)

      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', prof.role)
        .single()

      if (roleData) {
        const { data: perms } = await supabase
          .from('permissions')
          .select('resource, can_read, can_write, can_delete')
          .eq('role_id', roleData.id)

        setPermissions((perms as Permission[]) ?? [])
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadProfileAndPermissions(s.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadProfileAndPermissions(s.user.id)
      } else {
        setProfile(null)
        setPermissions([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setPermissions([])
  }

  function can(resource: string, action: 'read' | 'write' | 'delete'): boolean {
    // Admins have full access
    if (profile?.role === 'admin') return true
    const perm = permissions.find((p) => p.resource === resource)
    if (!perm) return false
    if (action === 'read') return perm.can_read
    if (action === 'write') return perm.can_write
    if (action === 'delete') return perm.can_delete
    return false
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, permissions, loading, signIn, signOut, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
