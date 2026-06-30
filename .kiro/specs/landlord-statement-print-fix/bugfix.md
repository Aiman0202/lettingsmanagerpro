# Bugfix Requirements Document

## Introduction

The "Print / Save PDF" button on the Landlord Statement detail page (`/finance/statements/:id`) does not trigger the browser print dialog. When a user clicks the button, a new popup window opens and HTML content is written to it, but the print dialog never appears. The root cause is a race condition in `handlePrint` within `StatementDetailPage.tsx`: the `onload` event listener is attached to the popup window **after** `document.close()` has already been called. Because the document loads synchronously (no external resources to fetch when HTML is written inline), the `load` event fires before the listener is registered, so `print()` is never invoked.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks "Print / Save PDF" and the browser allows the popup THEN the system opens a new window with the statement HTML but the print dialog never appears

1.2 WHEN `handlePrint` calls `printWindow.document.write(html)` followed by `printWindow.document.close()` and then assigns `printWindow.onload` THEN the system assigns the `onload` listener after the load event has already fired, so the callback is never executed

1.3 WHEN the HTML written to the popup window contains no external resource URLs (e.g. no logo image) THEN the system loads the document synchronously before the `onload` listener can be registered, making the race condition certain

### Expected Behavior (Correct)

2.1 WHEN the user clicks "Print / Save PDF" and the browser allows the popup THEN the system SHALL open a new window containing the statement HTML and automatically invoke the browser print dialog

2.2 WHEN HTML is written to a popup window via `document.write` / `document.close` THEN the system SHALL trigger `print()` reliably regardless of whether the document loads synchronously or asynchronously

2.3 WHEN the popup window has no logo image (no external resources) THEN the system SHALL still reliably invoke `print()` without depending on an `onload` event that may never fire

2.4 WHEN the browser blocks the popup THEN the system SHALL display a user-facing error toast advising the user to allow popups, without throwing an unhandled error

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks "View" THEN the system SHALL CONTINUE TO open a new popup window displaying the statement HTML without automatically triggering the print dialog

3.2 WHEN the browser blocks either the print or view popup THEN the system SHALL CONTINUE TO display the existing "Print blocked" or "View blocked" toast message

3.3 WHEN the statement HTML is generated THEN the system SHALL CONTINUE TO include all existing content sections: landlord details, summary cards, property breakdown, rent transactions, expenses, and footer

3.4 WHEN a company logo signed URL is available THEN the system SHALL CONTINUE TO include the logo image in the generated HTML

3.5 WHEN company settings cannot be fetched from Supabase THEN the system SHALL CONTINUE TO fall back gracefully and render the statement without a logo

---

## Bug Condition

**Bug Condition Function:**

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type PrintAttempt { popupAllowed: boolean, documentLoadedBeforeListenerSet: boolean }
  OUTPUT: boolean

  RETURN X.popupAllowed = true AND X.documentLoadedBeforeListenerSet = true
END FUNCTION
```

**Property — Fix Checking:**

```pascal
// Property: Fix Checking — print() must be called after content loads
FOR ALL X WHERE isBugCondition(X) DO
  result ← handlePrint'(X)
  ASSERT printDialogTriggered(result) = true
END FOR
```

**Preservation Goal:**

```pascal
// Property: Preservation Checking — view-only flow must remain unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handleView(X) = handleView'(X)   // no print() called, window opens with HTML
END FOR
```
