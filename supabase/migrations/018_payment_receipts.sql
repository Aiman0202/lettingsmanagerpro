-- =============================================================
-- 018: Payment Receipts — Balance & Period Tracking
-- =============================================================

-- Add receipt-related columns to rent_transactions
ALTER TABLE rent_transactions
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS balance_after NUMERIC(10,2) DEFAULT 0;

-- Index for receipt lookups
CREATE INDEX IF NOT EXISTS idx_rent_txns_receipt ON rent_transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_rent_txns_period ON rent_transactions(period_start, period_end);

-- Auto-generate receipt number on insert (RCP-YYYY-NNNN format)
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.receipt_number IS NULL AND NEW.status = 'paid' THEN
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)
    ), 0) + 1 INTO next_num
    FROM rent_transactions
    WHERE receipt_number IS NOT NULL
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM COALESCE(NEW.paid_date, NEW.due_date));
    NEW.receipt_number := 'RCP-' || TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists first (idempotent)
DROP TRIGGER IF EXISTS trg_generate_receipt_number ON rent_transactions;

CREATE TRIGGER trg_generate_receipt_number
  BEFORE INSERT ON rent_transactions
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- Backfill period_start/period_end for existing paid transactions
UPDATE rent_transactions
SET
  period_start = DATE_TRUNC('month', due_date)::DATE,
  period_end = (DATE_TRUNC('month', due_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
  amount_paid = CASE WHEN status = 'paid' THEN amount ELSE COALESCE(amount_paid, 0) END
WHERE status IN ('paid', 'partial') AND period_start IS NULL;

-- Backfill receipt numbers for existing paid transactions that don't have one
DO $$
DECLARE
  rec RECORD;
  next_num INTEGER;
BEGIN
  FOR rec IN
    SELECT id, paid_date, due_date, created_at
    FROM rent_transactions
    WHERE status = 'paid' AND receipt_number IS NULL
    ORDER BY COALESCE(paid_date, due_date, created_at::DATE)
  LOOP
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)
    ), 0) + 1 INTO next_num
    FROM rent_transactions
    WHERE receipt_number IS NOT NULL
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM COALESCE(rec.paid_date, rec.due_date));

    UPDATE rent_transactions
    SET receipt_number = 'RCP-' || TO_CHAR(COALESCE(rec.paid_date, rec.due_date), 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;
