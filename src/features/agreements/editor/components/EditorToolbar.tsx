import { type Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold, Italic, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  TableIcon, Pilcrow,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const tools = [
    // Block-level
    {
      group: [
        { icon: Pilcrow, label: 'Paragraph', action: () => editor.chain().focus().setParagraph().run(), isActive: editor.isActive('paragraph') },
        { icon: Heading1, label: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
        { icon: Heading2, label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
        { icon: Heading3, label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
      ],
    },
    // Inline formatting
    {
      group: [
        { icon: Bold, label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
        { icon: Italic, label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
        { icon: Strikethrough, label: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive('strike') },
      ],
    },
    // Lists
    {
      group: [
        { icon: List, label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
        { icon: ListOrdered, label: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList') },
      ],
    },
    // Table
    {
      group: [
        { icon: TableIcon, label: 'Insert Table', action: addTable, isActive: editor.isActive('table') },
      ],
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      {tools.map((section, si) => (
        <div key={si} className="flex items-center gap-0.5">
          {si > 0 && <div className="w-px h-5 bg-gray-300 mx-1" />}
          {section.group.map((tool) => (
            <Button
              key={tool.label}
              type="button"
              variant={tool.isActive ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={tool.action}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
