# Admin Guide

## Accessing the Admin Panel

1. Log in at `/auth` using the admin credentials configured in `appsettings.json` (or `appsettings.Production.json`).
2. Navigate to `/admin`.

Access is protected by `authGuard` + `adminGuard`. Any attempt to access `/admin` without the `admin` role redirects to `/dashboard`.

Default credentials (change in production):
- Email: `admin@mypo.co.za`
- Password: `Admin@MyPO2026!`

---

## Dashboard Stats

The top of the admin panel shows a live overview:

| Stat | Description |
|---|---|
| Total Users | All registered user accounts |
| Total Applications | All funding applications ever submitted |
| Total Funders | All registered funder companies |
| Pending | Applications awaiting funder action |
| Reviewed | Applications claimed by a funder for review |
| Funded | Applications marked as `successful` |
| Total Funding Requested | Sum of `amount_needed` across all applications (ZAR) |

---

## Managing Users

**Endpoint:** `GET /api/admin/users`

The users list shows each user's email, roles, company name, ref code, registration date, and application count.

### Add or Remove a Role

Use `PUT /api/admin/users/{id}/role` with body:
```json
{ "role": "funder", "action": "add" }
```
or
```json
{ "role": "supplier", "action": "remove" }
```

Valid roles: `supplier`, `funder`, `admin`

**Constraints:**
- You cannot remove the `admin` role from your own account.

### Delete a User

Use `DELETE /api/admin/users/{id}`.

- You cannot delete your own account.
- Deleting a user cascades to their profile, roles, and applications (depending on database cascade rules).

---

## Managing Applications

**Endpoint:** `GET /api/admin/applications`

Shows all applications with ref code, company, status, PO amount, amount needed, assigned funder, and document count.

### Override Application Status

Use `PUT /api/admin/applications/{id}/status` with body:
```json
{ "status": "declined" }
```

Valid statuses: `pending`, `reviewed`, `successful`, `declined`

Use `declined` to reject applications that don't meet requirements. The admin is the only one who can set this status.

### Delete an Application

Use `DELETE /api/admin/applications/{id}`.

This permanently deletes the application and its associated records. Use with caution — there is no soft delete.

---

## Managing Funders

**Endpoint:** `GET /api/admin/funders`

Shows all registered funder companies with their ref code, email, funding capacity, active status, and number of claimed applications.

### Activate / Deactivate a Funder

Use `PUT /api/admin/funders/{id}/active` with body:
```json
{ "isActive": false }
```

Deactivating a funder:
- Sets `is_active = false` in the database.
- The funder can no longer receive new opportunity notifications (they are filtered from the `NewOpportunity` broadcast).
- Existing funded applications are not affected.

Funders can also deactivate themselves via the unsubscribe link in emails.

---

## Admin Account Management

The admin account email and password are controlled by `appsettings.Production.json`:

```json
"Admin": {
  "Email": "admin@yourdomain.com",
  "Password": "NewStrongPassword123!"
}
```

To change the admin password:
1. Update `appsettings.Production.json` with the new password.
2. Restart the API service.
3. The new credentials are synced to the database automatically on startup.

---

## Security Notes

- Never share admin credentials.
- Change the default password immediately when going to production.
- All admin actions are logged (see Monitoring & Logging doc for log format).
- The API enforces `[Authorize(Roles = "admin")]` on every admin endpoint — the frontend guard is an additional UX layer, not the security boundary.
