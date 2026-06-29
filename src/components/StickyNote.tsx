import { useState, useEffect, useRef } from 'react'
import { X, Palette } from 'lucide-react'
import type { StickyNote } from '@/utils/sticky-notes'

interface StickyNoteProps {
  note: StickyNote
  onUpdate: (id: string, updates: Partial<StickyNote>) => void
  onDelete: (id: string) => void
  onFocus: (id: string) => void
}

const NOTE_COLORS: Record<string, { bg: string; border: string; pin: string; shadow: string }> = {
  yellow: { bg: '#fef3c7', border: '#fde68a', pin: '#d97706', shadow: 'rgba(217, 119, 6, 0.3)' },
  pink: { bg: '#fce7f3', border: '#fbcfe8', pin: '#db2777', shadow: 'rgba(219, 39, 119, 0.3)' },
  blue: { bg: '#dbeafe', border: '#bfdbfe', pin: '#2563eb', shadow: 'rgba(37, 99, 235, 0.3)' },
  green: { bg: '#d1fae5', border: '#a7f3d0', pin: '#059669', shadow: 'rgba(5, 150, 105, 0.3)' },
  orange: { bg: '#ffedd5', border: '#fed7aa', pin: '#ea580c', shadow: 'rgba(234, 88, 12, 0.3)' },
  purple: { bg: '#f3e8ff', border: '#e9d5ff', pin: '#7c3aed', shadow: 'rgba(124, 58, 237, 0.3)' },
}

export default function StickyNote({ note, onUpdate, onDelete, onFocus }: StickyNoteProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [isDragging, setIsDragging] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y })
  const noteRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.yellow

  // Auto-save title and content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onUpdate(note.id, { title, content })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [title, content])

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('noteId', note.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    onFocus(note.id)

    // Calculate offset from mouse to note top-left
    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    // Save final position
    onUpdate(note.id, { position_x: position.x, position_y: position.y })
  }

  // Handle click to bring to front
  const handleClick = () => {
    onFocus(note.id)
  }

  // Handle color change
  const handleColorChange = (color: string) => {
    onUpdate(note.id, { color })
    setShowColorPicker(false)
  }

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Delete this note?')) {
      onDelete(note.id)
    }
  }

  return (
    <div
      ref={noteRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`sticky-note absolute transition-shadow duration-200 ${
        isDragging ? 'dragging opacity-80 cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: note.width,
        minHeight: note.height,
        transform: `rotate(${note.rotation}deg)`,
        zIndex: note.z_index,
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        boxShadow: isDragging
          ? `8px 8px 20px ${colors.shadow}`
          : `3px 3px 10px ${colors.shadow}`,
      }}
    >
      {/* Pin/Thumbtack */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 rounded-full border border-gray-600"
        style={{
          backgroundColor: colors.pin,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      />

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        title="Delete note"
      >
        <X className="h-3.5 w-3.5 text-gray-600" />
      </button>

      {/* Color picker button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowColorPicker(!showColorPicker)
          }}
          className="absolute top-2 left-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          title="Change color"
        >
          <Palette className="h-3.5 w-3.5 text-gray-600" />
        </button>

        {/* Color picker popup */}
        {showColorPicker && (
          <div
            className="absolute top-8 left-0 bg-white rounded-lg shadow-lg p-2 z-50 grid grid-cols-3 gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {Object.keys(NOTE_COLORS).map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                style={{
                  backgroundColor: NOTE_COLORS[color].bg,
                  borderColor: NOTE_COLORS[color].border,
                }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note content */}
      <div className="p-4 pt-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent font-semibold text-sm text-gray-800 placeholder-gray-500 border-none outline-none mb-2"
          placeholder="Note title..."
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-xs text-gray-700 placeholder-gray-500 border-none outline-none resize-none"
          style={{ minHeight: note.height - 80 }}
          placeholder="Write your note..."
        />
      </div>

      {/* Fold effect on bottom right */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${colors.border} 50%)`,
          filter: 'drop-shadow(-1px -1px 1px rgba(0,0,0,0.1))',
        }}
      />
    </div>
  )
}
