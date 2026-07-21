# Environment Configuration

This document lists every configuration key the application reads. In production, all sensitive values must be set in `appsettings.Production.json` (never committed to source control) or via environment variables.

---

## .NET API — `appsettings.json` Keys

### Connection String

| Key | Description | Development default |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string | `Host=localhost;Port=5432;Username=postgres;Password=940301;Database=mypo_db` |

**Production template:**
```
Host=<host>;Port=5432;Username=<user>;Password=<password>;Database=mypo_db
```

---

### JWT

| Key | Description | Development default |
|---|---|---|
| `Jwt:Key` | HS512 signing key — must be 64+ characters | `MyPO-SuperSecret-Key-...` |
| `Jwt:Issuer` | Token issuer claim | `MyPO.API` |
| `Jwt:Audience` | Token audience claim | `MyPO.Client` |

**Production requirement:** Replace `Jwt:Key` with a cryptographically random 64+ character string. Generate one with:
```bash
openssl rand -base64 64
```

---

### Email (Resend)

| Key | Description | Development default |
|---|---|---|
| `Resend:ApiKey` | Resend API key | *(dev key — do not use in prod)* |
| `Resend:FromEmail` | Sender address for all outgoing emails | `noreply@mypo.co.za` |

Sign up at [resend.com](https://resend.com) and generate a production API key. Verify your sending domain in the Resend dashboard.

---

### Admin Account

| Key | Description | Development default |
|---|---|---|
| `Admin:Email` | Admin login email | `admin@mypo.co.za` |
| `Admin:Password` | Admin login password | `Admin@MyPO2026!` |

These values are synced to the database on every startup. Changing them in `appsettings.Production.json` and restarting the API will update the admin credentials automatically.

---

### Frontend URL

| Key | Description | Development default |
|---|---|---|
| `FrontendUrl` | Used to build password reset links in emails | `http://localhost:4200` |

**Production value:** `https://yourdomain.com`

---

### Serilog (Logging)

| Key | Description |
|---|---|
| `Serilog:MinimumLevel:Default` | Minimum log level (`Information` in dev, `Warning` in prod recommended) |
| `Serilog:MinimumLevel:Override:Microsoft` | Suppress verbose framework logs |

Log files are written to `MyPO.API/logs/mypo-<date>.log`. Up to 30 daily log files are retained.

---

## Full `appsettings.Production.json` Template

Create this file at `MyPO.API/appsettings.Production.json`. **Do not commit it to git.**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=<db_host>;Port=5432;Username=<db_user>;Password=<db_password>;Database=mypo_db"
  },
  "Jwt": {
    "Key": "<64+ char random string>",
    "Issuer": "MyPO.API",
    "Audience": "MyPO.Client"
  },
  "Resend": {
    "ApiKey": "<production_resend_api_key>",
    "FromEmail": "noreply@yourdomain.com"
  },
  "Admin": {
    "Email": "admin@yourdomain.com",
    "Password": "<strong_unique_password>"
  },
  "FrontendUrl": "https://yourdomain.com",
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
        "System": "Warning"
      }
    }
  },
  "AllowedHosts": "yourdomain.com"
}
```

---

## Angular Client — Environment Files

### Development: `mypo-client/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5076/api',
  hubUrl: 'http://localhost:5076/hubs'
};
```

### Production: `mypo-client/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  hubUrl: '/hubs'
};
```

The production file uses **relative paths** (`/api`, `/hubs`) which means the Angular app and the API must be served from the same origin. This is the recommended setup — no CORS configuration needed in production.

If you serve the Angular app on a different domain, update these to absolute URLs:
```typescript
apiUrl: 'https://api.yourdomain.com/api',
hubUrl:  'https://api.yourdomain.com/hubs'
```

And add that domain to the `FrontendUrl` setting in `appsettings.Production.json`.

---

## Environment Variable Alternative

Instead of `appsettings.Production.json`, you can set config values as environment variables using the ASP.NET Core double-underscore separator:

```bash
export ConnectionStrings__DefaultConnection="Host=..."
export Jwt__Key="..."
export Resend__ApiKey="..."
export Admin__Email="admin@yourdomain.com"
export Admin__Password="..."
export FrontendUrl="https://yourdomain.com"
export ASPNETCORE_ENVIRONMENT="Production"
```

This is the preferred approach for containerized or cloud deployments (Docker, Azure App Service, etc.).

---

## `.gitignore` — Files That Must Not Be Committed

Ensure these lines are present in `.gitignore` at the project root:

```
**/appsettings.Production.json
**/appsettings.*.json
!**/appsettings.json
!**/appsettings.Development.json
**/uploads/
```
