# Newsletter Preferences — Frontend

React + TypeScript frontend for the Newsletter Preferences recruitment exercise. Pairs with the .NET 10 backend in the [`NPS`](https://github.com/alimkdd/NPS) repo.

## Stack

| Concern | Choice |
| --- | --- |
| Build / dev | Vite 8 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v3, custom `brand` palette, `:focus-visible` ring |
| Accessible primitives | Headless UI (kept as a dependency for any future menu/dialog work) |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod resolver |

## Prerequisites

- Node 20+ (developed on Node 24)
- The backend API running locally — see [the NPS repo](https://github.com/alimkdd/NPS) (default `http://localhost:5289`)

## Quick start

```powershell
# 1. Copy the env file (defaults work for local dev)
copy .env.example .env.local

# 2. Install deps
npm install

# 3. Run the dev server
npm run dev
```

Vite serves the app at `http://localhost:5173`. The backend's CORS allow-list is preconfigured to include that origin.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | `tsc -b && vite build` — typecheck + production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint over `src/`. |

## Configuration

Single env var, exposed to the bundle as `import.meta.env.VITE_API_BASE_URL`:

| Key | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5289` | Backend origin. Used by every fetch in [src/lib/api.ts](src/lib/api.ts). |

`.env.local` is gitignored. `.env.example` is committed as the template.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public subscription form. |
| `/unsubscribe` | Public unsubscribe form (email only — always returns the same response). |
| `/admin` | Admin sign-in (enter the API key). |
| `/admin/subscriptions` | Admin dashboard — paged list, search, filter, soft-delete. |

The admin guard in [src/components/AdminGuard.tsx](src/components/AdminGuard.tsx) redirects to `/admin` if no key is stashed in `sessionStorage`.

## Project layout

```
src/
  App.tsx                       routes + providers
  main.tsx                      entry
  index.css                     Tailwind directives + base styles
  lib/
    api.ts                      typed fetch wrapper, ApiError mapping
    auth.ts                     sessionStorage helpers for the admin key
    queryClient.ts              TanStack Query defaults
    types.ts                    DTOs matching the backend, ApiError class
  schemas/
    subscription.ts             Zod schemas (subscribe + unsubscribe)
  components/
    AdminGuard.tsx              redirect-if-no-key wrapper
    layout/AppLayout.tsx        header + nav + footer
    ui/                         Button, Alert, Spinner
    forms/FieldError.tsx        accessible error message
  pages/
    SubscribePage.tsx           public form (validation + conditional fields)
    UnsubscribePage.tsx         public unsubscribe
    AdminLoginPage.tsx          key entry + probe against /api/admin/subscriptions
    AdminListPage.tsx           paged table + filters + delete
    NotFoundPage.tsx            404
```

## How the form mirrors the backend rules

Client-side validation is intentionally a strict superset of what the server enforces. Every rule below runs in Zod before the request leaves the browser; if the server still complains, those messages surface in a red `Alert` at the top of the form.

- **Required fields** — first name, last name, email, subscriber type, at least one comms preference, at least one interest, consent must be true.
- **Email regex** — `^[^\s@]+@[^\s@]+\.[^\s@]+$` (same shape as the backend's `Email` value object, deliberately stricter than the lenient FluentValidation `EmailAddress()`).
- **Conditional phone** — Phone or SMS in the comms-preferences list forces a phone number. The phone field also appears/disappears live as you tick those boxes.
- **Conditional postal address** — Post in comms preferences forces a postal address; the textarea is hidden until then.
- **Lookup IDs** — the form lets you pick only IDs the backend actually returned from `/api/lookups`, so the server-side referential checks should never fail in normal use.

## Accessibility

- All form controls have `<label htmlFor>` pairs.
- Errors are wired up with `aria-invalid` + `aria-describedby` pointing at the message element, so screen readers announce them on focus.
- Native radio/checkbox groups inside `<fieldset>` + `<legend>` (subscriber type, comms preferences, interests).
- `:focus-visible` ring on every focusable element via the global CSS.
- Status messages use `role="alert"` (errors) and `role="status"` (loading) so live regions fire.
- The admin table uses `<th>` headers with `scope` implied by being inside `<thead>`; a screen-reader-only "Actions" header keeps the layout column accessible.

## Talking to the backend

[src/lib/api.ts](src/lib/api.ts) is the single source of HTTP calls. Notable behaviours:

- Reads `X-Correlation-Id` off every response and surfaces it inside `ApiError`. The subscribe success alert displays it as a "Reference" for the user.
- Admin requests pull the key from `sessionStorage` (set on the login page). If it's missing or rejected, the user is bounced back to `/admin`.
- Network failures are mapped to `ApiError(0, ...)` so the UI can show a consistent "Cannot reach the server" message rather than a raw `TypeError`.

## Production notes

- `.env.local` and any `.env*` files are gitignored — set `VITE_API_BASE_URL` via your deployment platform.
- `npm run build` runs `tsc -b` first, so type errors fail the build.
- HSTS, security headers, rate limiting and admin auth all live on the backend — this frontend just consumes the API.

## AI usage

I used **Claude Code** (Anthropic) to scaffold and structure the project. Specifically:

- The component / page / lib layout, the Zod schema with the conditional rules, and the TanStack Query setup were AI-drafted.
- I made the call on Tailwind + Headless UI over Material UI / Chakra (better fit for the simple form + table surface here; smaller bundle; more control over a11y).
- I rejected an earlier AI suggestion to keep the admin key in `localStorage` — switched to `sessionStorage` so it clears on tab close.
- I rewrote the AI's first Zod schema after the `zod@4` upgrade broke the v3 syntax (`invalid_type_error`, `errorMap`); the file in the repo now uses the v4 API.
- I tightened the email regex on the client to match the backend's `Email` value object, instead of relying on Zod's default `.email()`.

## What I'd do with more time

- Replace the polled "X-Admin-Key" probe in [AdminLoginPage.tsx](src/pages/AdminLoginPage.tsx) with a proper `/api/admin/ping` endpoint on the backend.
- Toast notifications via Headless UI's `Transition` (currently using inline `Alert` only).
- Unit tests for the conditional-field logic and a Playwright happy-path test.
- Pull the `LookupItem` / `SubscriptionResponse` types from an OpenAPI client generator so the FE and BE can't drift.
- A subscribed-confirmation step that shows the user back the data we recorded (would need a public, token-mediated GET endpoint on the backend).
