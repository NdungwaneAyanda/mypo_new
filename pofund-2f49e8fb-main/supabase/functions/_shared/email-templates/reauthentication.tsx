/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1';
import { Heading, Text } from 'npm:@react-email/components@0.0.22';
import { BRAND, styles } from './brand.ts';
import BrandLayout from './_layout.tsx';

interface ReauthenticationEmailProps {
  token: string;
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <BrandLayout preview={`Your ${BRAND.name} verification code`}>
    <Heading style={styles.h1}>Confirm it's you</Heading>
    <Text style={styles.text}>
      Use the verification code below to confirm your identity on {BRAND.name}.
    </Text>
    <div style={styles.code}>{token}</div>
    <Text style={styles.mutedText}>
      This code expires shortly. Never share it with anyone — {BRAND.name} staff
      will never ask for it.
    </Text>
    <div style={styles.divider} />
    <Text style={styles.mutedText}>
      If you didn't request this code, you can safely ignore this email.
    </Text>
  </BrandLayout>
);

export default ReauthenticationEmail;
