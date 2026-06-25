import { type Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Subscript, Superscript,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  TableIcon, Plus, Minus, PlusCircle, MinusCircle,
  Eraser, Undo, Redo,
  Palette, Highlighter,
  Pilcrow,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
]

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff8000',
  '#808080', '#c0c0c0', '#ff0000', '#00ff80', '#0080ff',
]

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
]

const FONT_SIZES = [
  { label: 'Default', value: '' },
  { label: '8pt', value: '8pt' },
  { label: '10pt', value: '10pt' },
  { label: '12pt', value: '12pt' },
  { label: '14pt', value: '14pt' },
  { label: '16pt', value: '16pt' },
  { label: '18pt', value: '18pt' },
  { label: '24pt', value: '24pt' },
  { label: '30pt', value: '30pt' },
]

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const addRow = () => {
    editor.chain().focus().addRowAfter().run()
  }

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run()
  }

  const addColumn = () => {
    editor.chain().focus().addColumnAfter().run()
  }

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run()
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Row 1: Block & Inline Formatting */}
      <div className="editor-toolbar-row">
        {/* Block type */}
        <select
          className="toolbar-select"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            'paragraph'
          }
          onChange={(e) => {
            const value = e.target.value
            if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
            else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
            else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
            else editor.chain().focus().setParagraph().run()
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="toolbar-divider" />

        {/* Inline formatting */}
        <ToolbarButton
          icon={Bold}
          label="Bold"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          label="Underline"
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon={Subscript}
          label="Subscript"
          isActive={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        />
        <ToolbarButton
          icon={Superscript}
          label="Superscript"
          isActive={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        />

        <div className="toolbar-divider" />

        {/* Text color */}
        <ColorPickerDropdown
          icon={Palette}
          label="Text Color"
          colors={TEXT_COLORS}
          editor={editor}
          action="setColor"
        />

        {/* Highlight color */}
        <ColorPickerDropdown
          icon={Highlighter}
          label="Highlight"
          colors={HIGHLIGHT_COLORS}
          editor={editor}
          action="toggleHighlight"
        />

        <div className="toolbar-divider" />

        {/* Font family */}
        <select
          className="toolbar-select w-32"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        >
          {FONT_FAMILIES.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          className="toolbar-select w-20"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}
        >
          {FONT_SIZES.map(size => (
            <option key={size.value} value={size.value}>{size.label}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Alignment & Lists */}
      <div className="editor-toolbar-row">
        {/* Alignment */}
        <ToolbarButton
          icon={AlignLeft}
          label="Align Left"
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Align Center"
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Align Right"
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
        <ToolbarButton
          icon={AlignJustify}
          label="Justify"
          isActive={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        />

        <div className="toolbar-divider" />

        {/* Lists */}
        <ToolbarButton
          icon={List}
          label="Bullet List"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Ordered List"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <div className="toolbar-divider" />

        {/* Indent/Outdent (using list toggle for now) */}
        <ToolbarButton
          icon={Pilcrow}
          label="Line Spacing"
          isActive={false}
          onClick={() => {
            // Toggle between normal and double spacing
            const currentLineHeight = editor.getAttributes('paragraph').lineHeight
            if (currentLineHeight === '2') {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().updateAttributes('paragraph', { lineHeight: '2' }).run()
            }
          }}
        />
      </div>

      {/* Row 3: Tables & Advanced */}
      <div className="editor-toolbar-row">
        {/* Table operations */}
        <ToolbarButton
          icon={TableIcon}
          label="Insert Table"
          isActive={editor.isActive('table')}
          onClick={addTable}
        />
        <ToolbarButton
          icon={Plus}
          label="Add Row"
          isActive={false}
          onClick={addRow}
        />
        <ToolbarButton
          icon={Minus}
          label="Delete Row"
          isActive={false}
          onClick={deleteRow}
        />
        <ToolbarButton
          icon={PlusCircle}
          label="Add Column"
          isActive={false}
          onClick={addColumn}
        />
        <ToolbarButton
          icon={MinusCircle}
          label="Delete Column"
          isActive={false}
          onClick={deleteColumn}
        />

        <div className="toolbar-divider" />

        {/* Clear formatting */}
        <ToolbarButton
          icon={Eraser}
          label="Clear Formatting"
          isActive={false}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />

        <div className="toolbar-divider" />

        {/* Undo/Redo */}
        <ToolbarButton
          icon={Undo}
          label="Undo"
          isActive={false}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo}
          label="Redo"
          isActive={false}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
    </div>
  )
}

// Reusable toolbar button component
function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

// Color picker popover component
function ColorPickerDropdown({
  icon: Icon,
  label,
  colors,
  editor,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  colors: string[]
  editor: Editor
  action: 'setColor' | 'toggleHighlight'
}) {
  return (
    <div className="relative group">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={label}>
        <Icon className="h-4 w-4" />
      </Button>
      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="grid grid-cols-10 gap-1">
          {colors.map(color => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                if (action === 'setColor') {
                  editor.chain().focus().setColor(color).run()
                } else {
                  editor.chain().focus().toggleHighlight({ color }).run()
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
