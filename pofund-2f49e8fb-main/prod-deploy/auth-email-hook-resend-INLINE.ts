// ============================================================================
// SINGLE-FILE auth-email-hook-resend for PROD (fbvorxcacflvqnxhtybw)
// ============================================================================
// Paste this ENTIRE file into:
//   Supabase Dashboard → project fbvorxcacflvqnxhtybw → Edge Functions
//   → "Deploy a new function" → name: auth-email-hook-resend
//   → Verify JWT: OFF
//   → Paste contents → Deploy
//
// Required Edge Function Secrets (already set on prod):
//   RESEND_API_KEY
//   SEND_EMAIL_HOOK_SECRET = v1,whsec_IilFc0gxeunmDQ5Dbm1fBM98yoLfxnmHgZhdsjGl
//
// Auth → Hooks → Send Email Hook:
//   URL: https://fbvorxcacflvqnxhtybw.supabase.co/functions/v1/auth-email-hook-resend
//   Secret: v1,whsec_IilFc0gxeunmDQ5Dbm1fBM98yoLfxnmHgZhdsjGl
// ============================================================================

/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link,
  Preview, Section, Text, renderAsync,
} from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND = {
  name: 'MyPO',
  tagline: 'Purchase Order Funding, Simplified',
  logoUrl: 'https://zoefwpwayxumvggfkisz.supabase.co/storage/v1/object/public/email-assets/mypo-logo.png',
  siteUrl: 'https://www.mypo.co.za',
  supportEmail: 'info@mypo.co.za',
  address: 'Woodlands Office Park, 20 Woodlands Drive, Woodmead, Johannesburg, 2191',
  year: new Date().getUTCFullYear(),
} as const

const COLORS = {
  primary: '#141d33', primaryForeground: '#f5f8fb',
  accent: '#16a085', background: '#f6f8fa', surface: '#ffffff',
  foreground: '#0f172a', muted: '#64748b', border: '#cbd2dc',
} as const

const FONT_STACK = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const styles = {
  body: { backgroundColor: COLORS.background, fontFamily: FONT_STACK, margin: 0, padding: '32px 0', color: COLORS.foreground } as const,
  container: { backgroundColor: COLORS.surface, maxWidth: '560px', margin: '0 auto', borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' } as const,
  header: { backgroundColor: COLORS.primary, padding: '28px 32px', textAlign: 'center' as const },
  logo: { height: '44px', width: 'auto', margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' } as const,
  content: { padding: '40px 32px 32px' } as const,
  h1: { fontFamily: FONT_STACK, fontSize: '24px', fontWeight: 700, color: COLORS.foreground, letterSpacing: '-0.01em', margin: '0 0 16px', lineHeight: '1.25' } as const,
  text: { fontFamily: FONT_STACK, fontSize: '15px', color: COLORS.foreground, lineHeight: '1.6', margin: '0 0 20px' } as const,
  mutedText: { fontFamily: FONT_STACK, fontSize: '13px', color: COLORS.muted, lineHeight: '1.6', margin: '0 0 16px' } as const,
  buttonWrap: { textAlign: 'center' as const, margin: '32px 0' },
  button: { backgroundColor: COLORS.accent, color: '#ffffff', fontFamily: FONT_STACK, fontSize: '15px', fontWeight: 600, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', letterSpacing: '0.01em' } as const,
  link: { color: COLORS.accent, textDecoration: 'underline' } as const,
  divider: { borderTop: `1px solid ${COLORS.border}`, margin: '32px 0 24px' } as const,
  code: { fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: '28px', fontWeight: 700, letterSpacing: '0.4em', color: COLORS.primary, backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '18px 24px', textAlign: 'center' as const, margin: '24px 0', display: 'block' } as const,
  footer: { backgroundColor: COLORS.background, padding: '24px 32px', borderTop: `1px solid ${COLORS.border}`, textAlign: 'center' as const } as const,
  footerText: { fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, lineHeight: '1.6', margin: '4px 0' } as const,
  footerLink: { color: COLORS.muted, textDecoration: 'underline' } as const,
}

// ─── Layout ──────────────────────────────────────────────────────────────────
const Layout = ({ preview, children }: { preview: string; children: React.ReactNode }) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Img src={BRAND.logoUrl} alt={BRAND.name} height={44} style={styles.logo} />
        </Section>
        <Section style={styles.content}>{children}</Section>
        <Section style={styles.footer}>
          <Text style={styles.footerText}><strong style={{ color: COLORS.foreground }}>{BRAND.name}</strong> — {BRAND.tagline}</Text>
          <Text style={styles.footerText}>{BRAND.address}</Text>
          <Text style={styles.footerText}>
            Questions? <Link href={`mailto:${BRAND.supportEmail}`} style={styles.footerLink}>{BRAND.supportEmail}</Link> · <Link href={BRAND.siteUrl} style={styles.footerLink}>mypo.co.za</Link>
          </Text>
          <Text style={{ ...styles.footerText, marginTop: '12px' }}>© {BRAND.year} {BRAND.name}. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ─── Templates ───────────────────────────────────────────────────────────────
const SignupEmail = ({ recipient, confirmationUrl }: any) => (
  <Layout preview={`Confirm your ${BRAND.name} account`}>
    <Heading style={styles.h1}>Confirm your email address</Heading>
    <Text style={styles.text}>
      Welcome to {BRAND.name}. To finish setting up your account for{' '}
      <Link href={`mailto:${recipient}`} style={styles.link}>{recipient}</Link>{' '}
      and access the funding marketplace, please verify this email address.
    </Text>
    <div style={styles.buttonWrap}><Button style={styles.button} href={confirmationUrl}>Verify email address</Button></div>
    <Text style={styles.mutedText}>Or copy and paste this link into your browser:<br /><Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link></Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>If you didn't create a {BRAND.name} account, you can safely ignore this email — no account will be created.</Text>
  </Layout>
)

const InviteEmail = ({ confirmationUrl }: any) => (
  <Layout preview={`You've been invited to join ${BRAND.name}`}>
    <Heading style={styles.h1}>You've been invited to {BRAND.name}</Heading>
    <Text style={styles.text}>You've been invited to join {BRAND.name} — South Africa's marketplace connecting suppliers with verified funders for purchase order financing.</Text>
    <Text style={styles.text}>Accept your invitation to create your account and get started.</Text>
    <div style={styles.buttonWrap}><Button style={styles.button} href={confirmationUrl}>Accept invitation</Button></div>
    <Text style={styles.mutedText}>Or copy and paste this link into your browser:<br /><Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link></Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>If you weren't expecting this invitation, you can safely ignore this email.</Text>
  </Layout>
)

const MagicLinkEmail = ({ confirmationUrl }: any) => (
  <Layout preview={`Your ${BRAND.name} sign-in link`}>
    <Heading style={styles.h1}>Sign in to {BRAND.name}</Heading>
    <Text style={styles.text}>Click the button below to securely sign in to your {BRAND.name} account. For your protection, this link expires shortly and can only be used once.</Text>
    <div style={styles.buttonWrap}><Button style={styles.button} href={confirmationUrl}>Sign in to {BRAND.name}</Button></div>
    <Text style={styles.mutedText}>Or copy and paste this link into your browser:<br /><Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link></Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>If you didn't request this sign-in link, you can safely ignore this email.</Text>
  </Layout>
)

const RecoveryEmail = ({ confirmationUrl }: any) => (
  <Layout preview={`Reset your ${BRAND.name} password`}>
    <Heading style={styles.h1}>Reset your password</Heading>
    <Text style={styles.text}>We received a request to reset the password on your {BRAND.name} account. Choose a new password by clicking the button below.</Text>
    <div style={styles.buttonWrap}><Button style={styles.button} href={confirmationUrl}>Reset password</Button></div>
    <Text style={styles.mutedText}>Or copy and paste this link into your browser:<br /><Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link></Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>For your security, this link will expire shortly. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</Text>
  </Layout>
)

const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: any) => (
  <Layout preview={`Confirm your ${BRAND.name} email change`}>
    <Heading style={styles.h1}>Confirm your email change</Heading>
    <Text style={styles.text}>
      We received a request to change the email address on your {BRAND.name} account from{' '}
      <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link> to{' '}
      <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
    </Text>
    <Text style={styles.text}>Please confirm this change to keep your account secure.</Text>
    <div style={styles.buttonWrap}><Button style={styles.button} href={confirmationUrl}>Confirm email change</Button></div>
    <Text style={styles.mutedText}>Or copy and paste this link into your browser:<br /><Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link></Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>If you didn't request this change, please contact us immediately at <Link href={`mailto:${BRAND.supportEmail}`} style={styles.link}>{BRAND.supportEmail}</Link> to secure your account.</Text>
  </Layout>
)

const ReauthenticationEmail = ({ token }: any) => (
  <Layout preview={`Your ${BRAND.name} verification code`}>
    <Heading style={styles.h1}>Confirm it's you</Heading>
    <Text style={styles.text}>Use the verification code below to confirm your identity on {BRAND.name}.</Text>
    <div style={styles.code}>{token}</div>
    <Text style={styles.mutedText}>This code expires shortly. Never share it with anyone — {BRAND.name} staff will never ask for it.</Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>If you didn't request this code, you can safely ignore this email.</Text>
  </Layout>
)

// ─── Hook handler ────────────────────────────────────────────────────────────
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
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!hookSecret || !resendKey) {
    console.error('Missing SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY')
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const secret = hookSecret.replace(/^v1,whsec_/, '')

  let data: any
  try {
    const wh = new Webhook(secret)
    data = wh.verify(payload, headers)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const user = data.user ?? {}
  const ed = data.email_data ?? {}
  const actionType: string = ed.email_action_type
  const Template = TEMPLATES[actionType]
  if (!Template) {
    console.error('Unknown email action type:', actionType)
    return new Response(JSON.stringify({ error: `Unknown action type: ${actionType}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const SUPABASE_AUTH_URL = 'https://fbvorxcacflvqnxhtybw.supabase.co/auth/v1/verify'
  const confirmationUrl = `${SUPABASE_AUTH_URL}?token=${ed.token_hash}&type=${actionType}&redirect_to=${encodeURIComponent(ed.redirect_to ?? SITE_URL)}`

  const props = {
    siteName: SITE_NAME, siteUrl: SITE_URL, recipient: user.email,
    confirmationUrl, token: ed.token, email: user.email,
    oldEmail: user.email, newEmail: ed.new_email ?? user.new_email,
  }

  const html = await renderAsync(React.createElement(Template, props))
  const text = await renderAsync(React.createElement(Template, props), { plainText: true })

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS, to: [user.email],
    subject: SUBJECTS[actionType] ?? 'Notification', html, text,
  })

  if (error) {
    console.error('Resend send failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  console.log(`Sent ${actionType} email to ${user.email}`)
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
