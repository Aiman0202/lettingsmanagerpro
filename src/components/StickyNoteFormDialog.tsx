import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StickyNoteFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    content: string
    color: string
    size: 'S' | 'M' | 'L'
  }) => void
  initialPosition: { x: number; y: number }
}

const NOTE_COLORS = [
  { name: 'yellow', bg: '#fef3c7', border: '#fde68a' },
  { name: 'pink', bg: '#fce7f3', border: '#fbcfe8' },
  { name: 'blue', bg: '#dbeafe', border: '#bfdbfe' },
  { name: 'green', bg: '#d1fae5', border: '#a7f3d0' },
  { name: 'orange', bg: '#ffedd5', border: '#fed7aa' },
  { name: 'purple', bg: '#f3e8ff', border: '#e9d5ff' },
]

const SIZES = [
  { name: 'S', label: 'Small', width: 150, height: 150 },
  { name: 'M', label: 'Medium', width: 200, height: 200 },
  { name: 'L', label: 'Large', width: 250, height: 250 },
] as const

export default function StickyNoteFormDialog({ open, onClose, onSubmit, initialPosition }: StickyNoteFormDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('yellow')
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      color,
      size,
    })

    // Reset form
    setTitle('')
    setContent('')
    setColor('yellow')
    setSize('M')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                required
                autoFocus
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label>Content</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={4}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                      color === c.name ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c.bg, borderColor: color === c.name ? '#1f2937' : c.border }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="space-y-1.5">
              <Label>Size</Label>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSize(s.name)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      size === s.name
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.label} ({s.width}×{s.height})
                  </button>
                ))}
              </div>
            </div>

            {/* Position info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              Position: ({Math.round(initialPosition.x)}, {Math.round(initialPosition.y)})
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
