# Authentication & Authorization

## Overview

MyPO uses **JWT (JSON Web Token) Bearer authentication** issued by the API and validated on every protected request. Passwords are hashed with **BCrypt**. There is no refresh token — the token is long-lived (configure expiry in `TokenService`).

---

## User Registration Flow

```
1. Client sends POST /api/auth/register  { email, password }
2. API checks email is not already in use
3. API creates:
   - User record (password BCrypt-hashed)
   - Profile record (same ID as user, with auto-generated SUP-NNNNN ref code)
   - UserRole record with role = "supplier"
4. API returns JWT + user object
5. Client stores token (localStorage) and navigates to dashboard
```

---

## Login Flow

```
1. Client sends POST /api/auth/login  { email, password }
2. API looks up user by email (case-insensitive)
3. BCrypt.Verify(password, passwordHash) — returns 401 if fails
4. API generates JWT with user ID + roles as claims
5. Client stores token and user data
```

---

## JWT Token Structure

The token is signed with **HS512** using the key from `Jwt:Key` in `appsettings.json`.

**Claims included:**

| Claim | Value |
|---|---|
| `sub` (`NameIdentifier`) | User's UUID |
| `role` | One claim per role (e.g. `supplier`, `funder`, `admin`) |
| `iss` | `MyPO.API` |
| `aud` | `MyPO.Client` |

**Validation settings:**
- Issuer signing key validated
- Issuer validated (`MyPO.API`)
- Audience validated (`MyPO.Client`)
- Token lifetime validated

---

## Sending the Token (Client)

Add the token in the `Authorization` header for every protected request:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...
```

For SignalR connections, pass it as a query parameter:

```
wss://yourdomain.com/hubs/chat?access_token=<token>
```

The API reads the `access_token` query parameter for requests to `/hubs/*` and treats it as the bearer token.

---

## Password Reset Flow

```
1. Client sends POST /api/auth/forgot-password  { email }
2. API generates a reset token (GUID) and sets expiry = now + 1 hour
3. API sends email with link: {FrontendUrl}/reset-password?token=<token>
4. User clicks link; client sends POST /api/auth/reset-password { token, newPassword }
5. API validates token + expiry, hashes new password, clears token fields
```

The API always returns `200` for forgot-password (even for unknown emails) to prevent email enumeration.

---

## Role-Based Authorization

### Endpoint-Level Rules

| Endpoint Group | Required Role |
|---|---|
| `POST /api/auth/register` | None (public) |
| `POST /api/auth/login` | None (public) |
| `POST /api/funders/signup` | None (public) |
| `POST /api/contact` | None (public) |
| `GET/POST /api/unsubscribe` | None (public) |
| `GET/POST /api/applications` | Any authenticated user |
| `PUT /api/applications/{id}/claim` | `funder` role |
| `GET/PUT /api/profile` | Any authenticated user |
| `GET /api/funders/me` | Any authenticated user (funder profile) |
| `GET /api/admin/*` | `admin` role only |

### Data-Level Rules (within authorized requests)

- **Suppliers** see only their own applications.
- **Funders** see all `pending`/`reviewed` applications and their own `successful` ones.
- **Admin** sees everything via the `/api/admin` endpoints.

---

## Admin Account

The admin account is seeded and kept in sync from `appsettings.json` on every startup:

```json
"Admin": {
  "Email": "admin@mypo.co.za",
  "Password": "Admin@MyPO2026!"
}
```

**Important for production:** Override these values in `appsettings.Production.json` with a strong, unique password. The admin password is re-hashed and synced on every deployment.

---

## Angular Auth Guards

The Angular client protects routes using two guards:

| Guard | File | Behaviour |
|---|---|---|
| `authGuard` | `core/guards/auth.guard.ts` | Redirects to `/auth` if no valid token in storage |
| `adminGuard` | `core/guards/admin.guard.ts` | Redirects to `/dashboard` if user does not have the `admin` role |

Protected routes: `/dashboard`, `/apply`, `/profile`, `/admin` (admin also requires `adminGuard`).

---

## Security Notes for Production

1. **Change the JWT key** — use a random 64+ character string, never commit it to source control.
2. **Change the admin password** — use a unique strong password in `appsettings.Production.json`.
3. **Rotate the Resend API key** — generate a production key in your Resend dashboard.
4. **Use HTTPS only** — configure Kestrel or your reverse proxy to enforce HTTPS.
5. **Set token expiry** — review `TokenService.cs` and set an appropriate `expires` claim for production.
