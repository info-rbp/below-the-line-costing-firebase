# Below the Line Costing – Firebase prototype

This repository contains the Firebase Studio prototype for the Below the Line costing wizard. It is a Next.js 14 application that
captures project cost data in Firestore through a guided workflow and renders read-only project dashboards for demos.

## Prerequisites

- Node.js 18 LTS
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- Access to the Firebase project credentials supplied by the client

Verify the local environment:

```bash
node -v
firebase --version
```

## Project structure

```
root
├── firebase.json
├── .firebaserc
├── package.json
├── public/
├── src/
│   ├── app/              # App Router pages (wizard, project detail, lookups admin)
│   ├── components/       # Shared UI such as the toast provider
│   ├── features/         # Reserved for future domain features
│   ├── lib/              # Firebase bootstrap, repositories, validation schemas
│   ├── materials/        # Reserved folders for scoped feature work
│   ├── milestones/
│   ├── payments/
│   ├── projects/
│   ├── styles/
│   └── types/
└── scripts/
```

## Installation

1. Copy the provided Firebase web app keys into `.env.local` (or use the included `.env.local.example` template).

   ```ini
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   > If registry access is blocked in your environment, request it or install the dependencies in Firebase Studio where internet
   > access is available.

3. Start the local dev server:

   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:3000` to open the wizard.

4. Build for static export (required when bundling for Firebase Studio hosting):

   ```bash
   npm run build
   ```

   The exported site will be written to `out/`. Run `npm run preview` to serve the static export for smoke testing.

## Firebase Studio usage

1. Open Firebase Studio and create environment variables that mirror the `.env.local` entries.
2. Run `npm install` and `npm run dev` within Studio to serve the application.
3. Use the wizard at `/wizard` to create a project, add milestones, cost line items, materials, and payment schedules.
4. Save drafts at any step. The data is written into the following Firestore paths:
   - `projects/{projectId}` – project basics and status
   - `projects/{projectId}/milestones` – milestone documents ordered by `sortIndex`
   - `projects/{projectId}/costLineItems` – labour and service entries
   - `projects/{projectId}/materialCosts` – material cost entries
   - `projects/{projectId}/paymentSchedules` – invoice records
 - `projects/{projectId}/lookups/{roles|materials|rateBands}/items` – lookup values that populate dropdowns
5. Submit the project from step 6 to mark it as `active` and navigate to `/projects/{projectId}` for the read-only overview.
6. Manage lookup values for dropdowns at `/projects/{projectId}/admin/lookups`.

## Demo data utilities

The repository now includes scripts that generate a comprehensive sample project for demos and a matching reset utility. Both commands require Firebase Admin credentials via either the `FIREBASE_SERVICE_ACCOUNT` environment variable (containing the JSON payload) or `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account file.

```bash
npm run seed   # creates a seeded demo project with milestones, costs, materials, and payments
npm run reset  # removes any documents created by the seed script (optionally pass --batch <seedBatchId>)
```

Each seeded document is tagged with `seeded: true` and a `seedBatchId`. Rerunning the seed command produces a fresh batch without affecting manually entered data. Use the UI controls on the lookups admin page to trigger the same seed and reset workflow in Firebase Studio without leaving the app.

## Wizard behaviour

- Validation is powered by `zod` and is enforced before moving between steps.
- “Save draft” persists the currently valid sections without requiring completion of later steps.
- Toast notifications provide success and error feedback for every save and load operation.
- All Firestore writes use consistent repositories located in `src/lib/repo`.

## Totals and rollups

- Monetary maths is calculated in cents inside `src/lib/calc` to prevent floating point rounding errors. Display helpers in
  `format.ts` convert the stored cents back into formatted currency strings.
- Milestone rollups include all descendant milestones. Selecting a parent milestone in the totals table filters cost build and
  materials lists to the entire branch.
- The executive header on `/projects/{id}` shows project totals broken down into labour, services, equipment, and materials,
  plus the milestone count and inferred delivery window.

### Allocation assumptions

- Labour, service, and equipment line items apportion their totals equally across linked milestones. If no milestone is linked,
  the amount falls back to the provided start date month (or the project window when dates are absent).
- Material costs:
  - `one-time` charges post in the provided month.
  - `monthly` charges repeat evenly for each calendar month between `startDate` and `endDate`.
  - `milestone` charges split evenly across linked milestones, again using the milestone month for allocation.
- The cash flow table aggregates monthly allocations for both labour and materials. Use the CSV export button to pull the data
  into a spreadsheet for further modelling.

## Payment plan and reconciliation

- The payment schedule panel subscribes to `projects/{id}/paymentSchedules`, supports multi-select linking to milestones and
  material cost lines, and blocks creation until `invoiceNo`, `invoiceDate`, and a positive `amount` pass validation.
- The billed vs remaining banner recalculates instantly as invoices are added or removed. The reconciliation summary below the
  schedule surfaces whether the project is under-billed, exactly billed, or over-billed.
- Run the “Rates audit” to highlight cost lines with missing or zero rates and open the “Validate data” modal to review data
  completeness checks before sharing a demo build.

## Client-ready executive summary

- Open `/projects/{projectId}/executive-summary` for a client-facing dashboard. The page is responsive and uses the aggregated
  totals from `useProjectAggregates`.
- Key metrics include overall cost, category subtotals, invoice variance badges, the next six months of cash flow, and the
  upcoming invoice list.
- The Print button triggers `window.print()` with the print stylesheet at `src/features/report/print.css`, producing an A4
  output with a footer that includes the generation date, project ID, and report version.
- The Export PDF button uses the wrapper in `src/features/report/ExportPDF.ts`. By default it falls back to `window.print()`,
  but it can be wired to a client-approved PDF library without touching the page implementation.
- Milestone and payment CSV buttons export the active view to spreadsheet-ready formats for handover packs.

### Filters and snapshots

- The report filter panel allows:
  - Including or excluding milestones
  - Toggling cost categories
  - Setting a month range for the cash flow table
- Filters recompute headline totals and the cash flow snapshot instantly via memoised selectors.
- Click **Create snapshot** to write the current data into `projects/{id}/reportSnapshots`. Selecting a snapshot from the
  dropdown rehydrates the stored totals so printed packs always align with the original review.

### Component demo

- `/dev/report-demo` renders the `KPICard`, `BreakdownTable`, `CashflowMiniChart`, and `InvoiceStatus` widgets with sample
  props so designers can verify layout changes without navigating a live project.

## Lookup administration

- `/projects/{projectId}/admin/lookups` now supports full CRUD for roles, materials, and rate bands. Name validation prevents
  duplicates, and rate bands require a numeric hourly rate.
- Editing happens inline with dedicated forms. Deleting a lookup checks for usage (e.g. cost lines referencing a role) before
  removing the value and shows a friendly error when the value is still in use.
- Lookup mutations invalidate the local cache so the wizard and other forms receive fresh dropdown options after each change.

## Testing checklist

| Command | Purpose |
| ------- | ------- |
| `npm run lint` | Lints the project with `eslint` |
| `npm run typecheck` | Runs TypeScript without emitting files |
| `npm run build` | Builds and exports the static bundle |
| `npm run preview` | Serves the exported build for a manual smoke test |

> When running inside this environment the npm registry may return HTTP 403. Run the commands in Firebase Studio if that
> occurs.

> ESLint now uses the flat configuration in `eslint.config.mjs`. Install dependencies locally before running `npm run lint`
> so the Next.js presets resolve correctly.

## Demo expectations

Record a short demo (screen capture is sufficient) that shows:

1. Creating a new project in the wizard and saving a draft.
2. Adding ten or more milestones including parent/child relationships.
3. Capturing several labour, material, and payment records.
4. Submitting the project and navigating to `/projects/{projectId}` to confirm the read-only panels populate.
5. Updating lookup values under `/projects/{projectId}/admin/lookups` and observing them populate dropdowns after a reload.

Following this README from a clean checkout enables another developer to reproduce the Firebase Studio demo end-to-end.
