/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <BrandLayout preview={`Your ${BRAND.name} sign-in link`}>
    <Heading style={styles.h1}>Sign in to {BRAND.name}</Heading>
    <Text style={styles.text}>
      Click the button below to securely sign in to your {BRAND.name} account.
      For your protection, this link expires shortly and can only be used once.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Sign in to {BRAND.name}
      </Button>
    </div>
    <Text style={styles.mutedText}>
      Or copy and paste this link into your browser:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      If you didn't request this sign-in link, you can safely ignore this email.
    </Text>
  </BrandLayout>
);

export default MagicLinkEmail;
