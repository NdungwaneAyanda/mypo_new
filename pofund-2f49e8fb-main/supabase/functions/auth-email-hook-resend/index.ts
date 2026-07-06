// Production Auth Email Hook — Resend edition
// Deploy this to the PRODUCTION Supabase project (fbvorxcacflvqnxhtybw).
//
// Wire-up in production Supabase dashboard:
//   1. Edge Function Secrets:
//        RESEND_API_KEY           (you already have it)
//        SEND_EMAIL_HOOK_SECRET   (generate any random string, e.g. `openssl rand -base64 32`,
//                                  must start with "v1,whsec_" per Supabase spec — see below)
//   2. Authentication → Hooks → "Send Email Hook":
//        - Enable
//        - URL: https://fbvorxcacflvqnxhtybw.supabase.co/functions/v1/auth-email-hook-resend
//        - Secret: paste the same value used for SEND_EMAIL_HOOK_SECRET
//
// Supabase signs the webhook using Standard Webhooks (svix). We verify it here.

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'

import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const SITE_NAME = 'MyPO'
const FROM_ADDRESS = `MyPO <noreply@mypo.co.za>`
const SITE_URL = 'https://www.mypo.co.za'

const SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited to MyPO",
  magiclink: 'Your MyPO login link',
  recovery: 'Reset your MyPO password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your MyPO verification code',
}

const TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (!hookSecret || !resendKey) {
    console.error('Missing SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY')
    return new Response(JSON.stringify({ error: 'Server not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  // Verify the Supabase Auth webhook signature (Standard Webhooks format).
  // Supabase passes secrets prefixed with "v1,whsec_" — strip if present.
  const secret = hookSecret.replace(/^v1,whsec_/, '')

  let data: any
  try {
    const wh = new Webhook(secret)
    data = wh.verify(payload, headers)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Supabase payload shape:
  // { user: { email, ... }, email_data: { token, token_hash, redirect_to, email_action_type, site_url, ... } }
  const user = data.user ?? {}
  const ed = data.email_data ?? {}
  const actionType: string = ed.email_action_type

  const Template = TEMPLATES[actionType]
  if (!Template) {
    console.error('Unknown email action type:', actionType)
    return new Response(JSON.stringify({ error: `Unknown action type: ${actionType}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build the verification URL Supabase normally embeds.
  // Format: {site_url or supabase_url}/auth/v1/verify?token=...&type=...&redirect_to=...
  const baseVerifyUrl = `${ed.site_url ?? SITE_URL}/auth/v1/verify`
  const confirmationUrl = `${baseVerifyUrl}?token=${ed.token_hash}&type=${actionType}&redirect_to=${encodeURIComponent(ed.redirect_to ?? SITE_URL)}`

  const props = {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: user.email,
    confirmationUrl,
    token: ed.token,
    email: user.email,
    oldEmail: user.email,
    newEmail: ed.new_email ?? user.new_email,
  }

  const html = await renderAsync(React.createElement(Template, props))
  const text = await renderAsync(React.createElement(Template, props), { plainText: true })

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [user.email],
    subject: SUBJECTS[actionType] ?? 'Notification',
    html,
    text,
  })

  if (error) {
    console.error('Resend send failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Sent ${actionType} email to ${user.email}`)
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
