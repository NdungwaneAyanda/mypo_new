// MyPO brand tokens for transactional/auth emails.
// Mirrors src/index.css design tokens so emails feel like the app.

export const BRAND = {
  name: 'MyPO',
  tagline: 'Purchase Order Funding, Simplified',
  logoUrl:
    'https://zoefwpwayxumvggfkisz.supabase.co/storage/v1/object/public/email-assets/mypo-logo.png',
  siteUrl: 'https://www.mypo.co.za',
  supportEmail: 'info@mypo.co.za',
  address: 'Woodlands Office Park, 20 Woodlands Drive, Woodmead, Johannesburg, 2191',
  year: new Date().getUTCFullYear(),
} as const;

// Colors derived from src/index.css (HSL → hex for email-client compatibility)
export const COLORS = {
  primary: '#141d33',        // hsl(222 47% 15%)
  primaryDark: '#0b1426',    // deeper navy
  primaryForeground: '#f5f8fb',
  accent: '#16a085',         // hsl(168 76% 36%)
  accentDark: '#0e7765',
  background: '#f6f8fa',     // hsl(210 20% 98%)
  surface: '#ffffff',
  foreground: '#0f172a',     // hsl(222 47% 11%)
  muted: '#64748b',          // hsl(215 16% 47%)
  border: '#cbd2dc',         // hsl(216 12% 77%)
  subtle: '#94a3b8',
} as const;

export const FONT_STACK =
  "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const styles = {
  body: {
    backgroundColor: COLORS.background,
    fontFamily: FONT_STACK,
    margin: 0,
    padding: '32px 0',
    color: COLORS.foreground,
  } as const,
  container: {
    backgroundColor: COLORS.surface,
    maxWidth: '560px',
    margin: '0 auto',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  } as const,
  header: {
    backgroundColor: COLORS.primary,
    padding: '28px 32px',
    textAlign: 'center' as const,
  },
  logo: {
    height: '44px',
    width: 'auto',
    margin: '0 auto',
    display: 'block',
    filter: 'brightness(0) invert(1)',
  } as const,
  content: { padding: '40px 32px 32px' } as const,
  h1: {
    fontFamily: FONT_STACK,
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.foreground,
    letterSpacing: '-0.01em',
    margin: '0 0 16px',
    lineHeight: '1.25',
  } as const,
  text: {
    fontFamily: FONT_STACK,
    fontSize: '15px',
    color: COLORS.foreground,
    lineHeight: '1.6',
    margin: '0 0 20px',
  } as const,
  mutedText: {
    fontFamily: FONT_STACK,
    fontSize: '13px',
    color: COLORS.muted,
    lineHeight: '1.6',
    margin: '0 0 16px',
  } as const,
  buttonWrap: { textAlign: 'center' as const, margin: '32px 0' },
  button: {
    backgroundColor: COLORS.accent,
    color: '#ffffff',
    fontFamily: FONT_STACK,
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '10px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    letterSpacing: '0.01em',
  } as const,
  link: { color: COLORS.accent, textDecoration: 'underline' } as const,
  divider: {
    borderTop: `1px solid ${COLORS.border}`,
    margin: '32px 0 24px',
  } as const,
  code: {
    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '0.4em',
    color: COLORS.primary,
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '10px',
    padding: '18px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
    display: 'block',
  } as const,
  footer: {
    backgroundColor: COLORS.background,
    padding: '24px 32px',
    borderTop: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  } as const,
  footerText: {
    fontFamily: FONT_STACK,
    fontSize: '12px',
    color: COLORS.muted,
    lineHeight: '1.6',
    margin: '4px 0',
  } as const,
  footerLink: {
    color: COLORS.muted,
    textDecoration: 'underline',
  } as const,
};
