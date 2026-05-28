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
| **Admin auth**        | **WebAuthn / passkey** via `@simplewebauthn/browser`, JWT in sessionStorage |

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

Single env var, exposed to the bundle as `import.meta.env.VITE_API_BASE_URL`:

| Key                 | Default                   | Purpose                                                                                                                                  |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://localhost:7287`  | Backend origin. Matches the BE's https launch profile. If you run the BE on http only, override to `http://localhost:5289`.              |

`.env.local` is gitignored. `.env.example` is committed as the template.

## Routes

| Route                    | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `/`                      | Public subscription form with live progress stepper.                                          |
| `/unsubscribe`           | Public unsubscribe form (email only; always returns the same response — no enumeration leak). |
| `/admin`                 | Admin sign-in **with biometrics** — first-time enrollment or sign-in depending on state.      |
| `/admin/subscriptions`   | Admin dashboard — stats cards, paged list, search, filter, soft-delete with confirm dialog.   |

The admin guard in [src/components/AdminGuard.tsx](src/components/AdminGuard.tsx) redirects to `/admin` if no valid JWT is in `sessionStorage`.

## Project layout

```
src/
  App.tsx                       routes + providers
  main.tsx                      entry
  index.css                     Tailwind directives, base styles, smooth scroll
  lib/
    api.ts                      typed fetch wrapper, attaches Authorization: Bearer
    passkey.ts                  WebAuthn ceremonies (status / register / login) on @simplewebauthn/browser
    session.ts                  sessionStorage for the JWT + expiry checks
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
    AdminLoginPage.tsx          biometric sign-in / first-time enrollment branch
    AdminListPage.tsx           paged table, stats row, ConfirmDialog before destructive actions
    NotFoundPage.tsx            404
```

## Admin sign-in flow (WebAuthn)

1. On mount, `AdminLoginPage` calls `GET /api/admin/auth/status`. The response says whether the admin has any registered passkey.
2. **First-time enrollment** (no credentials yet): clicking the button calls `POST /register/begin`, then `navigator.credentials.create()` (via `@simplewebauthn/browser`) which triggers Windows Hello / Touch ID / a security key. The resulting attestation is sent to `POST /register/complete`. Immediately after, the FE calls the login flow so the admin is signed in without an extra click.
3. **Subsequent sign-ins**: `POST /login/begin` → `navigator.credentials.get()` → `POST /login/complete` returns a JWT, which `session.ts` stores in `sessionStorage` (with a 30s safety margin before its UTC expiry).
4. The JWT is attached to every admin API call as `Authorization: Bearer <jwt>` by `api.ts`. A 401 from any admin endpoint clears the session and bounces the user back to `/admin`.

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

The admin sign-in uses biometrics, so the demo on your machine looks like this:

1. After running both backend (`https` profile) and frontend, visit `https://localhost:5173/admin`.
2. Because no passkey is registered yet, you'll see **"Set up biometric sign-in"**. Click **Enroll this device** — your browser will prompt for Windows Hello / Touch ID / a security key. Approve it and you're auto-signed-in.
3. Subsequent visits show **"Sign in with biometrics"** instead. One click + biometric prompt and you're in.

If you don't have a platform authenticator on your laptop, a USB security key works too (YubiKey, Solokey, etc.). If neither is available, you can still walk through everything else and we can discuss the WebAuthn architecture during the interview — the integration tests on the backend issue real JWTs end-to-end so the auth wiring is exercised regardless.

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
