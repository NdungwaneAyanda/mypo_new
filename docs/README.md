# MyPO Documentation

Production documentation for the MyPO PO Funding Platform.

---

## Documents

### High Priority (required before go-live)

| # | Document | Description |
|---|---|---|
| 1 | [Architecture Overview](./01-architecture-overview.md) | System diagram, tech stack, middleware pipeline, roles |
| 2 | [API Reference](./02-api-reference.md) | All endpoints — request/response shapes, auth requirements |
| 3 | [Database Schema](./03-database-schema.md) | All tables, columns, relationships, status flows |
| 4 | [Authentication & Authorization](./04-auth-guide.md) | JWT flow, roles, password reset, Angular guards |
| 5 | [Deployment Guide](./05-deployment-guide.md) | Step-by-step build, publish, and server setup |
| 6 | [Environment Configuration](./06-environment-config.md) | All config keys for API and Angular |

### Medium Priority

| # | Document | Description |
|---|---|---|
| 7 | [SignalR Real-time Guide](./07-signalr-guide.md) | Hub methods, connection lifecycle, Angular examples |
| 8 | [File Upload Handling](./08-file-upload-guide.md) | Constraints, storage path, production considerations |
| 9 | [Frontend Module Guide](./09-frontend-module-guide.md) | Routes, feature modules, Angular environment files |
| 10 | [Monitoring & Logging](./10-monitoring-logging.md) | Log files, levels, what gets logged, health checks |
| 11 | [Admin Guide](./11-admin-guide.md) | Admin panel — users, applications, funder management |

### Low Priority

| # | Document | Description |
|---|---|---|
| 12 | [End-User Guide](./12-end-user-guide.md) | How suppliers and funders use the platform |

---

## Project Structure

```
MyPO Project/
├── mypo-client/          Angular 17 frontend
├── MyPO.API/             .NET 8 REST API + SignalR
├── pofund-2f49e8fb-main/ Reference project
├── docs/                 This documentation
└── MyPO.code-workspace   Open this file in Cursor / VS Code
```
