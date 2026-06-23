# UI / UX Screen Specifications — Payment Dispute Triage

## Design Principles

- **Clarity first.** Operations staff are not technical users. Labels,
  actions, and results must be self-explanatory without tooltips or
  training.
- **Outcome above the fold.** The triage recommendation is the most
  important piece of information — it must be visible without scrolling
  after submission.
- **Urgency is visual.** `escalate_to_fraud` uses red. All other actions
  use cooler, lower-urgency colours. The difference must be immediately
  readable at a glance.
- **Fail gracefully.** Every screen has an explicit error state with a
  Retry action. The user is never left looking at a blank panel.
- **Mobile-first layout.** All screens stack to a single column on
  narrow viewports. Two-column grids are used only where `sm:` breakpoint
  is appropriate.

## Technology References

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- Key utilities used: `rounded-md`, `border`, `shadow-sm`, `ring`,
  `gap-*`, `grid-cols-*`, `sm:grid-cols-2`, `text-*`, `bg-*`,
  `px-*`, `py-*`, `font-semibold`, `truncate`, `whitespace-pre-wrap`
- Colour palette: `indigo` (primary actions), `green` (success / auto
  refund), `red` (fraud escalation / error), `amber` (reopen /
  contact customer), `blue` (open status / manual review), `gray`
  (neutral surfaces, labels)

### React
- Docs: https://react.dev
- Patterns used: functional components, `useState`, `useEffect`,
  `useCallback`, controlled inputs, conditional rendering
- No router — tab-switching is managed by a single `view` state in
  `App.tsx`
- No global state store — each component fetches and owns its own data

---

## Screen Index

| # | Screen | React component | Route / trigger |
|---|---|---|---|
| 1 | Application Shell | `App.tsx` | Entry point — always visible |
| 2 | New Dispute Form | `DisputeForm.tsx` | Default tab |
| 3 | Dispute List | `DisputeList.tsx` | "Disputes" tab |
| 4 | Dispute Detail | `DisputeDetail.tsx` | Row click in list |
| 5 | Triage Result Card | `TriageResult.tsx` | Embedded in screens 2 and 4 |

---

## Screen 1 — Application Shell

**Purpose:** Persistent outer frame. Holds the page header and the tab
bar that switches between the New Dispute form and the Disputes list.
When a dispute detail is open, the tab bar is hidden and a Back button
takes its place.

**React component:** `client/src/App.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Payment Dispute Triage                          [header]   │
├─────────────────────────────────────────────────────────────┤
│  [ New Dispute ]   [ Disputes ]                 [tab bar]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   <active screen renders here>                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

When a dispute is selected from the list, the tab bar is replaced:

```
├─────────────────────────────────────────────────────────────┤
│  ← Back to disputes                          [back button]  │
├─────────────────────────────────────────────────────────────┤
```

### Components and data

| Element | `data-testid` | Tailwind notes |
|---|---|---|
| Header bar | — | `bg-indigo-700 text-white px-6 py-4` |
| "New Dispute" tab | `tab-new-dispute` | `aria-selected` toggles `border-b-2 border-indigo-600` |
| "Disputes" tab | `tab-disputes` | Same pattern |
| Back button | `back-to-list` | `text-indigo-600 font-medium flex items-center gap-2` |

### States

| State | What renders |
|---|---|
| Default (no dispute selected) | Tab bar visible; `DisputeForm` active |
| Disputes tab active | Tab bar visible; `DisputeList` active |
| Dispute selected | Tab bar hidden; `DisputeDetail` + back button |

### Interactions

- Click "New Dispute" tab → `DisputeForm` renders, tab gains
  `aria-selected="true"`
- Click "Disputes" tab → `DisputeList` renders
- Click a dispute row → tab bar hides, `DisputeDetail` opens
- Click "Back" → `DisputeList` restores, selected dispute cleared

---

## Screen 2 — New Dispute Form

**Purpose:** Capture all fields for a new payment dispute, validate
client-side, submit to the API, and immediately display the triage
recommendation.

**React component:** `client/src/components/DisputeForm.tsx`

### Layout — idle state

```
┌──────────────────────────────────────────────┐
│  Submit Payment Dispute                      │
├──────────────────────────────────────────────┤
│  Customer Name *                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Transaction Reference *                    │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Payment Type *                             │
│  ┌──────────────────────────────────────┐   │
│  │  Select a payment type            ▾  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Issue Category *                           │
│  ┌──────────────────────────────────────┐   │
│  │  Select an issue category         ▾  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Transaction Status *                       │
│  ┌──────────────────────────────────────┐   │
│  │  Select a transaction status      ▾  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Amount *                                   │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Transaction Date *                         │
│  ┌──────────────────────────────────────┐   │
│  │  YYYY-MM-DD                          │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Description  (2000 characters remaining)   │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │           Submit Dispute             │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Layout — after successful submission

The triage result card and success banner are injected **above** the
form, above the fold:

```
┌──────────────────────────────────────────────┐
│  ✓ Dispute submitted successfully.           │ ← success banner (green)
│  Dispute ID: clx1abc123                      │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │  🔴  Escalate to Fraud Team            │  │ ← TriageResult (red for fraud)
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  [form remains visible below]               │
└──────────────────────────────────────────────┘
```

### Layout — validation error state

Each failing field shows an inline error beneath the input:

```
│  Customer Name *                             │
│  ┌──────────────────────────────────────┐   │  ← red border
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│  ⚠ Customer name is required.               │  ← error text (text-red-600)
```

### Layout — timeout/network error state

```
│  ┌──────────────────────────────────────┐   │
│  │  ⚠ Request timed out                 │   │  ← yellow banner (error-banner)
│  │  The server did not respond within   │   │
│  │  10 seconds.                         │   │
│  │                    [ Retry ]         │   │
│  └──────────────────────────────────────┘   │
```

### Fields

| Field | Input type | `data-testid` | Validation |
|---|---|---|---|
| Customer Name | `<input type="text">` | `customer-name` | Required, max 200 chars |
| Transaction Reference | `<input type="text">` | `transaction-ref` | Required, max 50 chars |
| Payment Type | `<select>` | `payment-type` | Required; one of 4 values |
| Issue Category | `<select>` | `issue-category` | Required; one of 5 values |
| Transaction Status | `<select>` | `transaction-status` | Required; one of 4 values |
| Amount | `<input type="number" step="0.01">` | `amount` | Required, 0.01–999,999,999.99 |
| Transaction Date | `<input type="date">` | `transaction-date` | Required, not in future |
| Description | `<textarea rows="4">` | `description` | Optional, max 2000 chars |
| Submit button | `<button type="submit">` | `submit-dispute` | Disabled while submitting |

### Tailwind classes — key elements

```
// Input — default
"block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"

// Input — error state
"block w-full rounded-md border border-red-400 px-3 py-2 text-sm shadow-sm
 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

// Submit button
"w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
 shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500
 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

// Success banner
"rounded-md bg-green-50 border border-green-300 p-4 text-green-800"

// Error banner
"rounded-md bg-red-50 border border-red-300 p-4 text-red-800"

// Timeout banner
"rounded-md bg-yellow-50 border border-yellow-300 p-4 text-yellow-800"
```

### States summary

| State | What renders |
|---|---|
| Idle | Empty form, submit button enabled |
| Submitting | Button shows "Submitting…", disabled |
| Validation error | Inline per-field errors, fields retain values |
| API error | Red error banner with message from response |
| Timeout | Yellow banner with Retry button |
| Success | Green banner with dispute reference (`disputeRef`) + `TriageResult` card |

---

## Screen 3 — Dispute List

**Purpose:** Show previously submitted disputes in a scannable table,
ordered newest first. Supports pagination. Clicking a row navigates to
the detail view.

**React component:** `client/src/components/DisputeList.tsx`

### Layout — populated state

```
┌─────────────────────────────────────────────────────────────────────┐
│  Customer Name   Payment Type   Issue Category   Action   Status    │ ← header
├─────────────────────────────────────────────────────────────────────┤
│  Jane Smith      Card Txn       Unauth. Txn       Escalate  Open   │ ← dispute-row-{id}
│  Bob Jones       Bank Transfer  Missing Pmt       Manual    Open   │
│  Alice Lee       Direct Debit   Duplicate Chg     Refund    Rslvd  │
├─────────────────────────────────────────────────────────────────────┤
│                       ← Previous    Page 1 of 3    Next →          │ ← pagination
└─────────────────────────────────────────────────────────────────────┘
```

### Layout — empty state

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         No disputes have been submitted yet.                │  ← dispute-list-empty
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layout — loading state

```
┌─────────────────────────────────────────────────────────────┐
│              Loading disputes…   ⟳                          │
└─────────────────────────────────────────────────────────────┘
```

### Layout — error state

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Could not load disputes.                                 │  ← dispute-list-error
│                       [ Retry ]                             │  ← retry-list
└─────────────────────────────────────────────────────────────┘
```

### Table columns

| Column | Source field | Notes |
|---|---|---|
| Customer Name | `customerName` | Truncated at ~24 chars on mobile |
| Payment Type | `paymentType` | Human-readable label (`Card Transaction`) |
| Issue Category | `issueCategory` | Human-readable label (`Unauthorized Transaction`) |
| Recommended Action | `recommendedAction` | Coloured badge matching urgency |
| Status | `disputeStatus` | Coloured badge |
| Created | `createdAt` | `toLocaleDateString()` |

### `data-testid` attributes

| Element | `data-testid` |
|---|---|
| Each table row | `dispute-row-{id}` |
| Empty state container | `dispute-list-empty` |
| Error banner | `dispute-list-error` |
| Retry button | `retry-list` |

### Tailwind classes — key elements

```
// Table row — hover highlight
"cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-100"

// Status badge — open
"inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700"

// Status badge — resolved
"inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700"

// Status badge — escalated
"inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700"

// Status badge — reopened
"inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700"

// Pagination button
"rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700
 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
```

### States summary

| State | What renders |
|---|---|
| Loading | Spinner / "Loading disputes…" text |
| Empty | `dispute-list-empty` message |
| Error | `dispute-list-error` banner + `retry-list` button |
| Populated | Table rows, pagination when `total > pageSize` |

### Interactions

- Click row → `onSelect(id)` callback fires → App shows `DisputeDetail`
- Click Next/Prev → re-fetches with updated `page` param
- Click Retry → re-fetches current page

---

## Screen 4 — Dispute Detail

**Purpose:** Full view of a single dispute including all fields,
the current triage recommendation, and the complete status history.
For resolved disputes, shows both Reopen and Escalate action buttons.
For reopened disputes, shows the Escalate action button only (Reopen is not shown).
For open or escalated disputes, shows a Mark as Resolved button.
All actions use an inline confirmation panel.

**React component:** `client/src/components/DisputeDetail.tsx`

### Layout — standard (non-resolved) dispute

```
┌──────────────────────────────────────────────────────────────────┐
│  Jane Smith                              [ Open  ]               │ ← name + status badge
│  Ref: TXN-20240601-001                                           │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔵  Manual Review                                        │   │ ← TriageResult
│  └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  DISPUTE DETAILS                                                 │
│  ┌───────────────────────┬──────────────────────────────────┐   │
│  │ Payment Type          │ Issue Category                   │   │
│  │ Card Transaction      │ Incorrect Amount                 │   │
│  ├───────────────────────┼──────────────────────────────────┤   │
│  │ Transaction Status    │ Amount                           │   │
│  │ Completed             │ 250.00                           │   │
│  ├───────────────────────┼──────────────────────────────────┤   │
│  │ Transaction Date      │ Created At                       │   │
│  │ 15 May 2026           │ 22 Jun 2026, 10:30               │   │
│  ├───────────────────────┴──────────────────────────────────┤   │
│  │ Description                                              │   │
│  │ The amount charged does not match the receipt.           │   │
│  └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  STATUS HISTORY                                                  │
│  (No status changes recorded yet.)                               │ ← StatusHistory
└──────────────────────────────────────────────────────────────────┘
```

### Layout — resolved dispute (Reopen + Escalate buttons visible)

```
│  [  Reopen  ]   [  Escalate  ]                                   │ ← reopen-btn, escalate-btn
```

### Layout — reopened dispute (Escalate button only)

```
│  [  Escalate  ]                                                   │ ← escalate-btn
```

### Layout — confirmation panel (after clicking Reopen or Escalate)

```
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Reopen this dispute                                      │   │ ← confirm-panel
│  │                                                           │   │
│  │  Reason *                                                 │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │                                                  │    │   │ ← confirm-reason
│  │  │                                                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  [ Confirm ]  [ Cancel ]                                  │   │ ← confirm-action-btn, cancel-action-btn
│  └──────────────────────────────────────────────────────────┘   │
```

"Confirm" is disabled until the reason textarea contains at least one
non-whitespace character.

### Layout — error state (fetch failure)

```
┌──────────────────────────────────────────────┐
│  Failed to load dispute.                     │  ← dispute-detail-error
│                  [ Retry ]                   │  ← retry-detail
└──────────────────────────────────────────────┘
```

### `data-testid` attributes

| Element | `data-testid` |
|---|---|
| Error container | `dispute-detail-error` |
| Retry button | `retry-detail` |
| Reopen button | `reopen-btn` |
| Escalate button | `escalate-btn` |
| Mark as Resolved button | `resolve-btn` |
| Confirmation panel | `confirm-panel` |
| Reason textarea | `confirm-reason` |
| Confirm button | `confirm-action-btn` |
| Cancel button | `cancel-action-btn` |

### Tailwind classes — key elements

```
// Reopen button
"rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm
 font-medium text-amber-800 hover:bg-amber-100 transition-colors"

// Escalate button
"rounded-lg border border-red-400 bg-red-50 px-4 py-2 text-sm
 font-medium text-red-800 hover:bg-red-100 transition-colors"

// Confirm button
"rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"

// Cancel button
"rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"

// Detail card surface
"rounded-lg border border-gray-200 bg-white p-4"

// Detail label (dt)
"text-xs text-gray-500"

// Detail value (dd)
"text-sm font-medium text-gray-900"
```

### States summary

| State | What renders |
|---|---|
| Loading | "Loading dispute…" centred text |
| Error | `dispute-detail-error` + `retry-detail` button |
| Loaded — open/escalated | All fields, `TriageResult`, `StatusHistory`; `resolve-btn` visible; no Reopen/Escalate buttons |
| Loaded — reopened | All fields + `escalate-btn`; `resolve-btn` visible; no `reopen-btn` |
| Loaded — resolved | All fields + `reopen-btn` + `escalate-btn`; no `resolve-btn` |
| Confirming | Action buttons hidden; `confirm-panel` appears |
| Confirm submitting | Confirm button shows "Saving…", disabled |
| Confirm API error | Inline error message inside `confirm-panel` |

### Interactions

- Click Reopen → `confirm-panel` opens with action = "reopen"
- Click Escalate → `confirm-panel` opens with action = "escalate"
- Click Mark as Resolved → `confirm-panel` opens with action = "resolve"
- Click Cancel → `confirm-panel` closes, buttons restore
- Type in Reason → Confirm button enables when non-empty
- Click Confirm → `PATCH /api/disputes/:id/status` (reopen/escalate) or `PATCH /api/disputes/:id/resolve` (resolve), dispute refreshes in place
- Click Retry → re-fetches the dispute

---

## Screen 5 — Triage Result Card

**Purpose:** Pure display component. Shows the recommended next action
with a colour-coded urgency indicator. Reused in both `DisputeForm`
(after submission) and `DisputeDetail` (always visible).

**React component:** `client/src/components/TriageResult.tsx`

### Layout — standard priority (all actions except escalate_to_fraud)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ●  Manual Review                       [standard]  │  ← triage-result + triage-urgency-standard
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Layout — high urgency (escalate_to_fraud only)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🔴  Escalate to Fraud Team              [urgent]   │  ← triage-result + triage-urgency-high
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Action → label and colour mapping

| `recommendedAction` | Human-readable label | Urgency variant | Tailwind colour |
|---|---|---|---|
| `escalate_to_fraud` | Escalate to Fraud Team | high (red) | `bg-red-50 border-red-400 text-red-800` |
| `auto_refund` | Auto Refund | standard (green) | `bg-green-50 border-green-400 text-green-800` |
| `manual_review` | Manual Review | standard (blue) | `bg-blue-50 border-blue-400 text-blue-800` |
| `contact_customer` | Contact Customer | standard (amber) | `bg-amber-50 border-amber-400 text-amber-800` |
| `reject_dispute` | Reject Dispute | standard (gray) | `bg-gray-50 border-gray-400 text-gray-700` |

### `data-testid` attributes

| Element | `data-testid` | When present |
|---|---|---|
| Outer card container | `triage-result` | Always |
| High-urgency indicator | `triage-urgency-high` | Only when `escalate_to_fraud` |
| Standard-priority indicator | `triage-urgency-standard` | All other actions |

### Props interface

```tsx
interface TriageResultProps {
  action: RecommendedAction;
}
// RecommendedAction = 'auto_refund' | 'manual_review' | 'escalate_to_fraud'
//                   | 'contact_customer' | 'reject_dispute'
```

### Tailwind classes — key elements

```
// Card — high urgency
"rounded-lg border-2 border-red-400 bg-red-50 px-5 py-4
 flex items-center gap-3 text-red-800 font-semibold text-base"

// Card — standard priority (example: manual_review)
"rounded-lg border-2 border-blue-400 bg-blue-50 px-5 py-4
 flex items-center gap-3 text-blue-800 font-semibold text-base"

// Label text
"text-base font-semibold"
```

---

## Status History List

**Purpose:** Chronological list of all status changes for a dispute.
Rendered inside `DisputeDetail`. Each entry shows the new status as a
colour-coded badge, the reason text, and the formatted timestamp.

**React component:** `client/src/components/StatusHistory.tsx`

### Layout

```
┌──────────────────────────────────────────────┐
│  [ Reopened ]   22 Jun 2026, 11:30 AM        │ ← status badge + timestamp
│  Customer provided new evidence of fraud.    │ ← reason text
├──────────────────────────────────────────────┤
│  [ Resolved ]   22 Jun 2026, 10:00 AM        │
│  Closed after initial investigation.         │
└──────────────────────────────────────────────┘
```

Empty history:

```
│  No status changes recorded yet.             │  ← italic gray text
```

### `data-testid` attributes

| Element | `data-testid` |
|---|---|
| List container | `status-history-list` |

### Tailwind classes

```
// Entry wrapper
"flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"

// Timestamp
"text-xs text-gray-400"

// Reason text
"text-sm text-gray-700"
```

---

## User Flow Diagram

```
App loads
    │
    ▼
[ New Dispute Form ]  ←──────────────────────────────────────────┐
    │                                                             │
    │  fill + submit                                              │
    ▼                                                             │
[ Triage Result Card ]                                            │
(embedded in form,                                               │
 shown above fold)                                               │
    │                                                             │
    │  click "Disputes" tab                                       │
    ▼                                                             │
[ Dispute List ]                                                  │
    │                                                             │
    │  click a row                                                │
    ▼                                                             │
[ Dispute Detail ]                                                │
    │                                                             │
    │  if resolved:                                               │
    ├──→ click Reopen → [ Confirm Panel ] → submit → refresh     │
    ├──→ click Escalate → [ Confirm Panel ] → submit → refresh   │
    │                                                             │
    │  if reopened:                                               │
    ├──→ click Escalate → [ Confirm Panel ] → submit → refresh   │
    │                                                             │
    │  click ← Back                                               │
    └─────────────────────────────────────────────────────────────┘
```

---

## Accessibility Notes

- All form inputs have associated `<label>` elements with `htmlFor`.
- Required fields are marked with `*` in the label and a `role="alert"`
  paragraph for screen readers on error.
- Action buttons use descriptive text ("Reopen", "Escalate to Fraud
  Team") not icons alone.
- Tab order follows document order — no `tabIndex` manipulation.
- Colour is never the only indicator of state: error inputs also have
  `role="alert"` text; urgency cards also have text labels.
- WCAG 2.1 AA colour contrast: all text/background combinations use
  Tailwind's `-700`/`-50` or `-800`/`-50` pairings which meet 4.5:1
  minimum. Full validation requires manual testing with assistive
  technologies and expert accessibility review.
