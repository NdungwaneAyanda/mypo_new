# API Reference

Base URL (development): `http://localhost:5076/api`
Base URL (production): `https://yourdomain.com/api`

All protected endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication — `POST /api/auth`

### `POST /api/auth/register`
Register a new supplier account.

**Auth required:** No

**Request body:**
```json
{
  "email": "supplier@example.com",
  "password": "YourPassword123!"
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "supplier@example.com",
    "roles": ["supplier"],
    "profile": { "email": "supplier@example.com", "refCode": "SUP-00001" }
  }
}
```

**Response `400`:** `{ "message": "Email already in use." }`

---

### `POST /api/auth/login`
Login with email and password.

**Auth required:** No

**Request body:**
```json
{ "email": "user@example.com", "password": "YourPassword123!" }
```

**Response `200`:** Same shape as `/register`.

**Response `401`:** `{ "message": "Invalid email or password." }`

---

### `POST /api/auth/forgot-password`
Request a password reset email.

**Auth required:** No

**Request body:** `{ "email": "user@example.com" }`

**Response `200`:** `{ "message": "If that email exists, a reset link has been sent." }`

The reset link points to `{FrontendUrl}/reset-password?token=<token>`. Token expires in **1 hour**.

---

### `POST /api/auth/reset-password`
Reset password using a valid token.

**Auth required:** No

**Request body:**
```json
{ "token": "<reset_token>", "newPassword": "NewPassword123!" }
```

**Response `200`:** `{ "message": "Password reset successfully." }`
**Response `400`:** `{ "message": "Invalid or expired reset token." }`

---

### `GET /api/auth/me`
Get the currently authenticated user.

**Auth required:** Yes (any role)

**Response `200`:**
```json
{
  "id": "<uuid>",
  "email": "user@example.com",
  "roles": ["supplier"],
  "profile": {
    "companyName": "Acme Ltd",
    "contactName": "John Doe",
    "email": "john@acme.com",
    "phone": "0821234567",
    "refCode": "SUP-00001"
  }
}
```

---

## Applications — `/api/applications`

All endpoints require authentication (`[Authorize]`). Access rules differ by role.

### `GET /api/applications`
List applications.

**Auth required:** Yes

- **Supplier:** Returns only their own applications.
- **Funder:** Returns all `pending` and `reviewed` applications, plus `successful` ones they funded.

**Response `200`:** Array of application objects (see schema below).

---

### `GET /api/applications/{id}`
Get a single application.

**Auth required:** Yes

**Response `200`:** Single application object.
**Response `404`:** Not found.
**Response `403`:** Access denied.

---

### `POST /api/applications`
Submit a new funding application.

**Auth required:** Yes (supplier)

**Request body:**
```json
{
  "companyName": "Acme Ltd",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "phone": "0821234567",
  "industry": "Construction",
  "poAmount": 500000,
  "costOfDelivery": 300000,
  "amountNeeded": 300000,
  "customerName": "City of Johannesburg",
  "paymentTerms": "30 days",
  "description": "Optional details"
}
```

**Response `201`:** Created application object.

Side effects:
- Sends confirmation email to the applicant.
- Pushes `NewOpportunity` SignalR event to all connected funders.

---

### `POST /api/applications/{id}/documents`
Upload a document to an application.

**Auth required:** Yes

**Query parameter:** `documentType` — one of:
- `purchase_order`
- `company_registration`
- `bank_confirmation`
- `director_id`
- `company_proof_of_address`
- `director_proof_of_address`

**Body:** `multipart/form-data` with field `file`

**Constraints:**
- Max size: **5 MB**
- Allowed types: `.pdf`, `.doc`, `.docx`

**Response `200`:** Document object with `id`, `documentType`, `fileName`, `fileSize`, `createdAt`.

---

### `PUT /api/applications/{id}/documents/{docId}`
Replace an existing document.

**Auth required:** Yes

Same constraints as upload. Deletes the old physical file and saves the new one.

---

### `GET /api/applications/{id}/documents/{docId}/download`
Download a document file.

**Auth required:** Yes

**Response:** File stream with appropriate `Content-Type`.

---

### `PUT /api/applications/{id}/claim`
Claim or fund an application (funders only).

**Auth required:** Yes (`funder` role)

**Request body:**
```json
{ "action": "take" }
```

| `action` | Result |
|---|---|
| `"take"` | Marks application as `successful`, assigns the funder, sends success email to applicant. |
| `"review"` | Marks application as `reviewed`, assigns the funder for review. |

**Response `200`:** Updated application object.
**Response `400`:** If application is not `pending`.

---

### `GET /api/applications/{id}/messages`
Get all messages for an application.

**Auth required:** Yes

Marks all unread messages for the current user as read.

**Response `200`:** Array of message objects.

---

### `POST /api/applications/{id}/messages`
Send a message on an application.

**Auth required:** Yes

Only available when application status is `successful`.

**Request body:** `{ "messageText": "Hello!" }`

**Response `200`:** Message object.

Side effects: broadcasts `ReceiveMessage` event to the `app-{id}` SignalR group.

---

## Funders — `/api/funders`

### `POST /api/funders/signup`
Public funder registration (creates user + funder profile in one step).

**Auth required:** No

**Request body:**
```json
{
  "email": "funder@company.com",
  "password": "Password123!",
  "companyName": "ABC Capital",
  "contactName": "Jane Smith",
  "phone": "0112345678",
  "companyWebsite": "https://abccapital.co.za",
  "yearsInBusiness": 5,
  "fundingCapacity": "R500k - R2m",
  "fundingDescription": "We fund POs in the construction sector.",
  "industries": ["Construction", "Mining"],
  "minPoAmount": 100000,
  "maxPoAmount": 2000000
}
```

**Response `200`:** Auth response with token and user.

---

### `POST /api/funders/register`
Register current user as a funder (must already be logged in).

**Auth required:** Yes

**Request body:** Same as signup minus `email` and `password`.

**Response `200`:** Funder profile object.

---

### `GET /api/funders/me`
Get current user's funder profile.

**Auth required:** Yes (`funder` role)

**Response `200`:** Funder profile object.

---

## Profile — `/api/profile`

### `GET /api/profile`
Get current user's supplier profile.

**Auth required:** Yes

**Response `200`:**
```json
{
  "companyName": "Acme Ltd",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "phone": "0821234567",
  "refCode": "SUP-00001"
}
```

---

### `PUT /api/profile`
Update current user's profile.

**Auth required:** Yes

**Request body:** Any subset of `companyName`, `contactName`, `phone`.

**Response `200`:** Updated profile object.

---

## Contact — `/api/contact`

### `POST /api/contact`
Submit a contact form message. Sends an email via Resend.

**Auth required:** No

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "General Inquiry",
  "message": "Hello, I would like to know more."
}
```

**Response `200`:** `{ "message": "Message sent successfully." }`

---

## Unsubscribe — `/api/unsubscribe`

### `GET /api/unsubscribe?token={token}`
Validate an unsubscribe token.

**Auth required:** No

**Response `200`:** `{ "email": "funder@company.com" }`
**Response `404`:** Invalid token.

---

### `POST /api/unsubscribe`
Confirm unsubscription. Sets `IsActive = false` on the funder record.

**Auth required:** No

**Request body:** `{ "token": "<unsubscribe_token>" }`

**Response `200`:** `{ "message": "Unsubscribed successfully." }`

---

## Admin — `/api/admin`

All admin endpoints require `[Authorize(Roles = "admin")]`.

### `GET /api/admin/stats`
Platform overview stats.

**Response `200`:**
```json
{
  "totalUsers": 120,
  "totalApplications": 85,
  "totalFunders": 12,
  "pendingCount": 30,
  "reviewedCount": 15,
  "fundedCount": 40,
  "totalFundingRequested": 12500000.00
}
```

### `GET /api/admin/users`
List all users with roles, profile, and application count.

### `PUT /api/admin/users/{id}/role`
Add or remove a role from a user.

**Request body:** `{ "role": "funder", "action": "add" }` or `{ "role": "funder", "action": "remove" }`

### `DELETE /api/admin/users/{id}`
Delete a user. Cannot delete yourself.

### `GET /api/admin/applications`
List all applications with funder assignment info.

### `PUT /api/admin/applications/{id}/status`
Override an application's status.

**Request body:** `{ "status": "declined" }` — valid values: `pending`, `reviewed`, `successful`, `declined`.

### `DELETE /api/admin/applications/{id}`
Permanently delete an application.

### `GET /api/admin/funders`
List all registered funders.

### `PUT /api/admin/funders/{id}/active`
Activate or deactivate a funder.

**Request body:** `{ "isActive": false }`
