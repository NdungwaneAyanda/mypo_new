# Monitoring & Logging

## Overview

MyPO uses **Serilog** for structured logging in the .NET API. Logs are written to both the console and rolling daily log files.

---

## Log File Location

```
MyPO.API/
└── logs/
    ├── mypo-20260721.log
    ├── mypo-20260720.log
    └── ...
```

- One file per day, named `mypo-<date>.log`
- **30 days** of files retained (older files are deleted automatically)
- Location: relative to the API's content root (`MyPO.API/` in development, `publish/` in production)

---

## Log Format

**Console output:**
```
[14:22:01 INF] HTTP POST /api/auth/login responded 200 in 45.2ms {}
[14:22:05 WRN] Failed login attempt for john@example.com {}
```

**File output (more detail):**
```
2026-07-21 14:22:01.123 +02:00 [INF] HTTP POST /api/auth/login responded 200 in 45.2ms {"Application":"MyPO.API"}
```

---

## Log Levels

| Level | When it's used |
|---|---|
| `Fatal` | Unhandled exception that terminates the API |
| `Error` | HTTP 5xx responses or unhandled exceptions in controllers |
| `Warning` | HTTP 4xx responses, failed login attempts, registration with existing email |
| `Information` | HTTP 2xx/3xx, successful logins, new registrations, application submissions, admin actions |
| `Debug` / `Verbose` | Not used in production |

---

## What Gets Logged

### HTTP Requests (automatic via Serilog middleware)
Every request is logged with method, path, status code, and duration.

```
HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms
```

Level is determined automatically:
- **Error** — 5xx or exception
- **Warning** — 4xx
- **Information** — 2xx/3xx

### Business Events (manual log statements)

| Event | Level | Location |
|---|---|---|
| New supplier registered | Info | `AuthController.Register` |
| User logged in | Info | `AuthController.Login` |
| Failed login attempt | Warning | `AuthController.Login` |
| Registration with duplicate email | Warning | `AuthController.Register` |
| Password reset requested | Info | `AuthController.ForgotPassword` |
| New application submitted | Info | `ApplicationsController.CreateApplication` |
| Document uploaded | Info | `ApplicationsController.UploadDocument` |
| Application funded / claimed | Info | `ApplicationsController.ClaimApplication` |
| New funder registered | Info | `FundersController` |
| Admin role change | Info | `AdminController.SetUserRole` |
| Admin deleted user | Warning | `AdminController.DeleteUser` |
| Admin deleted application | Warning | `AdminController.DeleteApplication` |
| Admin changed application status | Info | `AdminController.SetApplicationStatus` |
| Admin changed funder active status | Info | `AdminController.SetFunderActive` |
| API startup | Info | `Program.cs` |
| Unhandled fatal exception | Fatal | `Program.cs` |

---

## Minimum Log Levels (by environment)

### Development (`appsettings.json`)
```json
"Serilog": {
  "MinimumLevel": {
    "Default": "Information",
    "Override": {
      "Microsoft": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
      "System": "Warning"
    }
  }
}
```

### Production (recommended in `appsettings.Production.json`)
```json
"Serilog": {
  "MinimumLevel": {
    "Default": "Warning",
    "Override": {
      "Microsoft": "Warning",
      "System": "Warning"
    }
  }
}
```

Raising the default to `Warning` in production reduces noise while still capturing all business-critical events (which are logged at `Information` and above — `Warning`, `Error`, `Fatal`).

---

## Checking Logs

**On the server (Linux):**
```bash
# View today's log
cat /var/www/mypo/publish/logs/mypo-$(date +%Y%m%d).log

# Tail live logs
tail -f /var/www/mypo/publish/logs/mypo-$(date +%Y%m%d).log

# Search for errors
grep "\[ERR\]" /var/www/mypo/publish/logs/mypo-*.log

# Search for a specific user
grep "john@example.com" /var/www/mypo/publish/logs/mypo-*.log
```

**Service logs (systemd):**
```bash
sudo journalctl -u mypo-api -f
sudo journalctl -u mypo-api --since "1 hour ago"
```

---

## Health Check (Recommended Addition)

The current API does not expose a health check endpoint. For production monitoring, consider adding one in `Program.cs`:

```csharp
builder.Services.AddHealthChecks()
    .AddNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")!);

app.MapHealthChecks("/health");
```

This lets your hosting platform, uptime monitor, or load balancer verify the API and database are reachable.
