/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as funderNewOpportunity } from './funder-new-opportunity.tsx'
import { template as supplierApplicationAccepted } from './supplier-application-accepted.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'funder-new-opportunity': funderNewOpportunity,
  'supplier-application-accepted': supplierApplicationAccepted,
}
