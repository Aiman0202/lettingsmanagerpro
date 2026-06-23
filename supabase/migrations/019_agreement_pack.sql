-- Migration 019: Agreement Pack - Witness Support + Council Pack Metadata
-- Enhances signature capture with optional witness per signatory
-- Adds council pack generation metadata to generated_agreements

-- ============================================================
-- 1. Add witness fields to agreement_signatures
-- ============================================================
ALTER TABLE agreement_signatures
  ADD COLUMN witness_name TEXT,
  ADD COLUMN witness_address TEXT,
  ADD COLUMN witness_occupation TEXT,
  ADD COLUMN witness_signature_base64 TEXT;

-- ============================================================
-- 2. Add council pack metadata to generated_agreements
-- ============================================================
ALTER TABLE generated_agreements
  ADD COLUMN council_pack_generated_at TIMESTAMPTZ,
  ADD COLUMN council_pack_html TEXT;

-- ============================================================
-- 3. Index for faster attachment lookups by type
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agreement_attachments_type
  ON agreement_attachments(attachment_type);

-- ============================================================
-- 4. RLS policies for new columns (existing policies cover the tables)
-- ============================================================
-- The new columns inherit RLS from existing table policies.
-- No additional policies needed since agreement_signatures and
-- generated_agreements already have row-level security enabled
-- with policies covering all columns.

-- ============================================================
-- 5. Comment for documentation
-- ============================================================
COMMENT ON COLUMN agreement_signatures.witness_name IS 'Full name of the witness for this signature';
COMMENT ON COLUMN agreement_signatures.witness_address IS 'Full address of the witness';
COMMENT ON COLUMN agreement_signatures.witness_occupation IS 'Occupation/profession of the witness';
COMMENT ON COLUMN agreement_signatures.witness_signature_base64 IS 'Base64-encoded PNG image of witness signature';
COMMENT ON COLUMN generated_agreements.council_pack_generated_at IS 'Timestamp when the council submission pack was last generated';
COMMENT ON COLUMN generated_agreements.council_pack_html IS 'Self-contained HTML of the last generated council submission pack';
