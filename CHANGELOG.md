# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-23

### Added
- Standardized UI library in `frontend/src/components/ui/*` (Button, Card, Input, Table, etc.).
- Performance skeletons: `DashboardSkeleton.tsx` and `TableSkeleton.tsx`.
- Modular Card Designer logic and components.
- Global Context Providers: `CanvasContext`, `StudentContext`, `TemplateContext`.

### Changed
- **Dashboard Overhaul**: Redesigned layout with high-fidelity charts and recent enrollees view.
- **Applicants Registry**: Modernized registry interface with specialized workflow metrics (Issuance Rate, Production).
- **Departments Directory**: New sidebar-driven unit profiling with contextual analytics (Census Parity, Coverage).
- **Analytics Specialization**: Differentiated Metric Detail (Composition) and Velocity Detail (Audit Log).
- **Core Layout**: Updated `App.tsx` and `index.css` for consistent spacing and design tokens.

### Fixed
- Double scrollbar issues in `DepartmentsIndex.tsx` via `h-full` and `min-h-0` container refinements.
- Syntax errors and redundant exports in `ApplicantDetailsModal.tsx`.
- Legend/Label consistency in Recharts components.
