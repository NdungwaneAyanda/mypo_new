# Deployment Guide

## Prerequisites

Ensure the following are installed on the production server:

| Requirement | Version |
|---|---|
| .NET SDK / Runtime | 8.0 |
| Node.js | 18+ |
| Angular CLI | 17+ (`npm install -g @angular/cli`) |
| PostgreSQL | 15+ |
| (Optional) Nginx or IIS | Latest stable |

---

## Step 1 — Prepare the Production Database

On the PostgreSQL server, create the database and a dedicated user:

```sql
CREATE DATABASE mypo_db;
CREATE USER mypo_user WITH PASSWORD 'your_strong_db_password';
GRANT ALL PRIVILEGES ON DATABASE mypo_db TO mypo_user;
```

Note the connection string — you will need it in Step 3.

---

## Step 2 — Build the Angular Client

Run these commands from the `mypo-client` folder:

```bash
npm install
npm run build --configuration=production
```

The compiled output will be in `mypo-client/dist/mypo-client/browser/`.

---

## Step 3 — Configure the API for Production

Create the file `MyPO.API/appsettings.Production.json` (never commit this file):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=<db_host>;Port=5432;Username=mypo_user;Password=<db_password>;Database=mypo_db"
  },
  "Jwt": {
    "Key": "<64+ character random string>",
    "Issuer": "MyPO.API",
    "Audience": "MyPO.Client"
  },
  "Resend": {
    "ApiKey": "<your_production_resend_api_key>",
    "FromEmail": "noreply@yourdomain.com"
  },
  "Admin": {
    "Email": "admin@yourdomain.com",
    "Password": "<strong_admin_password>"
  },
  "FrontendUrl": "https://yourdomain.com",
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  }
}
```

Set the environment variable so .NET picks up the production config:

```bash
export ASPNETCORE_ENVIRONMENT=Production
```

Or on Windows (IIS / service):
```
ASPNETCORE_ENVIRONMENT = Production
```

---

## Step 4 — Copy Angular Build into the API

The recommended production setup is to have the .NET API serve the Angular static files directly.

Copy the Angular build output into `MyPO.API/wwwroot/`:

```bash
cp -r mypo-client/dist/mypo-client/browser/* MyPO.API/wwwroot/
```

Or on Windows:
```powershell
Copy-Item -Recurse "mypo-client\dist\mypo-client\browser\*" "MyPO.API\wwwroot\"
```

> If `wwwroot/` does not exist, create it first.

---

## Step 5 — Publish the .NET API

From the `MyPO.API` folder:

```bash
dotnet publish -c Release -o ./publish
```

This creates a `publish/` folder with all the binaries.

---

## Step 6 — Run the API

**Option A — Run directly (for quick testing):**

```bash
cd MyPO.API/publish
ASPNETCORE_ENVIRONMENT=Production dotnet MyPO.API.dll
```

**Option B — Run as a systemd service (Linux):**

Create `/etc/systemd/system/mypo-api.service`:

```ini
[Unit]
Description=MyPO API
After=network.target

[Service]
WorkingDirectory=/var/www/mypo/publish
ExecStart=/usr/bin/dotnet /var/www/mypo/publish/MyPO.API.dll
Restart=always
RestartSec=10
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mypo-api
sudo systemctl start mypo-api
sudo systemctl status mypo-api
```

---

## Step 7 — Configure Nginx (Recommended)

Install Nginx, then create `/etc/nginx/sites-available/mypo`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Proxy API and SignalR to Kestrel
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /hubs/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }

    # Serve Angular static files (if not using wwwroot approach)
    location / {
        root   /var/www/mypo/wwwroot;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mypo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8 — Verify the Deployment

Run through this checklist after deploying:

- [ ] `https://yourdomain.com` loads the Angular app
- [ ] `https://yourdomain.com/api/auth/login` returns `401` (not a 404 or 502)
- [ ] Register a new user and log in successfully
- [ ] Submit a test application and confirm email is received
- [ ] Check logs: `MyPO.API/publish/logs/mypo-<date>.log`
- [ ] Admin login works at `/admin`

---

## Updating the Application

```bash
# 1. Pull latest code
git pull

# 2. Rebuild Angular
cd mypo-client
npm install
npm run build --configuration=production
cp -r dist/mypo-client/browser/* ../MyPO.API/wwwroot/

# 3. Republish API
cd ../MyPO.API
dotnet publish -c Release -o ./publish

# 4. Restart the service
sudo systemctl restart mypo-api
```
