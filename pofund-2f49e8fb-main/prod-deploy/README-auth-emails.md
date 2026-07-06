# Branded Auth Emails on Production (fbvorxcacflvqnxhtybw)

The funder/supplier notification emails on prod already use Resend via
`send-transactional-email`. Auth emails (signup, password reset, etc.) on
prod were still using default Supabase. This deploys a Resend-based
`auth-email-hook-resend` function so password resets, signups, etc. come
out branded as **MyPO**.

## What you deploy

Two paths in `supabase/functions/` need to land in your prod project:

- `supabase/functions/_shared/email-templates/` (React Email templates — likely already there for transactional emails)
- `supabase/functions/auth-email-hook-resend/` (new function)

## Steps

### 1. Set secrets on prod Supabase
In **Edge Function Secrets** add:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | (already configured) |
| `SEND_EMAIL_HOOK_SECRET` | any random string, e.g. `openssl rand -base64 32` |

### 2. Deploy the function from your local machine
```bash
supabase link --project-ref fbvorxcacflvqnxhtybw
supabase functions deploy auth-email-hook-resend --no-verify-jwt
```
(`--no-verify-jwt` is required — Supabase Auth calls this hook without a user JWT; the request is authenticated via the webhook signature instead.)

### 3. Enable the hook in prod Supabase dashboard
**Authentication → Hooks → Send Email Hook**
- Enable it
- Type: **HTTPS**
- URL: `https://fbvorxcacflvqnxhtybw.supabase.co/functions/v1/auth-email-hook-resend`
- Secret: paste the **same** value you set for `SEND_EMAIL_HOOK_SECRET`

### 4. Test
On `mypo.co.za`, click "Forgot password" → check inbox. You should receive the branded MyPO reset email instead of the default Supabase one.

## What this covers
All Supabase Auth emails are routed through this hook:
- Signup confirmation
- Password recovery
- Magic link
- Invite
- Email change
- Reauthentication (OTP)

## Funder notification emails
Already work on prod (uses Resend via `send-transactional-email`). No changes needed there.
