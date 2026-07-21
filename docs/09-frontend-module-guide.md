# Frontend Module Guide

## Overview

The Angular client (`mypo-client`) is a standalone-component SPA using lazy-loaded routes. All feature modules live under `src/app/features/`.

---

## Project Structure

```
mypo-client/src/
├── app/
│   ├── core/                    # Guards, interceptors, services
│   ├── features/
│   │   ├── admin/               # Admin panel (admin role only)
│   │   ├── apply/               # Funding application form
│   │   ├── auth/                # Login, register, forgot/reset password
│   │   ├── dashboard/           # Supplier & funder dashboards
│   │   ├── funder/              # Funder registration
│   │   └── static/              # Home, About, Contact, Profile, Privacy, Terms, Unsubscribe, 404
│   ├── shared/                  # Shared components & pipes
│   ├── app.routes.ts            # All application routes
│   ├── app.config.ts            # App-level providers
│   └── app.ts                   # Root component
├── environments/
│   ├── environment.ts           # Development API URLs
│   └── environment.prod.ts      # Production API URLs (relative paths)
└── styles.scss                  # Global styles
```

---

## Routes

| Path | Component | Auth Required | Role |
|---|---|---|---|
| `/` | `HomeComponent` | No | — |
| `/auth` | `AuthComponent` | No | — |
| `/forgot-password` | `ForgotPasswordComponent` | No | — |
| `/reset-password` | `ResetPasswordComponent` | No | — |
| `/dashboard` | `DashboardComponent` | Yes | any |
| `/apply` | `ApplyComponent` | Yes | any |
| `/register-funder` | `RegisterFunderComponent` | No | — |
| `/profile` | `ProfileComponent` | Yes | any |
| `/unsubscribe` | `UnsubscribeComponent` | No | — |
| `/about` | `AboutComponent` | No | — |
| `/contact` | `ContactComponent` | No | — |
| `/privacy` | `PrivacyComponent` | No | — |
| `/terms` | `TermsComponent` | No | — |
| `/admin` | `AdminComponent` | Yes | `admin` |
| `/**` | `NotFoundComponent` | No | — |

---

## Feature Modules

### `features/auth`

Handles all authentication flows.

| Component | Purpose |
|---|---|
| `AuthComponent` | Combined login + register form. Switches between modes. |
| `ForgotPasswordComponent` | Sends password reset email. |
| `ResetPasswordComponent` | Accepts `?token=` query param and sets new password. |

---

### `features/dashboard`

The main view after login. Shows different content depending on the user's role.

- **Supplier view:** Lists submitted applications, their statuses, documents, and opens the chat when an application is `successful`.
- **Funder view:** Lists available applications (`pending`/`reviewed`), allows claiming, and opens chat on `successful` applications.

---

### `features/apply`

Protected form for submitting a new PO funding application. Fields include company name, industry, PO amount, cost of delivery, amount needed, customer name, and payment terms. After submission, documents can be uploaded.

---

### `features/funder`

| Component | Purpose |
|---|---|
| `RegisterFunderComponent` | Public signup form for funder companies. Creates a user account + funder profile in one step. |

---

### `features/admin`

Protected by both `authGuard` and `adminGuard`. Accessible only at `/admin` with the `admin` role.

Functionality:
- Platform stats overview (total users, applications, funders, funding amounts)
- User management — list all users, add/remove roles, delete users
- Application management — list all applications, override status, delete applications
- Funder management — list all funders, activate/deactivate

---

### `features/static`

Informational pages with no business logic.

| Component | Path |
|---|---|
| `HomeComponent` | `/` |
| `AboutComponent` | `/about` |
| `ContactComponent` | `/contact` |
| `ProfileComponent` | `/profile` (auth required) |
| `PrivacyComponent` | `/privacy` |
| `TermsComponent` | `/terms` |
| `UnsubscribeComponent` | `/unsubscribe` |
| `NotFoundComponent` | `/**` |

---

## Core (`app/core`)

Contains cross-cutting concerns shared across features:

- **`guards/auth.guard.ts`** — Redirects unauthenticated users to `/auth`.
- **`guards/admin.guard.ts`** — Redirects non-admin users to `/dashboard`.
- **Interceptors** — Likely attaches the JWT `Authorization` header to all outgoing HTTP requests automatically.
- **Services** — Auth service (stores/retrieves token), API service wrappers.

---

## Environment Configuration

The Angular app reads API URLs from the environment file at build time:

| Variable | Dev | Prod |
|---|---|---|
| `environment.apiUrl` | `http://localhost:5076/api` | `/api` |
| `environment.hubUrl` | `http://localhost:5076/hubs` | `/hubs` |

The production build is triggered with:
```bash
npm run build --configuration=production
```

This substitutes `environment.prod.ts` for `environment.ts` automatically.

---

## Running Locally

```bash
cd mypo-client
npm install
npm start       # starts dev server on http://localhost:4200
```

Ensure the .NET API is also running on port `5076` for API calls to work.
