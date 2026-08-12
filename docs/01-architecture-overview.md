# Architecture Overview

## System Summary

MyPO is a Purchase Order (PO) funding platform that connects suppliers seeking finance with registered funders. Suppliers submit funding applications, funders browse and claim them, and both parties communicate in real time once a deal is made.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Angular | 17+ |
| Backend API | ASP.NET Core | .NET 8 |
| Database | PostgreSQL | 15+ |
| Real-time | ASP.NET Core SignalR | 1.1 |
| ORM | Entity Framework Core + Npgsql | 8.0 |
| Authentication | JWT Bearer Tokens | — |
| Logging | Serilog | 10.0 |
| Email | Resend API | — |
| Password Hashing | BCrypt.Net-Next | 4.0.3 |

---

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│           Angular Client (SPA)          │
│  Port 4200 (dev) / served via API (prod)│
│                                         │
│  Features: auth · dashboard · apply     │
│            funder · admin · static      │
└──────────────┬──────────────────────────┘
               │ HTTP/REST  +  WebSocket (SignalR)
               ▼
┌─────────────────────────────────────────┐
│         MyPO.API  (.NET 8)              │
│  Port 5076 (dev) / 443 (prod)           │
│                                         │
│  Controllers  ──►  Services             │
│  Middleware   ──►  EF Core              │
│  SignalR Hubs ──►  PostgreSQL           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database  (mypo_db)         │
│  Tables: users · profiles · user_roles  │
│    funding_applications                 │
│    application_documents                │
│    application_messages                 │
│    registered_funders                   │
└─────────────────────────────────────────┘
```

---

## Request Pipeline (API)

Every HTTP request flows through the following middleware in order:

1. **Static Files** — serves uploaded documents from the `uploads/` folder
2. **Serilog Request Logging** — logs method, path, status code, and duration
3. **CORS** — allows requests from the configured `FrontendUrl`
4. **Authentication** — validates JWT bearer token
5. **Authorization** — enforces `[Authorize]` and role policies
6. **Controllers** — handles business logic and returns responses

---

## User Roles

| Role | Description |
|---|---|
| `supplier` | Default role on registration. Can submit applications, upload documents, and chat with their assigned funder. |
| `funder` | Registered funding company. Can browse all pending applications, claim them, and chat with suppliers. |
| `admin` | Full platform access. Manages users, applications, and funders. Seeded from `appsettings.json`. |

---

## Real-time Features

Two SignalR hubs are mounted at startup:

| Hub | URL | Purpose |
|---|---|---|
| `NotificationHub` | `/hubs/notifications` | Pushes `NewOpportunity` events to all connected funders when a new application is submitted. |
| `ChatHub` | `/hubs/chat` | Enables real-time messaging between a supplier and their assigned funder on a funded application. |

Both hubs require a valid JWT. The token is passed via the `access_token` query parameter (standard SignalR approach).

---

## File Storage

Uploaded documents are stored on the server's local disk under:

```
MyPO.API/
└── uploads/
    └── applications/
        └── {applicationId}/
            └── {documentType}/
                └── {uuid}.pdf
```

Files are served as static files via `app.UseStaticFiles()`. A `/uploads/` prefix is not exposed publicly — downloads go through the authenticated `GET /api/applications/{id}/documents/{docId}/download` endpoint.

---

## Production Deployment Model

In production, the Angular client is built into static files and served by the .NET API (or a reverse proxy like Nginx). The production `environment.prod.ts` uses relative paths (`/api`, `/hubs`), meaning the frontend and API share the same origin, which eliminates CORS complexity.

```
Internet
   │
   ▼
Nginx / IIS (HTTPS :443)
   │
   ├── /api/*  ──────────────► MyPO.API (Kestrel :5000)
   ├── /hubs/* ──────────────► MyPO.API (Kestrel :5000)
   └── /*      ──────────────► Angular static files (or proxied)
```

---

## Key Configuration Files

| File | Purpose |
|---|---|
| `MyPO.API/appsettings.json` | Default config — connection string, JWT, email, admin credentials |
| `MyPO.API/appsettings.Production.json` | Production overrides (must be created — see Environment Config doc) |
| `mypo-client/src/environments/environment.prod.ts` | Angular production API URLs |
| `MyPO.code-workspace` | VS Code / Cursor multi-root workspace entry point |
