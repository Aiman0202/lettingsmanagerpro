-- ============================================================
-- Visual polish: update AST template CSS for better styling
-- Thicker dividers, improved family table, stronger notice box
-- ============================================================

UPDATE agreement_defaults
SET body_html = regexp_replace(
  body_html,
  '<style>.*?</style>',
  $css$<style>
  .agreement-body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #000; }
  .agreement-body h1 { font-size: 14pt; text-align: center; text-decoration: underline; margin: 20px 0 8px; font-weight: bold; }
  .agreement-body h2 { font-size: 12pt; margin: 24px 0 8px; border-bottom: 2px solid #333; padding-bottom: 4px; font-weight: bold; }
  .agreement-body h3 { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; }
  .agreement-body p { margin: 4px 0; text-align: justify; }
  .agreement-body ul { margin: 4px 0 4px 20px; padding: 0; }
  .agreement-body li { margin: 2px 0; }
  .agreement-body .clause { margin-left: 24px; text-indent: -20px; margin-bottom: 4px; }
  .agreement-body .sub-clause { margin-left: 40px; text-indent: -20px; margin-bottom: 3px; }
  .agreement-body .section-divider { border: none; border-top: 2px solid #999; margin: 20px 0; }
  .agreement-body .center-text { text-align: center; }
  .agreement-body .bold { font-weight: bold; }
  .agreement-body .red-text { color: #cc0000; }
  .agreement-body .notice-box { text-align: center; font-size: 12pt; font-weight: bold; margin: 20px 0; padding: 16px; border: 2px solid #333; background: #fafafa; }
  .agreement-body table.family-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .agreement-body table.family-table th, .agreement-body table.family-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11pt; }
  .agreement-body table.family-table th { font-size: 14pt; font-weight: bold; background: #f5f5f5; text-align: left; }
  .agreement-body table.family-table td { min-height: 28px; }
  .agreement-body table.details-table { border-collapse: collapse; margin: 4px 0; }
  .agreement-body table.details-table td { padding: 3px 10px; border: none; font-size: 11pt; }
  .agreement-body .signature-block { margin-top: 24px; }
  .agreement-body .signature-line { border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 8px 0; }
</style>$css$,
  'n'
)
WHERE key = 'default_ast';
