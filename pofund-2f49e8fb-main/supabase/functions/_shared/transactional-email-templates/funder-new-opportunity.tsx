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

interface FunderNewOpportunityProps {
  funderName?: string
  companyName?: string
  poAmount?: number
  amountNeeded?: number
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

const FunderNewOpportunityEmail = ({
  funderName,
  companyName = 'A supplier',
  poAmount,
  amountNeeded,
  refCode,
  dashboardUrl = `${BRAND.siteUrl}/dashboard`,
}: FunderNewOpportunityProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>
      New PO funding opportunity from {companyName} — {formatZAR(amountNeeded)} needed
    </Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Img src={BRAND.logoUrl} alt={BRAND.name} height={44} style={styles.logo} />
        </Section>
        <Section style={styles.content}>
          <Heading style={styles.h1}>New funding opportunity</Heading>
          <Text style={styles.text}>
            Hi {funderName || 'Funder'},
          </Text>
          <Text style={styles.text}>
            A new Purchase Order funding application has just been submitted on{' '}
            {BRAND.name} and matches your funder profile. Review the
            opportunity below and reach out to the supplier if you'd like to
            fund it.
          </Text>

          <Section style={summaryBox}>
            <Text style={summaryRow}>
              <span style={summaryLabel}>Supplier</span>
              <span style={summaryValue}>{companyName}</span>
            </Text>
            <Text style={summaryRow}>
              <span style={summaryLabel}>PO value</span>
              <span style={summaryValue}>{formatZAR(poAmount)}</span>
            </Text>
            <Text style={summaryRow}>
              <span style={summaryLabel}>Funding needed</span>
              <span style={summaryValue}>{formatZAR(amountNeeded)}</span>
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
              View opportunity
            </Button>
          </div>

          <Text style={styles.mutedText}>
            Or open your dashboard:{' '}
            <Link href={dashboardUrl} style={styles.link}>
              {dashboardUrl}
            </Link>
          </Text>
          <div style={styles.divider} />
          <Text style={styles.mutedText}>
            You're receiving this because you're a verified funder on {BRAND.name}.
            Opportunities are time-sensitive — suppliers typically need funding
            decisions quickly.
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
  component: FunderNewOpportunityEmail,
  subject: ({ companyName }: FunderNewOpportunityProps = {}) =>
    `New PO funding opportunity${companyName ? ` from ${companyName}` : ''}`,
  displayName: 'Funder: new opportunity',
  previewData: {
    funderName: 'Thandi',
    companyName: 'Acme Trading (Pty) Ltd',
    poAmount: 1250000,
    amountNeeded: 875000,
    refCode: 'APP-0042',
    dashboardUrl: 'https://www.mypo.co.za/dashboard',
  },
} satisfies TemplateEntry
