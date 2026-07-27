# Step 8 — CI/CD with GitHub Actions

This sets up automatic deployment for both projects using a single workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

- Pushing to `main` triggers a job that checks which folders changed.
- If `MyPO.API/**` changed → **`deploy-api`** builds, publishes, rsyncs to the server, and restarts the `mypo-api` service.
- If `mypo-client/**` changed → **`deploy-web`** builds the Angular app and rsyncs the static files to the server.
- Either job can also be triggered manually (Actions tab → "Deploy" → "Run workflow") with a checkbox to force-deploy.
- Changing only the frontend won't redeploy the API, and vice versa.

Do this once, in order: **(1) create a deploy user on the server → (2) generate an SSH key → (3) authorize it on the server → (4) add GitHub secrets → (5) test the workflow.**

---

## 1. Create a dedicated deploy user on the server

Don't give GitHub Actions your personal login or root. Create a low-privilege user just for deployments.

```bash
sudo adduser --disabled-password --gecos "" deploy
```

### Let it write to the deployed folders

The app files are owned by `www-data` (the service account). Add `deploy` to the `www-data` group and make the folders group-writable, with the setgid bit so new files keep the `www-data` group:

```bash
sudo usermod -aG www-data deploy

sudo chown -R www-data:www-data /var/www/mypo-api /var/www/mypo-web
sudo chmod -R g+rwX /var/www/mypo-api /var/www/mypo-web
sudo find /var/www/mypo-api /var/www/mypo-web -type d -exec chmod g+s {} \;
```

### Keep `appsettings.json` protected

The workflow's rsync explicitly excludes `appsettings.json`, but double-check its permissions so it can't be read/written by the deploy group:

```bash
sudo chown www-data:www-data /var/www/mypo-api/appsettings.json
sudo chmod 640 /var/www/mypo-api/appsettings.json
```

### Allow `deploy` to restart the API service without a password

The workflow needs to run `sudo systemctl restart mypo-api` non-interactively. Grant that one command (and an nginx reload, in case you need it later) via a sudoers drop-in — nothing broader:

```bash
sudo visudo -f /etc/sudoers.d/deploy-mypo
```

Add exactly this line, then save:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart mypo-api, /usr/bin/systemctl reload nginx
```

```bash
sudo chmod 440 /etc/sudoers.d/deploy-mypo
sudo visudo -cf /etc/sudoers.d/deploy-mypo   # validates syntax, should print "parsed OK"
```

---

## 2. Generate an SSH key pair for GitHub Actions

Do this **on your own machine** (not the server) so the private key never touches the server's disk.

```bash
ssh-keygen -t ed25519 -C "github-actions-mypo-deploy" -f ~/.ssh/mypo_deploy_key -N ""
```

This creates two files:

- `~/.ssh/mypo_deploy_key` — the **private** key. This goes into a GitHub secret and nowhere else. Never commit it.
- `~/.ssh/mypo_deploy_key.pub` — the **public** key. This goes on the server.

> `-N ""` sets an empty passphrase, which is required because GitHub Actions can't type a passphrase when connecting non-interactively.

---

## 3. Authorize the public key on the server

From your machine, copy the public key to the `deploy` user:

```bash
ssh-copy-id -i ~/.ssh/mypo_deploy_key.pub deploy@YOUR_SERVER_IP
```

If `ssh-copy-id` isn't available (e.g. Windows), do it manually:

```bash
# Print the public key, copy the output
cat ~/.ssh/mypo_deploy_key.pub
```

Then on the server:

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy nano /home/deploy/.ssh/authorized_keys
# paste the public key line, save

sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

Test it from your machine before wiring up GitHub:

```bash
ssh -i ~/.ssh/mypo_deploy_key deploy@YOUR_SERVER_IP "whoami && sudo systemctl restart mypo-api && echo OK"
```

You should see `deploy` and `OK` with no password prompt. If you're prompted for a password, the key isn't authorized correctly — recheck step 3.

---

## 4. Add the GitHub Actions secrets

In your repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
| --- | --- |
| `SSH_HOST` | Your server's IP or hostname (e.g. `102.37.210.80`) |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Full contents of `~/.ssh/mypo_deploy_key`, including the `-----BEGIN OPENSSH PRIVATE KEY-----` / `-----END...-----` lines |
| `SSH_PORT` | Only add this if SSH runs on a non-default port. If omitted, the workflow defaults to `22`. |

To get the private key contents to paste in:

```bash
cat ~/.ssh/mypo_deploy_key
```

Copy the **entire** output (all lines) into the `SSH_PRIVATE_KEY` secret value box.

> Secrets are encrypted at rest and are never shown again after saving — if you need to change one later, you just overwrite it with a new value, you can't view the old one.

---

## 5. Commit and push the workflow

The workflow file is already created at `.github/workflows/deploy.yml`. Commit it along with this guide:

```bash
git add .github/workflows/deploy.yml CICD.md DEPLOYMENT.md
git commit -m "Add GitHub Actions CI/CD for API and frontend deployment"
git push
```

Since this push touches both `MyPO.API/` history context and `mypo-client/`... actually it only touches root-level files, so neither `deploy-api` nor `deploy-web` will trigger automatically (by design — no app code changed). To do a first test run:

1. Go to **Actions** tab → **Deploy** workflow → **Run workflow**.
2. Check **"Force-deploy the API"** and/or **"Force-deploy the frontend"**.
3. Click **Run workflow** and watch the logs.

After that, normal pushes that touch `MyPO.API/**` or `mypo-client/**` will deploy automatically.

---

## How the workflow decides what to deploy

```yaml
filters: |
  api:
    - 'MyPO.API/**'
  web:
    - 'mypo-client/**'
```

This uses [`dorny/paths-filter`](https://github.com/dorny/paths-filter) to compare the pushed commits against changed paths, and exposes `api`/`web` booleans that gate the `deploy-api` / `deploy-web` jobs. Editing only `mypo-client/src/...` will run `deploy-web` only; editing only `MyPO.API/Program.cs` will run `deploy-api` only; editing both runs both jobs in parallel.

---

## Troubleshooting

**Workflow fails at "Trust host key" / `ssh-keyscan` (exit code 1, no useful detail):**

This step now prints the underlying `ssh-keyscan` error and fails fast after 10s instead of hanging — re-run the job and check the new log output. The two most common causes:

1. **Wrong `SSH_HOST` / `SSH_PORT` secret** — no protocol prefix (`https://`), no trailing slash, no quotes. Just the bare IP or hostname, e.g. `20.164.22.95`.
2. **Firewall / NSG blocking GitHub-hosted runners.** GitHub-hosted runners connect from constantly-changing IP ranges (published at [`api.github.com/meta`](https://api.github.com/meta)), not a fixed IP. If your server is on **Azure** (VM name like `...ASPNETVM` is a giveaway) and you've locked SSH down to specific source IPs in the VM's **Network Security Group (NSG)**, GitHub Actions will be blocked before it ever reaches `sshd` — `ssh-keyscan` will time out with no response.

   Check in the Azure Portal: **VM → Networking → Network settings → NSG inbound rules** (or the NSG resource directly) for a rule on port 22 (or your custom SSH port). If the **Source** is restricted to a specific IP/range instead of `Any`/`Internet`, that's the blocker.

   Options, in order of preference:
   - **Self-hosted runner** on the same server/network — avoids exposing SSH to the internet at all. (More setup, most secure.)
   - **Allow GitHub's published IP ranges** in the NSG rule (fetch the `actions` block from `https://api.github.com/meta`) — these change periodically, so this needs occasional maintenance.
   - **Temporarily open the NSG rule to `Any`** for SSH while relying on key-only auth (no password auth) plus fail2ban — simplest, slightly less defense-in-depth since it's public exposure (mitigated by disabling password auth entirely).

   Also double check `ufw` on the VM itself isn't separately restricting by source IP (`sudo ufw status verbose`) — Azure NSG and `ufw` are independent layers and both need to allow the connection.

**`Permission denied (publickey)`:**
- Confirm the public key is in `/home/deploy/.ssh/authorized_keys` on the server.
- Confirm `SSH_PRIVATE_KEY` secret contains the *entire* private key file, unmodified (no extra indentation/trailing characters — paste it exactly as printed by `cat`).
- Confirm `SSH_USER` matches the user you authorized (`deploy`).

**`sudo: a password is required` when restarting the service:**
Re-check `/etc/sudoers.d/deploy-mypo` — the command path must match exactly what `systemctl` resolves to. Confirm with:
```bash
which systemctl
```
and make sure the sudoers line uses that exact path.

**Rsync fails with "Permission denied" writing to `/var/www/mypo-api`:**
Re-run the `chown`/`chmod`/`find ... chmod g+s` commands from Step 1, and confirm `deploy` is in the `www-data` group:
```bash
groups deploy
```
(log out/in or re-`ssh` after `usermod -aG` — group membership only applies to new sessions).

**Frontend deploys but shows stale content:**
Browsers/CDNs may cache aggressively. Hard-refresh, and if you're using Cloudflare, purge cache or check the caching level for `mypo.co.za`.

---

## Optional hardening (not required to get started)

- **Restrict the deploy key to specific commands** using a `command=` prefix in `authorized_keys`, so it can only run rsync/restart, not an arbitrary shell.
- **Use a GitHub Environment** (`Settings → Environments`) named `production` with required reviewers, so deployments need manual approval before running.
- **Pin action versions to commit SHAs** instead of tags (`actions/checkout@<sha>`) for supply-chain hardening.
- **Store `known_hosts` as a secret** (output of `ssh-keyscan` run once, verified out-of-band) instead of trusting it at runtime, to fully eliminate first-connection MITM risk.
