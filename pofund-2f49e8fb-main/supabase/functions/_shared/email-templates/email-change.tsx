/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface EmailChangeEmailProps {
  siteName: string;
  oldEmail: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <BrandLayout preview={`Confirm your ${BRAND.name} email change`}>
    <Heading style={styles.h1}>Confirm your email change</Heading>
    <Text style={styles.text}>
      We received a request to change the email address on your {BRAND.name}{' '}
      account from{' '}
      <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}
      to{' '}
      <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
    </Text>
    <Text style={styles.text}>
      Please confirm this change to keep your account secure.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Confirm email change
      </Button>
    </div>
    <Text style={styles.mutedText}>
      Or copy and paste this link into your browser:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      If you didn't request this change, please contact us immediately at{' '}
      <Link href={`mailto:${BRAND.supportEmail}`} style={styles.link}>
        {BRAND.supportEmail}
      </Link>{' '}
      to secure your account.
    </Text>
  </BrandLayout>
);

export default EmailChangeEmail;
