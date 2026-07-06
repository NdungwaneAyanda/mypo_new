/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <BrandLayout preview={`Confirm your ${BRAND.name} account`}>
    <Heading style={styles.h1}>Confirm your email address</Heading>
    <Text style={styles.text}>
      Welcome to {BRAND.name}. To finish setting up your account for{' '}
      <Link href={`mailto:${recipient}`} style={styles.link}>{recipient}</Link>{' '}
      and access the funding marketplace, please verify this email address.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Verify email address
      </Button>
    </div>
    <Text style={styles.mutedText}>
      Or copy and paste this link into your browser:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      If you didn't create a {BRAND.name} account, you can safely ignore this
      email — no account will be created.
    </Text>
  </BrandLayout>
);

export default SignupEmail;
