import { supabase } from '@/lib/supabase'

export interface StickyNote {
  id: string
  user_id: string | null
  title: string
  content: string | null
  color: string
  position_x: number
  position_y: number
  rotation: number
  z_index: number
  width: number
  height: number
  created_at: string
  updated_at: string
}

/**
 * Load all sticky notes for the current user
 */
export async function loadStickyNotes(): Promise<StickyNote[]> {
  // Get current user ID from Supabase auth
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No authenticated user found')
    return []
  }

  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load sticky notes:', error.message)
    return []
  }

  return (data as StickyNote[]) || []
}

/**
 * Create a new sticky note
 */
export async function createStickyNote(note: Partial<StickyNote>): Promise<StickyNote | null> {
  try {
    // Get current user ID from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError.message)
      return null
    }
    
    if (!user) {
      console.error('No authenticated user found')
      return null
    }

    console.log('Creating sticky note with user_id:', user.id)
    console.log('Note data:', note)

    const { data, error } = await (supabase.from('sticky_notes') as any)
      .insert({
        user_id: user.id,
        title: note.title || 'New Note',
        content: note.content || '',
        color: note.color || 'yellow',
        position_x: Math.round(note.position_x ?? 50),
        position_y: Math.round(note.position_y ?? 50),
        rotation: Math.round(note.rotation ?? (Math.random() * 10 - 5)),
        z_index: Math.round(note.z_index ?? 1),
        width: Math.round(note.width ?? 200),
        height: Math.round(note.height ?? 200),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create sticky note:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return null
    }

    console.log('Sticky note created successfully:', data)
    return data as StickyNote
  } catch (err) {
    console.error('Unexpected error in createStickyNote:', err)
    return null
  }
}

/**
 * Update an existing sticky note
 */
export async function updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<void> {
  const { error } = await (supabase.from('sticky_notes') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to update sticky note:', error.message)
  }
}

/**
 * Delete a sticky note
 */
export async function deleteStickyNote(id: string): Promise<void> {
  const { error } = await (supabase.from('sticky_notes') as any)
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete sticky note:', error.message)
  }
}

/**
 * Update note position (optimized for drag operations)
 */
export async function updateNotePosition(id: string, x: number, y: number): Promise<void> {
  const { error } = await (supabase.from('sticky_notes') as any)
    .update({
      position_x: Math.round(x),
      position_y: Math.round(y),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to update note position:', error.message)
  }
}

/**
 * Bring note to front by updating z_index
 */
export async function bringToFront(id: string, maxZIndex: number): Promise<void> {
  const { error } = await (supabase.from('sticky_notes') as any)
    .update({
      z_index: maxZIndex + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to bring note to front:', error.message)
  }
}
