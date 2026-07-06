/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface InviteEmailProps {
  siteName: string;
  siteUrl: string;
  confirmationUrl: string;
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <BrandLayout preview={`You've been invited to join ${BRAND.name}`}>
    <Heading style={styles.h1}>You've been invited to {BRAND.name}</Heading>
    <Text style={styles.text}>
      You've been invited to join {BRAND.name} — South Africa's marketplace
      connecting suppliers with verified funders for purchase order financing.
    </Text>
    <Text style={styles.text}>
      Accept your invitation to create your account and get started.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Accept invitation
      </Button>
    </div>
    <Text style={styles.mutedText}>
      Or copy and paste this link into your browser:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      If you weren't expecting this invitation, you can safely ignore this email.
    </Text>
  </BrandLayout>
);

export default InviteEmail;
