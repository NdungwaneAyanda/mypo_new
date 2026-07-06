/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import { BRAND, COLORS, styles } from './brand.ts';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const BrandLayout = ({ preview, children }: LayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Img
            src={BRAND.logoUrl}
            alt={BRAND.name}
            height={44}
            style={styles.logo}
          />
        </Section>
        <Section style={styles.content}>{children}</Section>
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
);

export default BrandLayout;
