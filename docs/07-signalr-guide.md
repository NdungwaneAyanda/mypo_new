# SignalR Real-time Guide

## Overview

MyPO uses **ASP.NET Core SignalR** to push real-time events to connected clients. Two hubs are available, both requiring authentication.

| Hub | Server URL | Purpose |
|---|---|---|
| `NotificationHub` | `/hubs/notifications` | Notifies funders of new opportunities |
| `ChatHub` | `/hubs/chat` | Real-time messaging on funded applications |

---

## Authentication

Both hubs are decorated with `[Authorize]` and require a valid JWT. Because browser WebSocket connections cannot send custom headers, the token is passed via the `access_token` query parameter:

```
wss://yourdomain.com/hubs/chat?access_token=<jwt_token>
```

The API reads this token in `Program.cs`:

```csharp
OnMessageReceived = context =>
{
    var accessToken = context.Request.Query["access_token"];
    var path = context.HttpContext.Request.Path;
    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
        context.Token = accessToken;
    return Task.CompletedTask;
}
```

---

## NotificationHub — `/hubs/notifications`

### Purpose
Pushes a `NewOpportunity` event to all connected funders whenever a supplier submits a new application.

### Client Methods (called by server → client)

#### `NewOpportunity`

Payload:
```json
{
  "refCode": "APP-00042",
  "companyName": "Acme Ltd",
  "amount": 300000,
  "industry": "Construction"
}
```

Triggered automatically when `POST /api/applications` succeeds.

### Server Methods (called by client → server)

#### `JoinFunderRoom()`
Adds the connected client to the `"funders"` SignalR group so it receives `NewOpportunity` events.

**Call this once on connect** (funder clients only):
```typescript
await connection.invoke('JoinFunderRoom');
```

### Angular Usage Example

```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${environment.hubUrl}/notifications?access_token=${token}`)
  .withAutomaticReconnect()
  .build();

connection.on('NewOpportunity', (data) => {
  console.log('New application:', data.companyName, data.amount);
  // refresh application list or show notification
});

await connection.start();
await connection.invoke('JoinFunderRoom');
```

---

## ChatHub — `/hubs/chat`

### Purpose
Enables real-time messaging between a supplier and their assigned funder on a `successful` application. Both parties join a group named `app-{applicationId}`.

### Client Methods (called by server → client)

#### `ReceiveMessage`

Payload:
```json
{
  "id": "<uuid>",
  "applicationId": "<uuid>",
  "senderId": "<uuid>",
  "senderEmail": "funder@company.com",
  "receiverId": "<uuid>",
  "messageText": "Hello!",
  "isRead": false,
  "createdAt": "2026-07-21T10:00:00Z"
}
```

This event is broadcast to all members of the `app-{applicationId}` group whenever a message is sent (via either the HTTP endpoint or the hub's `SendMessage` method).

### Server Methods (called by client → server)

#### `JoinApplicationRoom(applicationId: string)`
Joins the group for a specific application. Call this when opening a chat view.

```typescript
await connection.invoke('JoinApplicationRoom', applicationId);
```

#### `LeaveApplicationRoom(applicationId: string)`
Leaves the group. Call this when navigating away from the chat view.

```typescript
await connection.invoke('LeaveApplicationRoom', applicationId);
```

#### `SendMessage(applicationId: string, messageText: string)`
Sends a message directly via the hub. The message is saved to the database and broadcast to the group.

```typescript
await connection.invoke('SendMessage', applicationId, 'Hello from the hub!');
```

> Note: The HTTP endpoint `POST /api/applications/{id}/messages` also broadcasts via the hub, so both the REST API and the hub method produce the same `ReceiveMessage` event.

### Angular Usage Example

```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${environment.hubUrl}/chat?access_token=${token}`)
  .withAutomaticReconnect()
  .build();

connection.on('ReceiveMessage', (message) => {
  this.messages.push(message);
});

await connection.start();
await connection.invoke('JoinApplicationRoom', applicationId);

// On component destroy:
await connection.invoke('LeaveApplicationRoom', applicationId);
await connection.stop();
```

---

## Connection Lifecycle

| Event | Recommended Action |
|---|---|
| Connected | Call `JoinFunderRoom()` (funders) or `JoinApplicationRoom(id)` (chat) |
| Disconnected | SignalR's `.withAutomaticReconnect()` handles reconnection |
| Reconnected | Re-join rooms (groups are not persisted across connections) |

---

## Production Considerations

- **Sticky sessions:** If running multiple API instances behind a load balancer, configure **SignalR backplane** (e.g. Redis) so messages route correctly across instances. Single-instance deployments do not need this.
- **WebSocket support:** Ensure your reverse proxy (Nginx/IIS) is configured to upgrade HTTP connections to WebSocket (see Deployment Guide).
- **HTTPS only:** In production, use `wss://` (WebSocket Secure). The Angular production environment file uses relative paths which automatically use the page's protocol.
