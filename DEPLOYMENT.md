# MyPO Deployment Guide

Deploying MyPO to a single Linux server (Ubuntu/Debian):


| Component   | Project                    | Domain                   | Served by                          |
| ----------- | -------------------------- | ------------------------ | ---------------------------------- |
| Frontend    | `mypo-client` (Angular 21) | `https://mypo.co.za`     | Nginx (static files)               |
| Backend API | `MyPO.API` (.NET 8)        | `https://api.mypo.co.za` | Kestrel behind Nginx reverse proxy |
| Database    | PostgreSQL 16              | localhost only           | PostgreSQL on the same server      |


The frontend talks to the backend over the public `https://api.mypo.co.za` domain (configured in `mypo-client/src/environments/environment.prod.ts`).

---

## 0. Prerequisites

- A Linux server (Ubuntu 22.04/24.04 assumed below) with root / sudo access.
- DNS **A records** pointing to your server's public IP:
  - `mypo.co.za`  →  server IP
  - `www.mypo.co.za`  →  server IP
  - `api.mypo.co.za`  →  server IP
- Ports **80** and **443** open in your firewall / security group.

> Verify DNS before requesting SSL certificates:
>
> ```bash
> dig +short mypo.co.za
> dig +short api.mypo.co.za
> ```

---



## 1. Install server software

```bash
sudo apt update && sudo apt upgrade -y

# Nginx + certbot (SSL)
sudo apt install -y nginx certbot python3-certbot-nginx git ufw

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# .NET 8 runtime (ASP.NET Core) — enough to RUN a published build
sudo apt install -y dotnet-runtime-8.0 aspnetcore-runtime-8.0
# If those packages aren't found, add the Microsoft feed first:
#   wget https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
#   sudo dpkg -i packages-microsoft-prod.deb && sudo apt update
#   sudo apt install -y aspnetcore-runtime-8.0

# Node.js 20 LTS (needed only if you build the frontend ON the server)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Basic firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---



## 2. Set up the PostgreSQL database (local)

The API uses PostgreSQL via EF Core (Npgsql) and **auto-runs migrations on startup** (`db.Database.Migrate()` in `Program.cs`), so you only need to create the database and a user.

```bash
sudo -u postgres psql
```

Inside `psql` (replace the password with a strong one):

```sql
CREATE DATABASE mypo_db;
CREATE USER mypo_user WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE mypo_db TO mypo_user;

-- PostgreSQL 15+: also grant schema rights
\c mypo_db
GRANT ALL ON SCHEMA public TO mypo_user;
ALTER DATABASE mypo_db OWNER TO mypo_user;
\q
```

The DB listens on `localhost:5432` by default (not exposed publicly) — that's exactly what we want.

The resulting connection string is:

```
Host=localhost;Port=5432;Username=mypo_user;Password=CHANGE_ME_STRONG_PASSWORD;Database=mypo_db
```



### Running migrations

- **Automatic (default):** migrations apply automatically the first time the API starts (Section 3). Nothing else needed.
- **Manual (optional):** if you'd rather apply them explicitly, install the EF tool and run from the project on a machine with the SDK:
  ```bash
  dotnet tool install --global dotnet-ef
  dotnet ef database update --project MyPO.API/MyPO.API.csproj
  ```

---



## 3. Deploy the backend API (`api.mypo.co.za`)



### 3.1 Publish

You can publish on your dev machine and copy the output, or clone + publish on the server (requires the .NET **SDK**, not just runtime).

**Option A — publish locally, then copy to server:**

```bash
# On your dev machine, from the repo root:
dotnet publish MyPO.API/MyPO.API.csproj -c Release -o ./publish

# Copy to the server:
scp -r ./publish youruser@YOUR_SERVER_IP:/tmp/mypo-api
```

Then on the server:

```bash
sudo mkdir -p /var/www/mypo-api
sudo cp -r /tmp/mypo-api/* /var/www/mypo-api/
```

~~**Option~~ B — build on the server** (install `dotnet-sdk-8.0` instead of just the runtime):

```bash
sudo mkdir -p /srv/mypo && cd /srv/mypo
git clone <YOUR_REPO_URL> mypo_new
cd mypo_new
dotnet publish MyPO.API/MyPO.API.csproj -c Release -o /var/www/mypo-api
```



### 3.2 Create the production config

`appsettings.json` is **git-ignored** (it holds secrets), so it will NOT be in your publish output if you excluded it. Create it directly on the server, based on `MyPO.API/appsettings.example.json`:

```bash
sudo nano /var/www/mypo-api/appsettings.json
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Username=mypo_user;Password=CHANGE_ME_STRONG_PASSWORD;Database=mypo_db"
  },
  "Jwt": {
    "Key": "REPLACE_WITH_A_64+_CHAR_RANDOM_SECRET",
    "Issuer": "MyPO.API",
    "Audience": "MyPO.Client"
  },
  "Resend": {
    "ApiKey": "REPLACE_WITH_RESEND_API_KEY",
    "FromEmail": "noreply@mypo.co.za"
  },
  "Admin": {
    "Email": "admin@mypo.co.za",
    "Password": "REPLACE_WITH_STRONG_ADMIN_PASSWORD"
  },
  "FrontendUrl": "https://mypo.co.za",
  "DataProtection": {
    "KeysDirectory": "/var/www/mypo-api/keys"
  },
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
  },
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
  "AllowedHosts": "*"
}
```

> Generate a strong JWT key: `openssl rand -base64 64`



### 3.3 Run as a systemd service

Create the service file:

```bash
sudo nano /etc/systemd/system/mypo-api.service
```

```ini
[Unit]
Description=MyPO API (.NET 8)
After=network.target postgresql.service

[Service]
WorkingDirectory=/var/www/mypo-api
ExecStart=/usr/bin/dotnet /var/www/mypo-api/MyPO.API.dll
Restart=always
RestartSec=5
KillSignal=SIGINT
SyslogIdentifier=mypo-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5080
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
# Persist Data Protection keys (avoids "ephemeral key repository" warnings on restart)
Environment=DataProtection__KeysDirectory=/var/www/mypo-api/keys

[Install]
WantedBy=multi-user.target
```

Kestrel binds to `127.0.0.1:5080` (localhost only); Nginx will expose it publicly over HTTPS.

> The `DataProtection__KeysDirectory` env var (double underscore = nested config) makes ASP.NET Core persist its encryption keys to disk instead of regenerating them on every restart. You can also set this via the `DataProtection:KeysDirectory` key in `appsettings.json`.

```bash
# Create the keys + wwwroot directories, then hand ownership to the service account
sudo mkdir -p /var/www/mypo-api/keys /var/www/mypo-api/wwwroot
sudo chown -R www-data:www-data /var/www/mypo-api
sudo systemctl daemon-reload
sudo systemctl enable --now mypo-api
sudo systemctl status mypo-api          # should be "active (running)"
sudo journalctl -u mypo-api -f          # live logs (watch migrations + admin seed)
```



### 3.4 Nginx reverse proxy for the API

```bash
sudo nano /etc/nginx/sites-available/api.mypo.co.za
```

```nginx
server {
    listen 80;
    server_name api.mypo.co.za;

    client_max_body_size 25M;

    location / {
        proxy_pass         http://127.0.0.1:5080;
        proxy_http_version 1.1;

        # Required for SignalR (/hubs/chat, /hubs/notifications) websockets
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        $connection_upgrade;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SignalR long-polling / websocket timeouts
        proxy_read_timeout 100s;
    }
}
```

Add the websocket upgrade map (once) in the http block:

```bash
sudo nano /etc/nginx/conf.d/websocket.conf
```

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/api.mypo.co.za /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---



## 4. Deploy the frontend (`mypo.co.za`)



### 4.1 Build

The production build swaps in `environment.prod.ts` (already wired via `fileReplacements` in `angular.json`), so the app will call `https://api.mypo.co.za`.

```bash
cd mypo-client
npm ci        # or: npm install
npm run build
```

Output lands in `mypo-client/dist/mypo-client/browser/`.

### 4.2 Copy files to the server

```bash
# From your dev machine (adjust the path if building on the server):
scp -r dist/mypo-client/browser/* youruser@YOUR_SERVER_IP:/tmp/mypo-web/

# On the server:
sudo mkdir -p /var/www/mypo-web
sudo cp -r /tmp/mypo-web/* /var/www/mypo-web/
sudo chown -R www-data:www-data /var/www/mypo-web
```



### 4.3 Nginx config for the frontend

```bash
sudo nano /etc/nginx/sites-available/mypo.co.za
```

```nginx
server {
    listen 80;
    server_name mypo.co.za www.mypo.co.za;

    root /var/www/mypo-web;
    index index.html;

    # Angular is a single-page app: route everything to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed static assets aggressively
    location ~* \.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/mypo.co.za /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---



## 5. Enable HTTPS (Let's Encrypt)

Certbot will fetch certificates and rewrite the Nginx configs to serve HTTPS + redirect HTTP→HTTPS.

```bash
sudo certbot --nginx \
  -d mypo.co.za -d www.mypo.co.za \
  -d api.mypo.co.za \
  --redirect --agree-tos -m you@example.com --no-eff-email
```

Auto-renewal is installed by default; test it with:

```bash
sudo certbot renew --dry-run
```

After this:

- `https://mypo.co.za` serves the Angular app.
- `https://api.mypo.co.za` serves the API.

---



## 6. Verify the deployment

```bash
# API reachable over HTTPS
curl -i https://api.mypo.co.za/api/auth        # expect a JSON/401/405 response, not a connection error

# Frontend loads
curl -I https://mypo.co.za                      # expect HTTP/2 200

# Service + DB health
sudo systemctl status mypo-api
sudo -u postgres psql -d mypo_db -c "\dt"       # tables created by migrations
```

Then open `https://mypo.co.za` in a browser, open DevTools → Network, and confirm requests go to `https://api.mypo.co.za/api/...` with no CORS errors. Log in with the admin credentials from your server `appsettings.json`.

---



## 7. Updating later (manual redeploy)

**Backend:**

```bash
dotnet publish MyPO.API/MyPO.API.csproj -c Release -o ./publish
scp -r ./publish/* youruser@SERVER:/tmp/mypo-api/
# on server (keep appsettings.json!):
sudo rsync -a --exclude appsettings.json /tmp/mypo-api/ /var/www/mypo-api/
sudo systemctl restart mypo-api
```

**Frontend:**

```bash
cd mypo-client && npm run build
scp -r dist/mypo-client/browser/* youruser@SERVER:/tmp/mypo-web/
# on server:
sudo rsync -a --delete /tmp/mypo-web/ /var/www/mypo-web/
```

---



## 8. CI/CD with GitHub Actions

Manual deployment now works end-to-end, so it's automated via a single workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) with two independent jobs, each triggered only when its folder changes:

- `deploy-api` — builds `MyPO.API`, publishes, rsync/ssh-deploys to `/var/www/mypo-api`, then restarts the `mypo-api` service.
- `deploy-web` — builds `mypo-client`, then rsync-deploys `dist/` to `/var/www/mypo-web`.

Full setup instructions — creating the deploy user, generating and installing the SSH key, and adding the GitHub secrets — are in **[CICD.md](CICD.md)**.

---



## Summary of code changes already made for deployment


| File                                               | Change                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `mypo-client/src/environments/environment.prod.ts` | API/hub URLs now point to `https://api.mypo.co.za`                      |
| `mypo-client/angular.json`                         | Added `fileReplacements` so production builds use `environment.prod.ts` |
| `MyPO.API/Program.cs`                              | CORS now allows `https://mypo.co.za` + `https://www.mypo.co.za`         |
| `MyPO.API/appsettings.json`                        | `FrontendUrl` set to `https://mypo.co.za` (file is now git-ignored)     |
| `.gitignore` (new, repo root)                      | Ignores `appsettings.json`, `bin/`, `obj/`, logs                        |
| `MyPO.API/appsettings.example.json` (new)          | Committed template with placeholder secrets                             |
| `.github/workflows/deploy.yml` (new)               | GitHub Actions CI/CD — see [CICD.md](CICD.md)                           |


