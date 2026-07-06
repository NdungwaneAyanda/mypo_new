/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, COLORS, styles } from '../email-templates/brand.ts'
import type { TemplateEntry } from './registry.ts'

interface SupplierApplicationAcceptedProps {
  supplierName?: string
  companyName?: string
  funderName?: string
  poAmount?: number
  refCode?: string
  dashboardUrl?: string
}

const formatZAR = (value?: number) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
      }).format(value)
    : 'N/A'

const SupplierApplicationAcceptedEmail = ({
  supplierName,
  companyName,
  funderName = 'A verified funder',
  poAmount,
  refCode,
  dashboardUrl = `${BRAND.siteUrl}/dashboard`,
}: SupplierApplicationAcceptedProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>
      {funderName} has accepted your PO funding application
    </Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Img src={BRAND.logoUrl} alt={BRAND.name} height={44} style={styles.logo} />
        </Section>
        <Section style={styles.content}>
          <Heading style={styles.h1}>Your application has been accepted</Heading>
          <Text style={styles.text}>
            Hi {supplierName || 'there'},
          </Text>
          <Text style={styles.text}>
            Great news — <strong>{funderName}</strong> has accepted your PO
            funding application{companyName ? ` for ${companyName}` : ''}. You
            can now message the funder directly inside your dashboard to
            finalise the funding arrangement.
          </Text>

          <Section style={summaryBox}>
            <Text style={summaryRow}>
              <span style={summaryLabel}>Funder</span>
              <span style={summaryValue}>{funderName}</span>
            </Text>
            <Text style={summaryRow}>
              <span style={summaryLabel}>PO value</span>
              <span style={summaryValue}>{formatZAR(poAmount)}</span>
            </Text>
            {refCode && (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Reference</span>
                <span style={summaryValue}>{refCode}</span>
              </Text>
            )}
          </Section>

          <div style={styles.buttonWrap}>
            <Button style={styles.button} href={dashboardUrl}>
              Open dashboard
            </Button>
          </div>

          <Text style={styles.mutedText}>
            Or paste this into your browser:{' '}
            <Link href={dashboardUrl} style={styles.link}>
              {dashboardUrl}
            </Link>
          </Text>
          <div style={styles.divider} />
          <Text style={styles.mutedText}>
            For your security, all funding terms and document exchanges should
            happen through the {BRAND.name} platform. If anything looks off,
            contact us at{' '}
            <Link href={`mailto:${BRAND.supportEmail}`} style={styles.link}>
              {BRAND.supportEmail}
            </Link>
            .
          </Text>
        </Section>
        <Section style={styles.footer}>
          <Text style={styles.footerText}>
            <strong style={{ color: COLORS.foreground }}>{BRAND.name}</strong>{' '}
            — {BRAND.tagline}
          </Text>
          <Text style={styles.footerText}>{BRAND.address}</Text>
          <Text style={styles.footerText}>
            Questions?{' '}
            <Link href={`mailto:${BRAND.supportEmail}`} style={styles.footerLink}>
              {BRAND.supportEmail}
            </Link>{' '}
            ·{' '}
            <Link href={BRAND.siteUrl} style={styles.footerLink}>
              mypo.co.za
            </Link>
          </Text>
          <Text style={{ ...styles.footerText, marginTop: '12px' }}>
            © {BRAND.year} {BRAND.name}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const summaryBox = {
  backgroundColor: COLORS.background,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '24px 0',
} as const

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  margin: '6px 0',
  color: COLORS.foreground,
} as const

const summaryLabel = {
  color: COLORS.muted,
  fontWeight: 500,
  marginRight: '16px',
} as const

const summaryValue = {
  fontWeight: 600,
  color: COLORS.foreground,
} as const

export const template = {
  component: SupplierApplicationAcceptedEmail,
  subject: 'Your PO funding application has been accepted',
  displayName: 'Supplier: application accepted',
  previewData: {
    supplierName: 'Sipho',
    companyName: 'Acme Trading (Pty) Ltd',
    funderName: 'Horizon Capital',
    poAmount: 1250000,
    refCode: 'APP-0042',
    dashboardUrl: 'https://www.mypo.co.za/dashboard',
  },
} satisfies TemplateEntry
