-- Create sticky_notes table for cork board dashboard
CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  rotation INTEGER NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 1,
  width INTEGER NOT NULL DEFAULT 200,
  height INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster positioning queries
CREATE INDEX idx_sticky_notes_user ON sticky_notes(user_id);
CREATE INDEX idx_sticky_notes_position ON sticky_notes(position_x, position_y);

-- Add comments for documentation
COMMENT ON TABLE sticky_notes IS 'Free-form sticky notes for cork board dashboard';
COMMENT ON COLUMN sticky_notes.color IS 'Note color: yellow, pink, blue, green, orange, purple';
COMMENT ON COLUMN sticky_notes.position_x IS 'X position in pixels from left';
COMMENT ON COLUMN sticky_notes.position_y IS 'Y position in pixels from top';
COMMENT ON COLUMN sticky_notes.rotation IS 'Rotation in degrees (-10 to 10 for realistic effect)';
COMMENT ON COLUMN sticky_notes.z_index IS 'Stacking order for overlapping notes';

-- Enable Row Level Security
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sticky notes"
  ON sticky_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sticky notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sticky notes"
  ON sticky_notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sticky notes"
  ON sticky_notes FOR DELETE
  USING (user_id = auth.uid());
