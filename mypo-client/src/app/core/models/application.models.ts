export interface CreateApplicationDto {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  poAmount: number;
  costOfDelivery: number;
  amountNeeded: number;
  customerName: string;
  paymentTerms: string;
  description?: string;
}

export interface DocumentDto {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export const APPLICATION_DOC_TYPES: { type: string; label: string; required: boolean }[] = [
  { type: 'purchase_order',            label: 'Purchase Order',                required: true  },
  { type: 'quote_submitted',           label: 'Quote Submitted',               required: false },
  { type: 'company_registration',      label: 'Company Registration Document', required: false },
  { type: 'bank_confirmation',         label: 'Bank Confirmation Letter',      required: false },
  { type: 'director_id',               label: 'Director ID',                   required: false },
  { type: 'company_proof_of_address',  label: 'Company Proof of Address',      required: false },
  { type: 'director_proof_of_address', label: 'Director Proof of Address',     required: false },
];

export interface ApplicationDto {
  id: string;
  userId?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  poAmount: number;
  costOfDelivery: number;
  amountNeeded: number;
  customerName: string;
  paymentTerms: string;
  description?: string;
  status: string;
  refCode?: string;
  assignedFunderId?: string;
  assignedFunderUserId?: string;
  assignedFunderCompany?: string;
  platformFeePercent: number;
  estimatedPlatformFee: number;
  platformFeeAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  documents: DocumentDto[];
}

export interface MessageDto {
  id: string;
  applicationId: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  messageText: string;
  isRead: boolean;
  createdAt: string;
}

export interface RegisterFunderDto {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite?: string;
  yearsInBusiness?: number;
  fundingCapacity?: string;
  fundingDescription?: string;
  industries: string[];
  minPoAmount?: number;
  maxPoAmount?: number;
}

export interface FunderDto {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite?: string;
  yearsInBusiness?: number;
  fundingCapacity?: string;
  fundingDescription?: string;
  industries: string[];
  minPoAmount?: number;
  maxPoAmount?: number;
  isActive: boolean;
  refCode?: string;
  createdAt: string;
}
