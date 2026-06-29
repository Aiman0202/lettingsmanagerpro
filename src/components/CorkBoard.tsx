import { useState, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import StickyNote from './StickyNote'
import StickyNoteFormDialog from './StickyNoteFormDialog'
import {
  loadStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
  updateNotePosition,
  bringToFront,
  type StickyNote as StickyNoteType,
} from '@/utils/sticky-notes'
import { useQuery } from '@tanstack/react-query'

export default function CorkBoard() {
  const qc = useQueryClient()
  const boardRef = useRef<HTMLDivElement>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [dialogPosition, setDialogPosition] = useState({ x: 100, y: 100 })
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)

  // Fetch notes
  const { data: notes = [] } = useQuery({
    queryKey: ['sticky-notes'],
    queryFn: loadStickyNotes,
  })

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: async (note: Partial<StickyNote>) => {
      console.log('CorkBoard createMutation called with:', note)
      return await createStickyNote(note)
    },
    onSuccess: (data) => {
      console.log('CorkBoard createMutation succeeded, created:', data)
      qc.invalidateQueries({ queryKey: ['sticky-notes'] })
    },
    onError: (error) => {
      console.error('CorkBoard createMutation failed:', error)
    },
  })

  // Handle double-click on board to create note
  const handleBoardDoubleClick = (e: React.MouseEvent) => {
    if (e.target === boardRef.current || (e.target as HTMLElement).classList.contains('cork-board-bg')) {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        setDialogPosition({
          x: e.clientX - rect.left + boardRef.current.scrollLeft,
          y: e.clientY - rect.top + boardRef.current.scrollTop,
        })
        setShowFormDialog(true)
      }
    }
  }

  // Handle note focus (bring to front)
  const handleNoteFocus = useCallback((noteId: string) => {
    const maxZIndex = Math.max(...notes.map((n) => n.z_index), 0)
    bringToFront(noteId, maxZIndex)
    qc.invalidateQueries({ queryKey: ['sticky-notes'] })
  }, [notes, qc])

  // Handle note drag end
  const handleDragEnd = useCallback((noteId: string, position: { x: number; y: number }) => {
    updateNotePosition(noteId, position.x, position.y)
    setDraggingNoteId(null)
  }, [])

  // Handle note delete
  const handleDelete = useCallback((noteId: string) => {
    deleteStickyNote(noteId)
    qc.invalidateQueries({ queryKey: ['sticky-notes'] })
  }, [qc])

  // Handle note update
  const handleUpdate = useCallback((noteId: string, updates: Partial<StickyNoteType>) => {
    updateStickyNote(noteId, updates)
    qc.invalidateQueries({ queryKey: ['sticky-notes'] })
  }, [qc])

  // Handle form submit
  const handleFormSubmit = (formData: {
    title: string
    content: string
    color: string
    size: 'S' | 'M' | 'L'
  }) => {
    console.log('handleFormSubmit called with:', formData)
    console.log('dialogPosition:', dialogPosition)
    
    const sizeMap = {
      S: { width: 150, height: 150 },
      M: { width: 200, height: 200 },
      L: { width: 250, height: 250 },
    }

    const noteData = {
      title: formData.title,
      content: formData.content,
      color: formData.color,
      position_x: dialogPosition.x,
      position_y: dialogPosition.y,
      ...sizeMap[formData.size],
    }

    console.log('Calling createMutation.mutate with:', noteData)
    createMutation.mutate(noteData)

    setShowFormDialog(false)
  }

  return (
    <div className="relative">
      {/* Cork board container */}
      <div
        ref={boardRef}
        className="cork-board relative overflow-auto rounded-lg"
        style={{
          minHeight: '600px',
          backgroundColor: '#d4a574',
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0,0,0,0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(0,0,0,0.03) 0%, transparent 40%)
          `,
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
        }}
        onDoubleClick={handleBoardDoubleClick}
      >
        {/* Empty state */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-600">
              <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm mt-2">Double-click anywhere to create a note</p>
              <p className="text-xs mt-1 opacity-75">or click the + button below</p>
            </div>
          </div>
        )}

        {/* Render all sticky notes */}
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onFocus={handleNoteFocus}
          />
        ))}
      </div>

      {/* Add note button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => {
            setDialogPosition({ x: 100, y: 100 })
            setShowFormDialog(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add New Note
        </button>
      </div>

      {/* Create note dialog */}
      <StickyNoteFormDialog
        open={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        onSubmit={handleFormSubmit}
        initialPosition={dialogPosition}
      />
    </div>
  )
}
