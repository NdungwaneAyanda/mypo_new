/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <BrandLayout preview={`Reset your ${BRAND.name} password`}>
    <Heading style={styles.h1}>Reset your password</Heading>
    <Text style={styles.text}>
      We received a request to reset the password on your {BRAND.name} account.
      Choose a new password by clicking the button below.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Reset password
      </Button>
    </div>
    <Text style={styles.mutedText}>
      Or copy and paste this link into your browser:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      For your security, this link will expire shortly. If you didn't request a
      password reset, you can safely ignore this email — your password will
      remain unchanged.
    </Text>
  </BrandLayout>
);

export default RecoveryEmail;
