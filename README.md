# Newsletter Preferences — Frontend

React + TypeScript frontend for the Newsletter Preferences recruitment exercise. Pairs with the .NET 10 backend in the [`NPS`](https://github.com/alimkdd/NPS) repo.

## Stack

| Concern               | Choice                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| Build / dev           | Vite 8                                                                      |
| UI                    | React 19 + TypeScript                                                       |
| Styling               | Tailwind CSS v3 with custom `brand` + `midnight` palettes, dark mode toggle |
| Accessible primitives | Headless UI (`ConfirmDialog`, `ThemeToggle` transitions)                    |
| Icons                 | Heroicons (outline + solid)                                                 |
| Routing               | React Router v7                                                             |
| Server state          | TanStack Query v5                                                           |
| Forms                 | React Hook Form + Zod resolver (Zod v4)                                     |
| Toasts                | `sonner` (theme-aware, top-right)                                           |
| **Admin auth**        | **Keycloak (OIDC)** via `keycloak-js` (Auth Code + PKCE), with legacy **WebAuthn / passkey** (`@simplewebauthn/browser`) as a fallback |

## Prerequisites

- Node 20+ (developed on Node 24)
- The backend API running locally on the **https profile** — see the [NPS repo](https://github.com/alimkdd/NPS). Default `https://localhost:7287` (https) with `http://localhost:5289` as fallback.
- **One-time HTTPS setup** (so the dev server has a trusted cert that browsers/WebAuthn accept):

  ```powershell
  # Install mkcert and trust its local CA
  winget install FiloSottile.mkcert --source winget
  mkcert -install

  # Generate the localhost cert into ./certs/ (already in .gitignore)
  New-Item -ItemType Directory -Path certs -Force | Out-Null
  cd certs
  mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
  cd ..
  ```

  Without these certs Vite falls back to plain HTTP, which **breaks WebAuthn** (the spec only allows `https://` origins or the literal `http://localhost`).

## Quick start

```powershell
# 1. Copy the env file
copy .env.example .env.local

# 2. Install deps
npm install

# 3. Run the dev server (serves over HTTPS once mkcert certs exist)
npm run dev
```

Vite serves at `https://localhost:5173`. The backend's CORS allow-list already includes that origin.

## Available scripts

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR.                                 |
| `npm run build`   | `tsc -b && vite build` — typecheck + production bundle.   |
| `npm run preview` | Serve the production build locally.                       |
| `npm run lint`    | Run ESLint over `src/`.                                   |

## Configuration

Env vars exposed to the bundle via `import.meta.env.*`:

| Key                       | Default                   | Purpose                                                                                                                                  |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`       | `https://localhost:7287`  | Backend origin. Matches the BE's https launch profile. If you run the BE on http only, override to `http://localhost:5289`.              |
| `VITE_KEYCLOAK_URL`       | `http://localhost:8080`   | Keycloak base URL. The BE's docker-compose runs Keycloak here.                                                                            |
| `VITE_KEYCLOAK_REALM`     | `nps`                     | Realm imported by the backend (`keycloak/realm-export.json`).                                                                            |
| `VITE_KEYCLOAK_CLIENT_ID` | `nps-admin-spa`           | Public SPA client (Authorization Code + PKCE).                                                                                            |

`.env.local` is gitignored. `.env.example` is committed as the template.

## Routes

| Route                    | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `/`                      | Public subscription form with live progress stepper.                                          |
| `/unsubscribe`           | Public unsubscribe form (email only; always returns the same response — no enumeration leak). |
| `/admin`                 | Admin sign-in — **Sign in with Keycloak** (primary) plus a device-passkey fallback.           |
| `/admin/subscriptions`   | Admin dashboard — stats cards, paged list, search, filter, soft-delete with confirm dialog.   |

The admin guard in [src/components/AdminGuard.tsx](src/components/AdminGuard.tsx) waits for Keycloak's silent SSO check, then redirects to `/admin` unless authenticated via Keycloak **or** a valid passkey session.

## Project layout

```
src/
  App.tsx                       routes + providers
  main.tsx                      entry
  index.css                     Tailwind directives, base styles, smooth scroll
  lib/
    api.ts                      typed fetch wrapper, attaches Authorization: Bearer
    keycloak.ts                 keycloak-js instance, one-time init, token + login/logout helpers
    auth.ts                     unified token/identity accessor over Keycloak + passkey (no React)
    authContext.tsx             AuthProvider + useAuth — silent SSO on mount, exposes auth state
    passkey.ts                  WebAuthn ceremonies (status / register / login) on @simplewebauthn/browser
    session.ts                  sessionStorage for the passkey JWT + expiry checks
    queryClient.ts              TanStack Query defaults
    theme.tsx                   light/dark provider, sessionStorage + prefers-color-scheme
    types.ts                    DTOs matching the backend, ApiError class
  schemas/
    subscription.ts             Zod schemas (subscribe + unsubscribe)
  components/
    AdminGuard.tsx              redirect-if-no-session wrapper
    layout/AppLayout.tsx        header + nav + footer
    ui/                         Button, Alert, Card, ConfirmDialog, EmptyState, StatCard,
                                Spinner, Skeleton, ThemeToggle, AppToaster (sonner host)
    forms/FieldError.tsx        accessible error message
  pages/
    SubscribePage.tsx           public form: progress stepper, conditional fields, sticky footer
    UnsubscribePage.tsx         public unsubscribe
    AdminLoginPage.tsx          Keycloak sign-in (primary) + device-passkey fallback
    AdminListPage.tsx           paged table, stats row, ConfirmDialog before destructive actions
    NotFoundPage.tsx            404
```

## Admin sign-in flow

Auth is **unified across two methods** behind one context ([src/lib/authContext.tsx](src/lib/authContext.tsx)) and one token accessor ([src/lib/auth.ts](src/lib/auth.ts)). `api.ts` calls `getAdminToken()`, which prefers Keycloak and falls back to the passkey session.

**Keycloak (primary).** On load, `AuthProvider` runs `keycloak-js` `init({ onLoad: 'check-sso', pkceMethod: 'S256' })` — a hidden-iframe silent SSO check ([public/silent-check-sso.html](public/silent-check-sso.html)) that restores an existing Keycloak session without a visible redirect. **Sign in with Keycloak** redirects to the Keycloak login page (password or passkey, configured in the realm); on return, keycloak-js exchanges the code (PKCE) for an RS256 access token kept in memory and auto-refreshed before expiry. The backend validates it via the realm JWKS.

**Passkey (legacy fallback).** The original WebAuthn ceremony still works: `GET /api/admin/auth/status` → `POST /login/begin` → `navigator.credentials.get()` → `POST /login/complete` returns a self-issued JWT stored in `sessionStorage`. The backend's multi-scheme auth accepts it on the same admin endpoints.

In both cases the token is attached as `Authorization: Bearer <jwt>` by `api.ts`. A 401 clears the passkey session (a no-op under Keycloak, whose own refresh handles expiry) and the UI bounces back to `/admin`.

The biometric/secret material never leaves the device — the browser proves identity to the server via a signed challenge; the server only stores the public half of the credential.

## How the form mirrors the backend rules

Client-side validation is intentionally a strict superset of what the server enforces. Every rule runs in Zod before the request leaves the browser; if the server still complains, those messages surface in a red `Alert` and a sonner error toast.

- **Required fields** — first name, last name, email, subscriber type, at least one comms preference, at least one interest, consent must be true.
- **Email regex** — `^[^\s@]+@[^\s@]+\.[^\s@]+$` (matches the backend's `Email` value object, deliberately stricter than the lenient FluentValidation `EmailAddress()`).
- **Conditional phone** — Phone or SMS in the comms preferences forces a phone number. The field also appears/disappears live as you tick those boxes.
- **Conditional postal address** — Post in comms preferences forces a postal address; the textarea is hidden until then.
- **Lookup IDs** — the form only offers IDs the backend returned from `/api/lookups`, so the server-side referential checks should never fail in normal use.
- **Live progress stepper** — clickable; smooth-scrolls to the matching section.

## Accessibility

- All form controls have `<label htmlFor>` pairs.
- Errors are wired up with `aria-invalid` + `aria-describedby` pointing at the message element, so screen readers announce them on focus.
- `role="radiogroup"` on the subscriber-type group; native checkboxes for multi-select.
- `:focus-visible` ring on every focusable element via global CSS.
- Sonner toasts use ARIA live regions out of the box.
- The progress stepper exposes `aria-label="Form progress"` and `aria-current="step"` on the active step.
- The admin table uses `<th>` headers; the confirm dialog uses Headless UI's `Dialog` for proper focus trapping + ESC handling.
- `html { scroll-behavior: smooth }` is wrapped in a `prefers-reduced-motion` opt-out so motion-sensitive users get instant scroll.

## Talking to the backend

[src/lib/api.ts](src/lib/api.ts) is the single source of HTTP calls. Notable behaviours:

- Pulls the JWT from `sessionStorage` for admin calls and attaches it as `Authorization: Bearer ...`. If the token is missing or expired, an `ApiError(401, ...)` is thrown before the request leaves the browser.
- A `401` from an admin endpoint clears the session so the UI bounces back to `/admin` instead of looping.
- Reads `X-Correlation-Id` off every response and surfaces it inside `ApiError` — used in the subscribe success toast as a "Ref: …" so the user has a handle for support.
- Network failures map to `ApiError(0, "Cannot reach the server")` rather than a raw `TypeError`.

## Production notes

- `.env.local`, `certs/`, `*.pem`, and any `.env*` files are gitignored — set `VITE_API_BASE_URL` via your deployment platform and use a real TLS cert (not mkcert) in production.
- `npm run build` runs `tsc -b` first, so type errors fail the build.
- HSTS, security headers, rate limiting, JWT validation, and WebAuthn verification all live on the backend — the frontend just orchestrates the ceremonies and presents the UI.

## For the reviewer — how to demo

Admin sign-in is delegated to Keycloak, so the demo on your machine looks like this:

1. Start the backend stack (`docker compose up -d` brings up SQL Server **and** Keycloak), run the BE on the `https` profile, then the frontend. Visit `https://localhost:5173/admin`.
2. Click **Sign in with Keycloak**. You're redirected to the Keycloak login page — sign in as the seeded realm user (`admin` / `AdminDev_2024!`, see the backend's `keycloak/README.md`). You're returned to the dashboard, authenticated.
3. **Sign out** returns you to Keycloak's session end and back to `/admin`.

A **device passkey** fallback is still on the login page (the original WebAuthn flow): enroll/sign-in with Windows Hello / Touch ID / a security key, which the backend accepts on the same endpoints via its multi-scheme auth. If you don't have a platform authenticator, Keycloak's password login is the simplest path.

## AI usage

I used **Claude Code** (Anthropic) inside VS Code to scaffold and iterate on this app. Specifically:

- The component / page / lib layout, the Zod schema with the conditional rules, and the TanStack Query setup were AI-drafted.
- The custom `midnight` Tailwind palette + radial-gradient body backgrounds were AI-suggested and I tuned the shades by eye.
- The WebAuthn FE wrapping (`passkey.ts`) was AI-drafted on top of `@simplewebauthn/browser`; I added the explicit `humanize()` mapping for DOMException error names because the raw messages are useless to end users.
- The Vite + mkcert setup was AI-guided after I rejected the `@vitejs/plugin-basic-ssl` approach (Chrome rightly flags self-signed certs as "Not secure").

**Where I pushed back on or rejected suggestions:**

- AI initially suggested keeping the admin **API key in localStorage**. Switched to `sessionStorage` first (so it clears on tab close), then replaced the whole approach with WebAuthn + JWT.
- AI proposed a clickable stepper that just used URL anchors. I wanted reliable smooth scrolling under a sticky header — implemented with `IntersectionObserver` for the sticky submit footer + `scrollIntoView({ behavior: 'smooth' })` + `scroll-mt-28` on the section cards.
- AI's first Zod schema relied on `z.literal(true, { errorMap })` — Zod v4 removed `errorMap`. Rewrote with `z.boolean().refine(v => v === true, ...)`.
- AI suggested making the Subscribe page success a green Alert AND a toast. The user pointed out this is double-work — kept only the toast and put the correlation ID in its description.
- AI's first attempt at a Tailwind override for the Sign out button used regular `dark:bg-*` classes that lost to the variant's classes due to CSS source order. Switched to `!important` (`dark:!bg-midnight-600`) so the override wins deterministically.

## What I'd do with more time

- A passkey-management UI on the admin side (list / rename / revoke registered credentials).
- Pull the `LookupItem` / `SubscriptionResponse` types from an OpenAPI client generator so the FE and BE can't drift.
- Unit tests for the conditional-field logic + a Playwright happy-path test that drives the WebAuthn ceremony via a virtual authenticator (Chromium DevTools Protocol supports this).
- A "subscribed-confirmation" page that shows the user back the data we recorded (would need a public, token-mediated GET endpoint on the backend).
- Code-splitting — the main bundle is currently ~520 KB minified, mostly TanStack Query + Headless UI + simplewebauthn. Dynamic-import the admin section to cut the public-form bundle.
