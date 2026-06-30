# Implementation Plan

## Overview

Exploratory bugfix workflow for the landlord statement print race condition. Tasks follow the bug condition methodology: explore the bug with a failing test, lock in preservation behaviour, apply the fix, then validate both properties pass.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3"] },
    { "wave": 3, "tasks": ["4"] }
  ]
}
```

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Race Condition: onload Registered After document.close()
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating that `print()` is never called when the document loads synchronously
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — popup allowed AND document loads synchronously (no logo, so no external resources, making synchronous load certain)
  - Mock `window.open` to return a fake popup object whose `document.close()` immediately fires the `load` event (simulating synchronous load)
  - Call `handlePrint` (or the equivalent unit of `generateStatementHTML` + popup write logic) with `companyLogo: null` so no `<img>` tag is produced
  - Assert that `window.print()` WAS called on the popup — this assertion will FAIL on unfixed code because `onload` is registered too late
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the race condition exists)
  - Document counterexamples found, e.g. "`print()` was never called when document loaded synchronously with no logo present"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - View Flow and HTML Content Stability
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: calling `handleView` on unfixed code opens a popup with HTML and does NOT call `print()`
  - Observe: calling `generateStatementHTML({ ...data, autoPrint: false })` (or omitting `autoPrint`) on unfixed code returns HTML that does NOT contain the inline print script
  - Observe: popup-blocked paths call `showError` with `'Print blocked'` / `'View blocked'` messages
  - Write a property-based test: for all randomly generated `StatementPrintData` values (varying landlord details, transaction lists, expense lists, logo presence), `generateStatementHTML` output must NOT contain `window.print()` when `autoPrint` is omitted or `false`
  - Write a property-based test: for all such inputs, `handleView` must never invoke `window.print()` on the popup
  - Write unit assertions for popup-blocked toast messages (both print and view paths)
  - Run all these tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms the baseline behaviour to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix the race condition in the print flow

  - [ ] 3.1 Add `autoPrint` to `StatementPrintData` and inject inline print script in `generateStatementHTML`
    - In `src/utils/statement-html.ts`, add `autoPrint?: boolean` to the `StatementPrintData` interface
    - In `generateStatementHTML`, destructure `autoPrint = false` from `data` alongside the existing fields
    - Immediately before the closing `</body>` tag in the returned HTML string, conditionally append the inline script when `autoPrint === true`:
      ```html
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() { window.print(); }, 300);
        });
      </script>
      ```
    - When `autoPrint === false` (default), nothing is appended — preserving the view-only path exactly
    - _Bug_Condition: isBugCondition(X) where X.popupAllowed = true AND X.documentLoadedBeforeListenerSet = true_
    - _Expected_Behavior: inline script inside popup fires window.print() after DOM is ready, regardless of whether document loaded synchronously or asynchronously_
    - _Preservation: generateStatementHTML with autoPrint omitted or false must produce identical HTML to the pre-fix baseline_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

  - [ ] 3.2 Update `handlePrint` in `StatementDetailPage.tsx` to pass `autoPrint: true` and remove the `onload` block
    - In `src/pages/finance/StatementDetailPage.tsx`, locate the `handlePrint` function
    - In the `generateStatementHTML(...)` call inside `handlePrint`, add `autoPrint: true` to the data object
    - Remove the entire `printWindow.onload = () => { ... }` block (the block that contains the `setTimeout(() => { try { printWindow.print() } ...})` callback) — `print()` is now handled by the inline script
    - Retain the `printWindow.document.write(html)` and `printWindow.document.close()` lines unchanged
    - Leave `handleView` completely unchanged — it calls `generateStatementHTML` without `autoPrint`, defaulting to `false`
    - _Bug_Condition: assignment of printWindow.onload after document.close() caused the load event to be missed_
    - _Expected_Behavior: removing the external onload and relying on the inline script eliminates the race condition_
    - _Preservation: handleView code path is untouched; popup-blocked guard and showError calls are untouched_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Race Condition: onload Registered After document.close()
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 asserts that `window.print()` is called even when the document loads synchronously
    - Now that the inline script handles printing, this assertion should be satisfied
    - Run bug condition exploration test from step 1 on FIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms the race condition is resolved and `print()` is reliably called)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - View Flow and HTML Content Stability
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 on FIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — `handleView` still does not trigger `print()`, toast messages are unchanged, HTML content is structurally identical for `autoPrint: false`)
    - Confirm all tests still pass after fix

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm all tests pass
  - Verify the bug condition exploration test (task 1 / Property 1) passes on fixed code
  - Verify all preservation tests (task 2 / Property 2) pass on fixed code
  - Ensure no TypeScript compile errors are introduced (run `tsc --noEmit` or equivalent)
  - Ask the user if any questions arise

## Notes

- Tasks 1 and 2 MUST be completed and run on unfixed code before task 3 begins
- The exploration test (task 1) is expected to FAIL on unfixed code — this is intentional and confirms the bug exists
- The preservation tests (task 2) are expected to PASS on unfixed code — this establishes the behavioural baseline
- Both test suites are re-run in tasks 3.3 and 3.4 after the fix — do not write new tests there
- `handleView` requires zero code changes; only `handlePrint` and `generateStatementHTML` are modified
- The fix is additive to the `StatementPrintData` interface (`autoPrint` is optional with a `false` default), so no existing callers break
