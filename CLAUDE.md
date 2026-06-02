# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run lint      # ESLint
```

No test suite is configured.

## Architecture Overview

This is a **multi-location laundry admin dashboard** (Wash24) built with Next.js 15 App Router. It manages staff attendance, delivery logistics, production tracking, cash reports, and stock across locations in Malang, Surabaya (3 branches), Jakarta, and Hotel & Karpet.

### Auth Flow

1. Login with Firebase email/password → Firestore lookup for user role/location
2. JWT issued and stored in a cookie
3. OTP 2FA step (skipped for master@wash24.com and kelsonsusilo@gmail.com)
4. Redirect based on role and location

Auth utilities live in `src/lib/auth/`. User state is held in a Zustand store at `src/store/user.tsx` and hydrated in the `(pages)` layout.

### Routing & Access Control

`src/constants/index.tsx` defines `SIDEBAR_ITEMS`, `LOCATIONS`, and `ROUTE_PERMISSIONS`. Routes are protected by role (`Master`, `Admin`, `Staff`) and filtered at the layout level.

- `/` — Login page
- `/(pages)/` — Protected shell with sidebar; child routes below
  - `/attendance`, `/attendance-report` — Master/Admin only
  - `/staff`, `/otp`, `/task` — Master only
  - `/delivery/[id]`, `/delivery-history/[id]` — location-scoped delivery
  - `/production/[id]`, `/cash-report/[id]`, `/stock/[id]` — location-scoped ops

Dynamic `[id]` segments correspond to location slugs: `mlg`, `sby`, `sby2`, `sby3`, `jkt3`, `hotel-n-karpet`.

### Data Layer

Firebase (Firestore) is initialized in `src/config/firebase.tsx`. There is no API layer — components read/write Firestore directly. Collections follow a location-based pattern: one top-level collection per location (`malang`, `surabaya`, `surabaya-2`, etc.) storing delivery, production, stock, and cash report subcollections/documents. The `users` and `OTP` collections are global.

### Component Patterns

- **UI primitives** — `src/components/ui/` wraps Radix UI with `class-variance-authority` + `tailwind-merge`
- **Popup forms** — `src/components/popup/` contains modal forms for each domain (delivery, production, staff, etc.)
- **Excel export** — `src/lib/excel/` has per-domain helpers using `json-as-xlsx`
- **Drag-and-drop delivery** — `src/components/drag-and-drop-delivery.tsx` uses `@dnd-kit`
- **Data tables** — `@tanstack/react-table` for tabular views

### Key Config Notes

- `next.config.ts` has `typescript.ignoreBuildErrors: true` — TypeScript errors won't block builds
- Path alias `@/*` → `src/*`
- Tailwind CSS v4 (no separate `tailwind.config.ts` needed)
- Requires `.env.local` with Firebase credentials (`NEXT_PUBLIC_FIREBASE_*`) and `JWT_SECRET`
